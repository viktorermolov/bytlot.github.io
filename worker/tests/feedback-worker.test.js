import assert from "node:assert/strict";
import test from "node:test";

import {
  createFeedbackHandler,
  validateFeedbackPayload,
  verifyTurnstileToken
} from "../src/index.js";

const ORIGIN = "https://bytlot.com";

function validPayload(overrides = {}) {
  const payload = {
    feedbackType: "suggestion",
    message: "Please explain the depreciation estimate more clearly.",
    turnstileToken: "valid-turnstile-token",
    context: {
      pagePath: "/",
      calculatorMode: "shift",
      appVersion: "20260831-feedback",
      viewportCategory: "desktop"
    }
  };

  return {
    ...payload,
    ...overrides,
    context: overrides.context === undefined
      ? payload.context
      : { ...payload.context, ...overrides.context }
  };
}

function feedbackRequest(payload = validPayload(), options = {}) {
  const body = options.rawBody ?? JSON.stringify(payload);
  return new Request(options.url || "https://bytlot.com/api/feedback", {
    method: options.method || "POST",
    headers: {
      Origin: options.origin === undefined ? ORIGIN : options.origin,
      "Content-Type": options.contentType === undefined ? "application/json" : options.contentType,
      ...options.headers
    },
    body
  });
}

function createEnvironment(options = {}) {
  const inserts = [];
  const rateLimitCalls = [];
  const environment = {
    ALLOWED_ORIGIN: ORIGIN,
    EXPECTED_TURNSTILE_HOSTNAME: "bytlot.com",
    TURNSTILE_ACTION: "feedback_submit",
    TURNSTILE_SECRET_KEY: "test-secret",
    FEEDBACK_RATE_LIMITER: {
      async limit(input) {
        rateLimitCalls.push(input);
        if (options.rateLimitThrows) throw new Error("rate limiter unavailable");
        return { success: options.rateAllowed !== false };
      }
    },
    FEEDBACK_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                if (options.databaseThrows) throw new Error("database unavailable");
                inserts.push({ sql, values });
                if (options.databaseResult) return options.databaseResult;
                return { success: true, meta: { changes: 1 } };
              }
            };
          }
        };
      }
    }
  };
  return { environment, inserts, rateLimitCalls };
}

function createHarness(options = {}) {
  const verificationTokens = [];
  const { environment, inserts, rateLimitCalls } = createEnvironment(options);
  const handler = createFeedbackHandler({
    async verifyToken(token) {
      verificationTokens.push(token);
      return options.verification || { valid: true, unavailable: false };
    }
  });
  return { handler, environment, inserts, rateLimitCalls, verificationTokens };
}

async function responseBody(response) {
  return response.json();
}

test("valid feedback is verified and inserted exactly once", async () => {
  const harness = createHarness();
  const payload = validPayload({
    feedbackType: "bug",
    message: "  A quote ' and <script> text stay literal.\r\nNothing executes.  ",
    context: { calculatorMode: "offer", viewportCategory: "mobile" }
  });
  const response = await harness.handler(feedbackRequest(payload), harness.environment);

  assert.equal(response.status, 201);
  assert.deepEqual(await responseBody(response), { ok: true });
  assert.deepEqual(harness.rateLimitCalls, [{ key: "feedback:submit" }]);
  assert.deepEqual(harness.verificationTokens, ["valid-turnstile-token"]);
  assert.equal(harness.inserts.length, 1);
  assert.deepEqual(harness.inserts[0].values, [
    "bug",
    "A quote ' and <script> text stay literal.\nNothing executes.",
    "driver-profit",
    "/",
    "offer",
    "20260831-feedback",
    "mobile"
  ]);
  assert.doesNotMatch(harness.inserts[0].sql, /valid-turnstile-token/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
});

test("message validation covers missing, blank, short, long, and Unicode boundaries", () => {
  assert.equal(validateFeedbackPayload(validPayload({ message: undefined })), null);
  assert.equal(validateFeedbackPayload(validPayload({ message: "      " })), null);
  assert.equal(validateFeedbackPayload(validPayload({ message: "123456789" })), null);
  assert.ok(validateFeedbackPayload(validPayload({ message: "1234567890" })));
  assert.ok(validateFeedbackPayload(validPayload({ message: "🙂".repeat(2000) })));
  assert.equal(validateFeedbackPayload(validPayload({ message: "🙂".repeat(2001) })), null);
  assert.equal(validateFeedbackPayload(validPayload({ message: `valid text\u0000` })), null);
  assert.equal(validateFeedbackPayload(validPayload({ message: `valid text\u0085` })), null);
});

test("invalid feedback types and client-controlled server fields are rejected", () => {
  assert.equal(validateFeedbackPayload(validPayload({ feedbackType: "complaint" })), null);
  assert.equal(validateFeedbackPayload({ ...validPayload(), status: "resolved" }), null);
  assert.equal(validateFeedbackPayload({ ...validPayload(), product: "anything" }), null);
  assert.equal(validateFeedbackPayload({ ...validPayload(), createdAt: "2026-01-01" }), null);
});

test("malformed JSON, arrays, primitives, and unknown context keys are rejected", async (t) => {
  const cases = [
    { name: "malformed", request: feedbackRequest(null, { rawBody: "{" }) },
    { name: "array", request: feedbackRequest([], { rawBody: "[]" }) },
    { name: "primitive", request: feedbackRequest(null, { rawBody: "true" }) },
    {
      name: "unknown context",
      request: feedbackRequest(validPayload({ context: { exactWidth: 1440 } }))
    }
  ];

  for (const entry of cases) {
    await t.test(entry.name, async () => {
      const harness = createHarness();
      const response = await harness.handler(entry.request, harness.environment);
      assert.equal(response.status, 400);
      assert.equal(harness.inserts.length, 0);
      assert.equal(harness.verificationTokens.length, 0);
    });
  }
});

test("declared and streamed bodies above 16 KiB are rejected", async (t) => {
  await t.test("declared length", async () => {
    const harness = createHarness();
    const request = feedbackRequest(validPayload(), { headers: { "Content-Length": "20000" } });
    const response = await harness.handler(request, harness.environment);
    assert.equal(response.status, 413);
    assert.equal(harness.inserts.length, 0);
  });

  await t.test("actual length", async () => {
    const harness = createHarness();
    const request = feedbackRequest(validPayload({ message: "a".repeat(17000) }));
    const response = await harness.handler(request, harness.environment);
    assert.equal(response.status, 413);
    assert.equal(harness.inserts.length, 0);
  });
});

test("wrong origin and media type are rejected", async (t) => {
  await t.test("origin", async () => {
    const harness = createHarness();
    const response = await harness.handler(
      feedbackRequest(validPayload(), { origin: "https://example.com" }),
      harness.environment
    );
    assert.equal(response.status, 403);
    assert.equal(harness.inserts.length, 0);
  });

  await t.test("media type", async () => {
    const harness = createHarness();
    const response = await harness.handler(
      feedbackRequest(validPayload(), { contentType: "text/plain" }),
      harness.environment
    );
    assert.equal(response.status, 415);
    assert.equal(harness.inserts.length, 0);
  });

  await t.test("JSON charset is accepted", async () => {
    const harness = createHarness();
    const response = await harness.handler(
      feedbackRequest(validPayload(), { contentType: "application/json; charset=utf-8" }),
      harness.environment
    );
    assert.equal(response.status, 201);
  });
});

test("GET, PUT, DELETE, and OPTIONS receive 405 without side effects", async (t) => {
  for (const method of ["GET", "PUT", "DELETE", "OPTIONS"]) {
    await t.test(method, async () => {
      const harness = createHarness();
      const request = new Request("https://bytlot.com/api/feedback", {
        method,
        headers: { Origin: ORIGIN }
      });
      const response = await harness.handler(request, harness.environment);
      assert.equal(response.status, 405);
      assert.equal(response.headers.get("Allow"), "POST");
      assert.equal(harness.inserts.length, 0);
    });
  }
});

test("wrong path or query string does not reach the endpoint", async (t) => {
  for (const url of [
    "https://bytlot.com/api/feedback/",
    "https://bytlot.com/api/feedback?source=test",
    "https://bytlot.com/api/other"
  ]) {
    await t.test(url, async () => {
      const harness = createHarness();
      const response = await harness.handler(feedbackRequest(validPayload(), { url }), harness.environment);
      assert.equal(response.status, 404);
      assert.equal(harness.inserts.length, 0);
    });
  }
});

test("invalid context and Turnstile tokens are rejected before rate limiting", () => {
  assert.equal(validateFeedbackPayload(validPayload({ context: { pagePath: "/other" } })), null);
  assert.equal(validateFeedbackPayload(validPayload({ context: { calculatorMode: "history" } })), null);
  assert.equal(validateFeedbackPayload(validPayload({ context: { viewportCategory: "wide" } })), null);
  assert.equal(validateFeedbackPayload(validPayload({ context: { appVersion: "spaces are invalid" } })), null);
  assert.equal(validateFeedbackPayload(validPayload({ turnstileToken: "" })), null);
  assert.equal(validateFeedbackPayload(validPayload({ turnstileToken: "x".repeat(2049) })), null);
});

test("rate-limit denial returns 429 after Turnstile and before D1", async () => {
  const harness = createHarness({ rateAllowed: false });
  const response = await harness.handler(feedbackRequest(), harness.environment);

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.deepEqual(harness.verificationTokens, ["valid-turnstile-token"]);
  assert.equal(harness.inserts.length, 0);
});

test("rate limiter failure is closed as temporarily unavailable", async () => {
  const harness = createHarness({ rateLimitThrows: true });
  const response = await harness.handler(feedbackRequest(), harness.environment);
  assert.equal(response.status, 503);
  assert.deepEqual(harness.verificationTokens, ["valid-turnstile-token"]);
  assert.equal(harness.inserts.length, 0);
});

test("Turnstile rejection and outage never insert feedback", async (t) => {
  for (const scenario of [
    { name: "rejected", verification: { valid: false, unavailable: false }, status: 403 },
    { name: "unavailable", verification: { valid: false, unavailable: true }, status: 503 }
  ]) {
    await t.test(scenario.name, async () => {
      const harness = createHarness({ verification: scenario.verification });
      const response = await harness.handler(feedbackRequest(), harness.environment);
      assert.equal(response.status, scenario.status);
      assert.equal(harness.rateLimitCalls.length, 0);
      assert.equal(harness.inserts.length, 0);
      const body = JSON.stringify(await responseBody(response));
      assert.doesNotMatch(body, /valid-turnstile-token|test-secret|depreciation estimate/);
    });
  }
});

test("database throws, unsuccessful writes, and zero-change writes return 503", async (t) => {
  const scenarios = [
    { name: "throw", options: { databaseThrows: true } },
    { name: "unsuccessful", options: { databaseResult: { success: false, meta: { changes: 0 } } } },
    { name: "zero changes", options: { databaseResult: { success: true, meta: { changes: 0 } } } }
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      const harness = createHarness(scenario.options);
      const response = await harness.handler(feedbackRequest(), harness.environment);
      assert.equal(response.status, 503);
      const body = JSON.stringify(await responseBody(response));
      assert.doesNotMatch(body, /database|feedback table|depreciation estimate/i);
    });
  }
});

test("missing production bindings fail closed", async () => {
  const harness = createHarness();
  delete harness.environment.TURNSTILE_SECRET_KEY;
  const response = await harness.handler(feedbackRequest(), harness.environment);
  assert.equal(response.status, 503);
  assert.equal(harness.verificationTokens.length, 0);
  assert.equal(harness.inserts.length, 0);
});

test("Siteverify sends no IP and validates success, hostname, and action", async (t) => {
  const environment = {
    TURNSTILE_SECRET_KEY: "secret-value",
    EXPECTED_TURNSTILE_HOSTNAME: "bytlot.com",
    TURNSTILE_ACTION: "feedback_submit"
  };

  await t.test("valid response", async () => {
    let sentBody;
    const result = await verifyTurnstileToken("token-value", environment, async (_url, init) => {
      sentBody = JSON.parse(init.body);
      return Response.json({ success: true, hostname: "bytlot.com", action: "feedback_submit" });
    });
    assert.deepEqual(result, { valid: true, unavailable: false });
    assert.deepEqual(sentBody, { secret: "secret-value", response: "token-value" });
    assert.equal("remoteip" in sentBody, false);
  });

  for (const mismatch of [
    { success: false, hostname: "bytlot.com", action: "feedback_submit" },
    { success: true, hostname: "example.com", action: "feedback_submit" },
    { success: true, hostname: "bytlot.com", action: "other_action" }
  ]) {
    await t.test(JSON.stringify(mismatch), async () => {
      const result = await verifyTurnstileToken("token", environment, async () => Response.json(mismatch));
      assert.deepEqual(result, { valid: false, unavailable: false });
    });
  }
});

test("Siteverify transport, 5xx, and malformed JSON failures are unavailable", async (t) => {
  const environment = {
    TURNSTILE_SECRET_KEY: "secret",
    EXPECTED_TURNSTILE_HOSTNAME: "bytlot.com",
    TURNSTILE_ACTION: "feedback_submit"
  };
  const implementations = [
    async () => { throw new Error("network"); },
    async () => new Response("upstream error", { status: 503 }),
    async () => new Response("not-json", { status: 200 })
  ];

  for (const [index, implementation] of implementations.entries()) {
    await t.test(String(index), async () => {
      const result = await verifyTurnstileToken("token", environment, implementation);
      assert.deepEqual(result, { valid: false, unavailable: true });
    });
  }
});
