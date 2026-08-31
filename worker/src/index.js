const FEEDBACK_PATH = "/api/feedback";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_BODY_BYTES = 16 * 1024;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const FEEDBACK_TYPES = new Set(["suggestion", "bug", "confusing", "other"]);
const CALCULATOR_MODES = new Set(["shift", "offer"]);
const VIEWPORT_CATEGORIES = new Set(["mobile", "tablet", "desktop"]);
const TOP_LEVEL_KEYS = new Set(["feedbackType", "message", "turnstileToken", "context"]);
const CONTEXT_KEYS = new Set(["pagePath", "calculatorMode", "appVersion", "viewportCategory"]);
const APP_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const DISALLOWED_CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
const INSERT_FEEDBACK = `
  INSERT INTO feedback (
    feedback_type,
    message,
    product,
    page_path,
    calculator_mode,
    app_version,
    viewport_category
  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
`;

const ERROR_MESSAGES = Object.freeze({
  forbidden: "This submission could not be accepted.",
  invalid_request: "Check the feedback fields and try again.",
  method_not_allowed: "This endpoint accepts feedback submissions only.",
  not_found: "The requested endpoint was not found.",
  payload_too_large: "The feedback message is too large.",
  rate_limited: "Too many attempts. Please wait and try again.",
  temporarily_unavailable: "Feedback is temporarily unavailable. Please try again.",
  unsupported_media_type: "Feedback must be sent as JSON.",
  verification_failed: "We could not verify this submission. Please try again."
});

class PayloadTooLargeError extends Error {}

function jsonResponse(status, code, extraHeaders = {}) {
  const body = code === "ok"
    ? { ok: true }
    : { ok: false, error: { code, message: ERROR_MESSAGES[code] } };

  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

function isPlainJsonObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function containsOnlyKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function unicodeLength(value) {
  return [...value].length;
}

function normalizeMessage(value) {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function validateFeedbackPayload(payload) {
  if (!isPlainJsonObject(payload) || !containsOnlyKeys(payload, TOP_LEVEL_KEYS)) return null;
  if (!isPlainJsonObject(payload.context) || !containsOnlyKeys(payload.context, CONTEXT_KEYS)) return null;

  const feedbackType = payload.feedbackType;
  if (typeof feedbackType !== "string" || !FEEDBACK_TYPES.has(feedbackType)) return null;

  if (typeof payload.message !== "string") return null;
  const message = normalizeMessage(payload.message);
  const messageLength = unicodeLength(message);
  if (
    messageLength < MIN_MESSAGE_LENGTH ||
    messageLength > MAX_MESSAGE_LENGTH ||
    DISALLOWED_CONTROL_CHARACTERS.test(message)
  ) return null;

  if (typeof payload.turnstileToken !== "string") return null;
  const turnstileToken = payload.turnstileToken.trim();
  if (!turnstileToken || turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH) return null;

  const { pagePath, calculatorMode, appVersion, viewportCategory } = payload.context;
  if (pagePath !== "/") return null;
  if (typeof calculatorMode !== "string" || !CALCULATOR_MODES.has(calculatorMode)) return null;
  if (!VIEWPORT_CATEGORIES.has(viewportCategory)) return null;
  if (appVersion !== null && appVersion !== undefined) {
    if (typeof appVersion !== "string" || !APP_VERSION_PATTERN.test(appVersion)) return null;
  }

  return {
    feedbackType,
    message,
    turnstileToken,
    pagePath,
    calculatorMode,
    appVersion: appVersion || null,
    viewportCategory
  };
}

async function readBoundedBody(request) {
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.byteLength;
    if (totalLength > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return new TextDecoder().decode(body);
}

export async function verifyTurnstileToken(token, env, fetchImplementation = fetch) {
  let response;
  try {
    response = await fetchImplementation(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token
      }),
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    return { valid: false, unavailable: true };
  }

  if (!response.ok) return { valid: false, unavailable: true };

  let result;
  try {
    result = await response.json();
  } catch {
    return { valid: false, unavailable: true };
  }

  const valid = result?.success === true &&
    result.hostname === env.EXPECTED_TURNSTILE_HOSTNAME &&
    result.action === env.TURNSTILE_ACTION;
  return { valid, unavailable: false };
}

function hasRequiredBindings(env) {
  return typeof env?.ALLOWED_ORIGIN === "string" &&
    typeof env?.EXPECTED_TURNSTILE_HOSTNAME === "string" &&
    typeof env?.TURNSTILE_ACTION === "string" &&
    typeof env?.TURNSTILE_SECRET_KEY === "string" &&
    typeof env?.FEEDBACK_RATE_LIMITER?.limit === "function" &&
    typeof env?.FEEDBACK_DB?.prepare === "function";
}

export function createFeedbackHandler({ verifyToken = verifyTurnstileToken } = {}) {
  return async function handleFeedbackRequest(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== FEEDBACK_PATH || url.search) return jsonResponse(404, "not_found");

    if (request.method !== "POST") {
      return jsonResponse(405, "method_not_allowed", { Allow: "POST" });
    }

    if (request.headers.get("Origin") !== env?.ALLOWED_ORIGIN) {
      return jsonResponse(403, "forbidden");
    }

    const mediaType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
    if (mediaType !== "application/json") return jsonResponse(415, "unsupported_media_type");

    let bodyText;
    try {
      bodyText = await readBoundedBody(request);
    } catch (error) {
      return error instanceof PayloadTooLargeError
        ? jsonResponse(413, "payload_too_large")
        : jsonResponse(400, "invalid_request");
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return jsonResponse(400, "invalid_request");
    }

    const feedback = validateFeedbackPayload(payload);
    if (!feedback) return jsonResponse(400, "invalid_request");
    if (!hasRequiredBindings(env)) return jsonResponse(503, "temporarily_unavailable");

    const verification = await verifyToken(feedback.turnstileToken, env);
    if (verification.unavailable) return jsonResponse(503, "temporarily_unavailable");
    if (!verification.valid) return jsonResponse(403, "verification_failed");

    let allowed;
    try {
      ({ success: allowed } = await env.FEEDBACK_RATE_LIMITER.limit({ key: "feedback:submit" }));
    } catch {
      return jsonResponse(503, "temporarily_unavailable");
    }
    if (!allowed) return jsonResponse(429, "rate_limited", { "Retry-After": "60" });

    try {
      const result = await env.FEEDBACK_DB
        .prepare(INSERT_FEEDBACK)
        .bind(
          feedback.feedbackType,
          feedback.message,
          "driver-profit",
          feedback.pagePath,
          feedback.calculatorMode,
          feedback.appVersion,
          feedback.viewportCategory
        )
        .run();

      if (result?.success !== true || result.meta?.changes !== 1) {
        return jsonResponse(503, "temporarily_unavailable");
      }
    } catch {
      return jsonResponse(503, "temporarily_unavailable");
    }

    return jsonResponse(201, "ok");
  };
}

const handleFeedbackRequest = createFeedbackHandler();

export default {
  fetch(request, env) {
    return handleFeedbackRequest(request, env);
  }
};
