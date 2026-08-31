import { createFeedbackHandler } from "./index.js";

const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const TURNSTILE_ALWAYS_PASS_TEST_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyLocalTurnstileToken(token, env) {
  const valid = token === TURNSTILE_DUMMY_TOKEN &&
    env.TURNSTILE_SECRET_KEY === TURNSTILE_ALWAYS_PASS_TEST_SECRET &&
    env.EXPECTED_TURNSTILE_HOSTNAME === "example.com" &&
    env.TURNSTILE_ACTION === "test";
  return { valid, unavailable: false };
}

const handleLocalFeedbackRequest = createFeedbackHandler({
  verifyToken: verifyLocalTurnstileToken
});

export default {
  fetch(request, env) {
    return handleLocalFeedbackRequest(request, env);
  }
};
