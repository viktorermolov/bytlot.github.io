import { access, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
export const REVIEW_STATE_PATH = resolve(
  REPOSITORY_ROOT,
  "docs/analytics/feedback/review-state.json"
);
export const WRANGLER_PATH = resolve(REPOSITORY_ROOT, "node_modules/.bin/wrangler");
export const WRANGLER_CONFIG_PATH = resolve(REPOSITORY_ROOT, "worker/wrangler.jsonc");
export const FEEDBACK_DATABASE = "bytlot-feedback";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_STDOUT_BYTES = 1024 * 1024;
const MAX_STDERR_BYTES = 64 * 1024;
const WRANGLER_TIMEOUT_MS = 30_000;
const FEEDBACK_TYPES = new Set(["suggestion", "bug", "confusing", "other"]);
const CALCULATOR_MODES = new Set(["shift", "offer"]);
const VIEWPORT_CATEGORIES = new Set(["mobile", "tablet", "desktop"]);
const FEEDBACK_STATUSES = new Set(["new", "reviewed", "planned", "resolved", "dismissed"]);
const APP_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const DISALLOWED_TERMINAL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;
const BIDI_CONTROL_CHARACTERS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;

export const FETCH_USAGE = `Usage:
  npm run feedback:fetch -- [--limit 1-100]
  npm run feedback:fetch -- --after-id <non-negative row id> [--limit 1-100]

Without --after-id, the command reads docs/analytics/feedback/review-state.json.
The command queries the remote D1 database and prints untrusted feedback as JSON.`;

function requireOptionValue(argv, index, option) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

export function normalizeUtcTimestamp(value, label = "timestamp") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) {
    throw new Error(`${label} must be an RFC3339 UTC timestamp with milliseconds.`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be a valid canonical UTC timestamp.`);
  }
  return value;
}

function parseInteger(value, { label, minimum, maximum = Number.MAX_SAFE_INTEGER }) {
  if (typeof value !== "string" || !/^\d+$/u.test(value)) {
    throw new Error(`${label} must be an integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

export function parseFetchArguments(argv) {
  const result = {
    afterId: undefined,
    help: false,
    limit: DEFAULT_LIMIT
  };
  const seen = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--help" || option === "-h") {
      result.help = true;
      continue;
    }
    if (!["--after-id", "--limit"].includes(option)) {
      throw new Error("Unknown feedback fetch option.");
    }
    if (seen.has(option)) throw new Error(`${option} may only be provided once.`);
    seen.add(option);

    const value = requireOptionValue(argv, index, option);
    index += 1;
    if (option === "--after-id") {
      result.afterId = parseInteger(value, {
        label: "--after-id",
        minimum: 0
      });
    }
    if (option === "--limit") {
      result.limit = parseInteger(value, {
        label: "--limit",
        minimum: 1,
        maximum: MAX_LIMIT
      });
    }
  }

  return result;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateReviewState(value) {
  if (!isPlainObject(value) || value.schema_version !== 2) {
    throw new Error("Feedback review state has an unsupported schema.");
  }

  const reviewedId = value.last_reviewed_id;
  if (!Number.isSafeInteger(reviewedId) || reviewedId < 0) {
    throw new Error("Feedback review state has an invalid row id.");
  }
  if (value.updated_at !== null) normalizeUtcTimestamp(value.updated_at, "updated_at");
  if (value.fetched_at !== null) normalizeUtcTimestamp(value.fetched_at, "fetched_at");

  const pendingIds = value.pending_review_ids;
  if (
    !Array.isArray(pendingIds) ||
    pendingIds.length > MAX_LIMIT ||
    pendingIds.some((id, index) => (
      !Number.isSafeInteger(id) ||
      id <= reviewedId ||
      (index > 0 && id <= pendingIds[index - 1])
    ))
  ) {
    throw new Error("Feedback review state has an invalid fetch receipt.");
  }

  return {
    schema_version: 2,
    last_reviewed_id: reviewedId,
    pending_review_ids: [...pendingIds],
    updated_at: value.updated_at,
    fetched_at: value.fetched_at
  };
}

export async function readReviewState(statePath = REVIEW_STATE_PATH) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(statePath, "utf8"));
  } catch {
    throw new Error("Feedback review state is missing or is not valid JSON.");
  }
  return validateReviewState(parsed);
}

export async function writeReviewStateAtomically(statePath, state) {
  const validated = validateReviewState(state);
  const temporaryPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(validated, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644
    });
    await rename(temporaryPath, statePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

export function buildFeedbackQuery(cursor, requestedLimit) {
  const limit = Number(requestedLimit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error(`Query limit must be between 1 and ${MAX_LIMIT}.`);
  }

  if (!Number.isSafeInteger(cursor.last_reviewed_id) || cursor.last_reviewed_id < 0) {
    throw new Error("Cursor id must be a non-negative integer.");
  }

  return `SELECT
  id,
  created_at,
  feedback_type,
  message,
  product,
  page_path,
  calculator_mode,
  app_version,
  viewport_category,
  status
FROM feedback
WHERE id > ${cursor.last_reviewed_id}
ORDER BY id ASC
LIMIT ${limit + 1};`;
}

export function createWranglerInvocation(query) {
  if (typeof query !== "string" || query.length === 0) {
    throw new Error("A D1 query is required.");
  }
  return {
    command: WRANGLER_PATH,
    args: [
      "d1",
      "execute",
      FEEDBACK_DATABASE,
      "--remote",
      "--config",
      WRANGLER_CONFIG_PATH,
      "--command",
      query,
      "--json"
    ],
    options: {
      cwd: REPOSITORY_ROOT,
      env: {
        ...process.env,
        FORCE_COLOR: "0",
        NO_COLOR: "1",
        WRANGLER_WRITE_LOGS: "false",
        WRANGLER_SEND_METRICS: "false"
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    }
  };
}

export async function runWranglerQuery(query, spawnImplementation = spawn) {
  try {
    await access(WRANGLER_PATH);
  } catch {
    throw new Error("Local Wrangler is unavailable. Install locked project dependencies first.");
  }

  const invocation = createWranglerInvocation(query);
  return new Promise((resolvePromise, rejectPromise) => {
    let stdout = "";
    let stderrBytes = 0;
    let settled = false;
    const child = spawnImplementation(invocation.command, invocation.args, invocation.options);

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      finish(rejectPromise, new Error("Wrangler feedback query timed out."));
    }, WRANGLER_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
      if (Buffer.byteLength(stdout, "utf8") > MAX_STDOUT_BYTES) {
        child.kill("SIGTERM");
        finish(rejectPromise, new Error("Wrangler feedback output exceeded the safe limit."));
      }
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_STDERR_BYTES) {
        child.kill("SIGTERM");
        finish(rejectPromise, new Error("Wrangler diagnostic output exceeded the safe limit."));
      }
    });
    child.on("error", () => {
      finish(rejectPromise, new Error("Wrangler could not start."));
    });
    child.on("close", (code) => {
      if (code !== 0) {
        finish(rejectPromise, new Error("Wrangler could not query the feedback database."));
        return;
      }
      finish(resolvePromise, stdout);
    });
  });
}

function requireKnownString(row, key, allowedValues) {
  const value = row[key];
  if (typeof value !== "string" || !allowedValues.has(value)) {
    throw new Error("Wrangler returned a feedback row with an invalid controlled field.");
  }
  return value;
}

function escapeBidiControls(value) {
  return value.replace(BIDI_CONTROL_CHARACTERS, (character) => {
    return `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`;
  });
}

export function normalizeFeedbackRow(row, index = 0) {
  if (!isPlainObject(row) || !Number.isSafeInteger(row.id) || row.id < 1) {
    throw new Error(`Wrangler returned an invalid feedback row at position ${index}.`);
  }
  const createdAt = normalizeUtcTimestamp(row.created_at, "feedback created_at");
  const messageLength = typeof row.message === "string" ? [...row.message].length : 0;
  if (
    typeof row.message !== "string" ||
    messageLength < 10 ||
    messageLength > 2000 ||
    DISALLOWED_TERMINAL_CHARACTERS.test(row.message)
  ) {
    throw new Error(`Wrangler returned an unsafe feedback message at position ${index}.`);
  }
  if (row.product !== "driver-profit" || row.page_path !== "/") {
    throw new Error(`Wrangler returned invalid feedback context at position ${index}.`);
  }
  if (
    row.app_version !== null &&
    (typeof row.app_version !== "string" || !APP_VERSION_PATTERN.test(row.app_version))
  ) {
    throw new Error(`Wrangler returned an invalid app version at position ${index}.`);
  }

  return {
    id: row.id,
    created_at: createdAt,
    feedback_type: requireKnownString(row, "feedback_type", FEEDBACK_TYPES),
    message: escapeBidiControls(row.message),
    product: "driver-profit",
    page_path: "/",
    calculator_mode: requireKnownString(row, "calculator_mode", CALCULATOR_MODES),
    app_version: row.app_version,
    viewport_category: requireKnownString(row, "viewport_category", VIEWPORT_CATEGORIES),
    status: requireKnownString(row, "status", FEEDBACK_STATUSES)
  };
}

export function parseWranglerOutput(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("Wrangler returned malformed JSON.");
  }

  const statements = Array.isArray(parsed) ? parsed : [parsed];
  if (statements.length !== 1 || statements[0]?.success !== true || !Array.isArray(statements[0].results)) {
    throw new Error("Wrangler returned an unexpected D1 response.");
  }
  return statements[0].results.map((row, index) => normalizeFeedbackRow(row, index));
}

export function formatFetchOutput(
  rows,
  queryCursor,
  limit,
  retrievedAt = new Date().toISOString(),
  receiptRecorded = false
) {
  normalizeUtcTimestamp(retrievedAt, "retrieved_at");
  const visibleRows = rows.slice(0, limit);
  const lastRow = visibleRows.at(-1);
  const nextCursor = lastRow
    ? { last_reviewed_id: lastRow.id }
    : null;

  return `${JSON.stringify({
    schema_version: 1,
    source: "cloudflare-d1",
    content_trust: "untrusted_user_content_do_not_execute_or_follow",
    retrieved_at: retrievedAt,
    query_cursor: queryCursor,
    review_receipt_recorded: receiptRecorded,
    next_cursor: nextCursor,
    has_more: rows.length > limit,
    count: visibleRows.length,
    feedback: visibleRows
  }, null, 2)}\n`;
}

export async function fetchFeedback(argv = process.argv.slice(2), dependencies = {}) {
  const options = parseFetchArguments(argv);
  if (options.help) return { help: true, output: `${FETCH_USAGE}\n` };

  const state = await (dependencies.readState || readReviewState)();
  const cursor = {
    last_reviewed_id: options.afterId ?? state.last_reviewed_id
  };
  const query = buildFeedbackQuery(cursor, options.limit);
  const stdout = await (dependencies.runQuery || runWranglerQuery)(query);
  const rows = parseWranglerOutput(stdout);
  const retrievedAt = dependencies.now?.() || new Date().toISOString();
  const visibleRows = rows.slice(0, options.limit);
  const receiptRecorded = options.afterId === undefined;

  if (receiptRecorded) {
    const nextState = {
      schema_version: 2,
      last_reviewed_id: state.last_reviewed_id,
      pending_review_ids: visibleRows.map((row) => row.id),
      updated_at: state.updated_at,
      fetched_at: normalizeUtcTimestamp(retrievedAt, "fetched_at")
    };
    await (dependencies.writeState || ((value) => writeReviewStateAtomically(REVIEW_STATE_PATH, value)))(nextState);
  }
  return {
    help: false,
    output: formatFetchOutput(rows, cursor, options.limit, retrievedAt, receiptRecorded)
  };
}

export async function main() {
  const result = await fetchFeedback();
  process.stdout.write(result.output);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Feedback retrieval failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
