import assert from "node:assert/strict";
import test from "node:test";

import { verifyLocalTurnstileToken } from "../src/local.js";

const LOCAL_ENVIRONMENT = {
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  EXPECTED_TURNSTILE_HOSTNAME: "example.com",
  TURNSTILE_ACTION: "test"
};

test("local Turnstile verifier accepts only Cloudflare's documented dummy pair", async () => {
  assert.deepEqual(
    await verifyLocalTurnstileToken("XXXX.DUMMY.TOKEN.XXXX", LOCAL_ENVIRONMENT),
    { valid: true, unavailable: false }
  );

  for (const [token, environment] of [
    ["wrong-token", LOCAL_ENVIRONMENT],
    ["XXXX.DUMMY.TOKEN.XXXX", { ...LOCAL_ENVIRONMENT, TURNSTILE_SECRET_KEY: "wrong-secret" }],
    ["XXXX.DUMMY.TOKEN.XXXX", { ...LOCAL_ENVIRONMENT, EXPECTED_TURNSTILE_HOSTNAME: "bytlot.com" }],
    ["XXXX.DUMMY.TOKEN.XXXX", { ...LOCAL_ENVIRONMENT, TURNSTILE_ACTION: "feedback_submit" }]
  ]) {
    assert.deepEqual(
      await verifyLocalTurnstileToken(token, environment),
      { valid: false, unavailable: false }
    );
  }
});
