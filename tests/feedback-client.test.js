import assert from "node:assert/strict";
import test from "node:test";

import {
  appVersionFromModuleUrl,
  buildFeedbackPayload,
  isStoredFeedbackResponse,
  messageCharacterCount,
  normalizedFeedbackMessage,
  submitFeedbackRequest,
  validateFeedbackDraft,
  viewportCategory
} from "../js/feedback.js";

test("feedback message validation trims text and enforces Unicode boundaries", () => {
  assert.deepEqual(validateFeedbackDraft("", "A useful message"), {
    valid: false,
    field: "type",
    message: "Choose a feedback type."
  });
  assert.equal(validateFeedbackDraft("bug", "123456789").valid, false);
  assert.deepEqual(validateFeedbackDraft("bug", "  1234567890\r\n  "), {
    valid: true,
    message: "1234567890"
  });
  assert.equal(validateFeedbackDraft("other", "🙂".repeat(2000)).valid, true);
  assert.equal(validateFeedbackDraft("other", "🙂".repeat(2001)).valid, false);
  assert.deepEqual(validateFeedbackDraft("bug", "valid text\u0085"), {
    valid: false,
    field: "message",
    message: "Remove unsupported control characters."
  });
  assert.equal(messageCharacterCount("A🙂"), 2);
  assert.equal(messageCharacterCount(normalizedFeedbackMessage("  1234567890\r\n  ")), 10);
  assert.equal(messageCharacterCount(normalizedFeedbackMessage(`${"a".repeat(2000)}   `)), 2000);
});

test("feedback success requires the exact stored-response contract", async () => {
  assert.equal(await isStoredFeedbackResponse(Response.json({ ok: true }, { status: 201 })), true);
  assert.equal(await isStoredFeedbackResponse(Response.json({ ok: true }, { status: 200 })), false);
  assert.equal(await isStoredFeedbackResponse(Response.json({ ok: false }, { status: 201 })), false);
  assert.equal(await isStoredFeedbackResponse(Response.json({ ok: true, id: 1 }, { status: 201 })), false);
  assert.equal(await isStoredFeedbackResponse(new Response("ok", {
    status: 201,
    headers: { "Content-Type": "text/plain" }
  })), false);
});

test("viewport category matches the documented responsive boundaries", () => {
  assert.equal(viewportCategory(320), "mobile");
  assert.equal(viewportCategory(520), "mobile");
  assert.equal(viewportCategory(521), "tablet");
  assert.equal(viewportCategory(800), "tablet");
  assert.equal(viewportCategory(801), "desktop");
  assert.equal(viewportCategory(1440), "desktop");
});

test("feedback app version is derived only from a safe module query", () => {
  assert.equal(
    appVersionFromModuleUrl("https://bytlot.com/js/feedback.js?v=20260831-feedback"),
    "20260831-feedback"
  );
  assert.equal(appVersionFromModuleUrl("https://bytlot.com/js/feedback.js"), null);
  assert.equal(appVersionFromModuleUrl("https://bytlot.com/js/feedback.js?v=bad%20value"), null);
});

test("feedback payload contains only approved context and no calculator values", () => {
  const payload = buildFeedbackPayload({
    feedbackType: "confusing",
    message: "The deadhead explanation was unclear.",
    turnstileToken: "token",
    pagePath: "/index.html",
    calculatorMode: "offer",
    appVersion: "20260831-feedback",
    viewportWidth: 390,
    basePay: 500,
    vehicleAssumptions: { fuelPrice: 9 }
  });

  assert.deepEqual(payload, {
    feedbackType: "confusing",
    message: "The deadhead explanation was unclear.",
    turnstileToken: "token",
    context: {
      pagePath: "/",
      calculatorMode: "offer",
      appVersion: "20260831-feedback",
      viewportCategory: "mobile"
    }
  });
  assert.equal(JSON.stringify(payload).includes("basePay"), false);
  assert.equal(JSON.stringify(payload).includes("fuelPrice"), false);
});

test("feedback request omits credentials and referrer while supporting cancellation", async () => {
  const controller = new AbortController();
  let capturedUrl;
  let capturedOptions;
  const response = await submitFeedbackRequest({ safe: true }, {
    signal: controller.signal,
    fetchImplementation: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return new Response(null, { status: 201 });
    }
  });

  assert.equal(response.status, 201);
  assert.equal(capturedUrl, "/api/feedback");
  assert.equal(capturedOptions.credentials, "omit");
  assert.equal(capturedOptions.referrerPolicy, "no-referrer");
  assert.equal(capturedOptions.signal, controller.signal);
  assert.equal(capturedOptions.body, JSON.stringify({ safe: true }));
});
