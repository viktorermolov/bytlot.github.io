import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  REVIEW_STATE_PATH,
  normalizeUtcTimestamp,
  readReviewState,
  writeReviewStateAtomically
} from "./fetch-feedback.mjs";

export const MARK_USAGE = `Usage:
  npm run feedback:mark-reviewed -- --id <positive row id>

Use only the next_cursor emitted by a default feedback:fetch after reviewing and summarizing that page.
The id must exist in the latest metadata-only fetch receipt recorded in review-state.json.
This command updates the repository review cursor; it does not mutate D1 feedback rows.`;

function requireOptionValue(argv, index, option) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

function parsePositiveId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/u.test(value)) {
    throw new Error("--id must be a positive integer.");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("--id is outside the safe integer range.");
  return parsed;
}

export function parseMarkArguments(argv) {
  const result = { help: false, id: undefined };
  const seen = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--help" || option === "-h") {
      result.help = true;
      continue;
    }
    if (option !== "--id") {
      throw new Error("Unknown mark-reviewed option.");
    }
    if (seen.has(option)) throw new Error(`${option} may only be provided once.`);
    seen.add(option);
    const value = requireOptionValue(argv, index, option);
    index += 1;
    if (option === "--id") result.id = parsePositiveId(value);
  }

  if (!result.help && result.id === undefined) {
    throw new Error("--id is required.");
  }
  return result;
}

export async function markFeedbackReviewed({
  id,
  now = () => new Date().toISOString(),
  readState = () => readReviewState(REVIEW_STATE_PATH),
  statePath = REVIEW_STATE_PATH,
  writeState = writeReviewStateAtomically
}) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error("Review row id must be a positive safe integer.");
  }
  const currentState = await readState();
  if (id < currentState.last_reviewed_id) {
    throw new Error("The review cursor cannot move backwards.");
  }
  if (id === currentState.last_reviewed_id) return { changed: false, state: currentState };
  if (!currentState.pending_review_ids.includes(id)) {
    throw new Error("The review cursor must match an id in the latest recorded fetch receipt.");
  }

  const nextState = {
    schema_version: 2,
    last_reviewed_id: id,
    pending_review_ids: currentState.pending_review_ids.filter((pendingId) => pendingId > id),
    updated_at: normalizeUtcTimestamp(now(), "updated_at"),
    fetched_at: currentState.pending_review_ids.some((pendingId) => pendingId > id)
      ? currentState.fetched_at
      : null
  };
  await writeState(statePath, nextState);
  return { changed: true, state: nextState };
}

export async function main() {
  const options = parseMarkArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${MARK_USAGE}\n`);
    return;
  }

  const result = await markFeedbackReviewed({
    id: options.id
  });
  process.stdout.write(`${JSON.stringify({
    changed: result.changed,
    review_cursor: {
      last_reviewed_id: result.state.last_reviewed_id
    }
  }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Feedback review state was not updated: ${error.message}\n`);
    process.exitCode = 1;
  });
}
