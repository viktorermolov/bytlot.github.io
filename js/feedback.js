const FEEDBACK_ENDPOINT = "/api/feedback";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TURNSTILE_ACTION = "feedback_submit";
const LOCAL_TEST_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY_PLACEHOLDER = "__TURNSTILE_SITE_KEY__";
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const SUBMISSION_TIMEOUT_MS = 12_000;
const FEEDBACK_TYPES = new Set(["suggestion", "bug", "confusing", "other"]);
const APP_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const DISALLOWED_CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;

let turnstileScriptPromise;

export function messageCharacterCount(value) {
  return [...value].length;
}

export function normalizedFeedbackMessage(value) {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function viewportCategory(width) {
  if (width <= 520) return "mobile";
  if (width <= 800) return "tablet";
  return "desktop";
}

export function appVersionFromModuleUrl(moduleUrl) {
  const version = new URL(moduleUrl).searchParams.get("v");
  return version && APP_VERSION_PATTERN.test(version) ? version : null;
}

export function validateFeedbackDraft(feedbackType, rawMessage) {
  if (!FEEDBACK_TYPES.has(feedbackType)) {
    return { valid: false, field: "type", message: "Choose a feedback type." };
  }

  const message = normalizedFeedbackMessage(rawMessage);
  const length = messageCharacterCount(message);
  if (DISALLOWED_CONTROL_CHARACTERS.test(message)) {
    return { valid: false, field: "message", message: "Remove unsupported control characters." };
  }
  if (length < MIN_MESSAGE_LENGTH) {
    return {
      valid: false,
      field: "message",
      message: `Write at least ${MIN_MESSAGE_LENGTH} characters.`
    };
  }
  if (length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      field: "message",
      message: `Keep the message to ${MAX_MESSAGE_LENGTH.toLocaleString("en-US")} characters or fewer.`
    };
  }

  return { valid: true, message };
}

export function buildFeedbackPayload({
  feedbackType,
  message,
  turnstileToken,
  calculatorMode,
  appVersion,
  viewportWidth
}) {
  return {
    feedbackType,
    message,
    turnstileToken,
    context: {
      pagePath: "/",
      calculatorMode,
      appVersion,
      viewportCategory: viewportCategory(viewportWidth)
    }
  };
}

export function submitFeedbackRequest(payload, {
  fetchImplementation = fetch,
  signal
} = {}) {
  return fetchImplementation(FEEDBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal
  });
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`)?.remove();
    const script = document.createElement("script");
    let timeoutId;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      cleanup();
      if (window.turnstile) resolve(window.turnstile);
      else {
        script.remove();
        reject(new Error("Turnstile did not initialize."));
      }
    };
    const handleError = () => {
      cleanup();
      script.remove();
      reject(new Error("Turnstile could not load."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    timeoutId = window.setTimeout(handleError, 10_000);
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    document.head.append(script);
  }).catch((error) => {
    turnstileScriptPromise = undefined;
    throw error;
  });

  return turnstileScriptPromise;
}

function currentCalculatorMode() {
  const activeTab = document.querySelector("[data-mode][aria-selected='true']");
  return activeTab?.dataset.mode === "offer" ? "offer" : "shift";
}

function selectedSiteKey(dialog) {
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return LOCAL_TEST_SITE_KEY;
  }
  const configured = dialog.dataset.turnstileSitekey || "";
  return configured === SITE_KEY_PLACEHOLDER ? "" : configured;
}

function requestErrorMessage(status) {
  if (status === 400) return "Check the feedback fields and try again.";
  if (status === 403) return "We couldn’t verify this submission. Please try again.";
  if (status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  return "We couldn’t send your feedback right now. Your message is still here—please try again.";
}

export async function isStoredFeedbackResponse(response) {
  if (response.status !== 201) return false;
  const mediaType = response.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json") return false;

  let body;
  try {
    body = await response.json();
  } catch {
    return false;
  }
  return body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    body.ok === true &&
    Object.keys(body).length === 1;
}

export function createFeedbackController() {
  const dialog = document.querySelector("#feedback-dialog");
  const title = document.querySelector("#feedback-title");
  const closeButton = document.querySelector("#feedback-close");
  const formView = document.querySelector("#feedback-form-view");
  const form = document.querySelector("#feedback-form");
  const typeInput = document.querySelector("#feedback-type");
  const messageInput = document.querySelector("#feedback-message");
  const characterCount = document.querySelector("#feedback-character-count");
  const verificationContainer = document.querySelector("#feedback-turnstile");
  const verificationStatus = document.querySelector("#feedback-verification-status");
  const errorMessage = document.querySelector("#feedback-error");
  const submitButton = document.querySelector("#feedback-submit");
  const successView = document.querySelector("#feedback-success");
  const successTitle = document.querySelector("#feedback-success-title");
  const doneButton = document.querySelector("#feedback-done");

  if (!dialog || typeof dialog.showModal !== "function") {
    throw new Error("The feedback dialog is unavailable.");
  }

  let lastInvoker;
  let turnstileApi;
  let widgetId;
  let turnstileToken = "";
  let submittedSuccessfully = false;
  let submissionController;
  let submissionTimeoutId;

  function hideError() {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    errorMessage.focus();
  }

  function updateCharacterCount() {
    const count = messageCharacterCount(normalizedFeedbackMessage(messageInput.value));
    characterCount.textContent = `${count.toLocaleString("en-US")} / ${MAX_MESSAGE_LENGTH.toLocaleString("en-US")}`;
    characterCount.classList.toggle("is-over-limit", count > MAX_MESSAGE_LENGTH);
    messageInput.removeAttribute("aria-invalid");
    messageInput.setCustomValidity("");
  }

  function resetTurnstile() {
    turnstileToken = "";
    if (turnstileApi && widgetId !== undefined) turnstileApi.reset(widgetId);
    verificationStatus.textContent = "Complete the verification before sending.";
  }

  async function ensureTurnstile() {
    if (widgetId !== undefined) {
      resetTurnstile();
      return;
    }

    const sitekey = selectedSiteKey(dialog);
    if (!sitekey) throw new Error("Feedback verification is not configured.");

    verificationStatus.textContent = "Loading verification…";
    turnstileApi = await loadTurnstileScript();
    widgetId = turnstileApi.render(verificationContainer, {
      sitekey,
      action: TURNSTILE_ACTION,
      appearance: "always",
      size: "flexible",
      theme: "light",
      callback(token) {
        turnstileToken = token;
        verificationStatus.textContent = "Verification complete.";
        hideError();
      },
      "expired-callback"() {
        resetTurnstile();
        verificationStatus.textContent = "Verification expired. Complete it again.";
      },
      "timeout-callback"() {
        resetTurnstile();
        verificationStatus.textContent = "Verification timed out. Complete it again.";
      },
      "error-callback"() {
        turnstileToken = "";
        verificationStatus.textContent = "Verification could not complete. Please try again.";
      },
      "unsupported-callback"() {
        turnstileToken = "";
        verificationStatus.textContent = "This browser cannot run the verification.";
      }
    });
  }

  function restoreFormView() {
    submittedSuccessfully = false;
    formView.hidden = false;
    successView.hidden = true;
    form.reset();
    updateCharacterCount();
    hideError();
  }

  function closeDialog() {
    dialog.close();
  }

  function restoreSubmitButton() {
    submitButton.disabled = false;
    submitButton.textContent = "Send feedback";
  }

  function cancelPendingSubmission() {
    const controller = submissionController;
    submissionController = undefined;
    if (submissionTimeoutId !== undefined) {
      window.clearTimeout(submissionTimeoutId);
      submissionTimeoutId = undefined;
    }
    controller?.abort();
    restoreSubmitButton();
  }

  closeButton.addEventListener("click", closeDialog);
  doneButton.addEventListener("click", closeDialog);
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      closeDialog();
    }
  });
  messageInput.addEventListener("input", updateCharacterCount);
  typeInput.addEventListener("change", () => {
    typeInput.removeAttribute("aria-invalid");
    typeInput.setCustomValidity("");
  });

  dialog.addEventListener("close", () => {
    cancelPendingSubmission();
    if (turnstileApi && widgetId !== undefined) resetTurnstile();
    if (submittedSuccessfully) restoreFormView();
    lastInvoker?.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();

    const validation = validateFeedbackDraft(typeInput.value, messageInput.value);
    typeInput.setCustomValidity("");
    messageInput.setCustomValidity("");
    typeInput.removeAttribute("aria-invalid");
    messageInput.removeAttribute("aria-invalid");

    if (!validation.valid) {
      const invalidInput = validation.field === "type" ? typeInput : messageInput;
      invalidInput.setCustomValidity(validation.message);
      invalidInput.setAttribute("aria-invalid", "true");
      form.reportValidity();
      invalidInput.focus();
      return;
    }

    if (!turnstileToken) {
      showError("Complete the verification before sending feedback.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    const controller = new AbortController();
    submissionController = controller;
    submissionTimeoutId = window.setTimeout(() => controller.abort(), SUBMISSION_TIMEOUT_MS);

    try {
      const payload = buildFeedbackPayload({
        feedbackType: typeInput.value,
        message: validation.message,
        turnstileToken,
        calculatorMode: currentCalculatorMode(),
        appVersion: appVersionFromModuleUrl(import.meta.url),
        viewportWidth: window.innerWidth
      });
      const response = await submitFeedbackRequest(payload, { signal: controller.signal });

      if (submissionController !== controller || !dialog.open) return;

      const stored = await isStoredFeedbackResponse(response);
      if (submissionController !== controller || !dialog.open) return;
      if (!stored) {
        showError(requestErrorMessage(response.status));
        resetTurnstile();
        return;
      }

      submittedSuccessfully = true;
      formView.hidden = true;
      successView.hidden = false;
      successTitle.focus();
    } catch {
      if (submissionController === controller && dialog.open) {
        showError(requestErrorMessage(0));
        resetTurnstile();
      }
    } finally {
      if (submissionController === controller) {
        window.clearTimeout(submissionTimeoutId);
        submissionTimeoutId = undefined;
        submissionController = undefined;
        restoreSubmitButton();
      }
    }
  });

  return {
    open(invoker) {
      lastInvoker = invoker;
      dialog.showModal();
      requestAnimationFrame(() => title.focus());
      ensureTurnstile().catch(() => {
        verificationStatus.textContent = "Verification is unavailable right now.";
        showError("We couldn’t load feedback verification. Please try again.");
      });
    }
  };
}
