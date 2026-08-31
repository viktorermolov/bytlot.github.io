import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
export const WRANGLER_PATH = resolve(REPOSITORY_ROOT, "node_modules/.bin/wrangler");
export const WRANGLER_CONFIG_PATH = resolve(REPOSITORY_ROOT, "worker/wrangler.jsonc");
export const INDEX_PATH = resolve(REPOSITORY_ROOT, "index.html");
export const FEEDBACK_DATABASE_BINDING = "FEEDBACK_DB";
export const TURNSTILE_SECRET_NAME = "TURNSTILE_SECRET_KEY";

const MAX_CAPTURED_BYTES = 1024 * 1024;
const CAPTURE_TIMEOUT_MS = 60_000;
const D1_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const TURNSTILE_SITE_KEY_PATTERN = /^0x[A-Za-z0-9_-]{20,100}$/u;
const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "2x00000000000000000000AC",
  "3x00000000000000000000FF"
]);
const PRODUCTION_WORKER_VARS = Object.freeze({
  ALLOWED_ORIGIN: "https://bytlot.com",
  EXPECTED_TURNSTILE_HOSTNAME: "bytlot.com",
  TURNSTILE_ACTION: "feedback_submit"
});
export const PRODUCTION_ACCOUNT_ID = "52a5f4d5c9b84f6ab34ad87c1651f61d";
const PRODUCTION_DATABASE_NAME = "bytlot-feedback";
const PRODUCTION_ROUTE = "https://bytlot.com/api/feedback*";

export const DEPLOY_USAGE = `Usage:
  npm run feedback:deploy:preflight
  npm run feedback:deploy:bootstrap
  npm run feedback:deploy:verify
  npm run feedback:deploy

The first command performs local configuration checks only. Bootstrap verifies the
pinned Cloudflare account and applies D1 migrations before the first secret-created
Worker version can exist. Verify checks the secret binding name without reading its
value. The final command reapplies pending migrations and deploys the Worker. None of
these commands publishes the GitHub Pages frontend.`;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stripJsoncComments(source) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
      continue;
    }

    if (character === "\"") {
      inString = true;
      result += character;
      continue;
    }

    if (character === "/" && next === "/") {
      result += "  ";
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        result += " ";
        index += 1;
      }
      if (index < source.length) result += "\n";
      continue;
    }

    if (character === "/" && next === "*") {
      result += "  ";
      index += 2;
      while (index < source.length) {
        if (source[index] === "*" && source[index + 1] === "/") {
          result += "  ";
          index += 1;
          break;
        }
        result += source[index] === "\n" ? "\n" : " ";
        index += 1;
      }
      continue;
    }

    result += character;
  }

  return result;
}

function stripTrailingCommas(source) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
      continue;
    }

    if (character === "\"") {
      inString = true;
      result += character;
      continue;
    }

    if (character === ",") {
      let lookahead = index + 1;
      while (/\s/u.test(source[lookahead] || "")) lookahead += 1;
      if (source[lookahead] === "}" || source[lookahead] === "]") continue;
    }
    result += character;
  }

  return result;
}

export function parseWranglerConfig(source) {
  try {
    return JSON.parse(stripTrailingCommas(stripJsoncComments(source)));
  } catch {
    throw new Error("worker/wrangler.jsonc is not valid JSONC.");
  }
}

export function requireProductionWorkerConfig(config) {
  if (config?.account_id !== PRODUCTION_ACCOUNT_ID) {
    throw new Error("Production deployment requires the reviewed Cloudflare account id.");
  }
  if (config?.name !== "bytlot-feedback-api" || config?.main !== "src/index.js") {
    throw new Error("Production deployment requires the reviewed Worker name and production entrypoint.");
  }
  if (config.assets !== undefined) {
    throw new Error("Production feedback Worker must not publish static assets.");
  }
  if (Object.hasOwn(config.vars || {}, TURNSTILE_SECRET_NAME)) {
    throw new Error(`${TURNSTILE_SECRET_NAME} must not be stored in plaintext Worker vars.`);
  }
  if (config?.workers_dev !== false || config?.preview_urls !== false) {
    throw new Error("Production deployment requires workers.dev and preview URLs to remain disabled.");
  }

  const routes = Array.isArray(config.routes) ? config.routes : [];
  if (
    routes.length !== 1 ||
    routes[0]?.pattern !== PRODUCTION_ROUTE ||
    routes[0]?.zone_name !== "bytlot.com"
  ) {
    throw new Error(`Production deployment requires the single reviewed ${PRODUCTION_ROUTE} route.`);
  }

  for (const [name, expectedValue] of Object.entries(PRODUCTION_WORKER_VARS)) {
    if (config.vars?.[name] !== expectedValue) {
      throw new Error(`Production deployment requires the reviewed ${name} value.`);
    }
  }
  return true;
}

export function requireProductionD1(config) {
  const databases = Array.isArray(config?.d1_databases) ? config.d1_databases : [];
  const matches = databases.filter((database) => database?.binding === FEEDBACK_DATABASE_BINDING);
  if (matches.length !== 1) {
    throw new Error(`Wrangler config must contain exactly one ${FEEDBACK_DATABASE_BINDING} binding.`);
  }

  const database = matches[0];
  if (
    typeof database.database_id !== "string" ||
    !D1_UUID_PATTERN.test(database.database_id) ||
    /^0{8}-0{4}-0{4}-0{4}-0{12}$/u.test(database.database_id)
  ) {
    throw new Error("Wrangler config must contain a production D1 database UUID before deployment.");
  }
  if (database.database_name !== PRODUCTION_DATABASE_NAME) {
    throw new Error(`The production D1 database must be named ${PRODUCTION_DATABASE_NAME}.`);
  }

  return {
    binding: FEEDBACK_DATABASE_BINDING,
    databaseName: database.database_name
  };
}

export function requireProductionTurnstileSiteKey(html) {
  const matches = [...html.matchAll(/data-turnstile-sitekey="([^"]*)"/gu)];
  if (matches.length !== 1) {
    throw new Error("index.html must contain exactly one Turnstile site key.");
  }

  const siteKey = matches[0][1].trim();
  if (
    siteKey.includes("TURNSTILE_SITE_KEY") ||
    TURNSTILE_TEST_SITE_KEYS.has(siteKey) ||
    !TURNSTILE_SITE_KEY_PATTERN.test(siteKey)
  ) {
    throw new Error("A production-shaped, non-test Turnstile site key is required before deployment.");
  }
  return true;
}

export function parseDeployArguments(argv) {
  if (argv.length === 1 && ["--help", "-h"].includes(argv[0])) {
    return { mode: "help" };
  }
  const modes = new Map([
    ["--preflight", "preflight"],
    ["--bootstrap-database", "bootstrap-database"],
    ["--verify-remote", "verify-remote"],
    ["--deploy-worker", "deploy-worker"]
  ]);
  if (argv.length !== 1 || !modes.has(argv[0])) {
    throw new Error("Choose exactly one guarded deployment mode. Run with --help for usage.");
  }
  return { mode: modes.get(argv[0]) };
}

export function createWranglerInvocation(args, { capture = false, label = "Wrangler command" } = {}) {
  return {
    command: WRANGLER_PATH,
    args,
    label,
    capture,
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
      stdio: capture ? ["ignore", "pipe", "pipe"] : ["inherit", "inherit", "inherit"]
    }
  };
}

export async function runWranglerInvocation(invocation, spawnImplementation = spawn) {
  return new Promise((resolvePromise, rejectPromise) => {
    let stdout = "";
    let capturedBytes = 0;
    let settled = false;
    let timeout;
    const child = spawnImplementation(invocation.command, invocation.args, invocation.options);

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      callback(value);
    };

    if (invocation.capture) {
      timeout = setTimeout(() => {
        child.kill("SIGTERM");
        finish(rejectPromise, new Error(`${invocation.label} timed out.`));
      }, CAPTURE_TIMEOUT_MS);

      child.stdout.on("data", (chunk) => {
        capturedBytes += chunk.length;
        if (capturedBytes > MAX_CAPTURED_BYTES) {
          child.kill("SIGTERM");
          finish(rejectPromise, new Error(`${invocation.label} returned too much output.`));
          return;
        }
        stdout += chunk.toString("utf8");
      });
      child.stderr.on("data", (chunk) => {
        capturedBytes += chunk.length;
        if (capturedBytes > MAX_CAPTURED_BYTES) {
          child.kill("SIGTERM");
          finish(rejectPromise, new Error(`${invocation.label} returned too much output.`));
        }
      });
    }

    child.on("error", () => {
      finish(rejectPromise, new Error(`${invocation.label} could not start.`));
    });
    child.on("close", (code) => {
      if (code !== 0) {
        finish(rejectPromise, new Error(`${invocation.label} failed.`));
        return;
      }
      finish(resolvePromise, { stdout });
    });
  });
}

function parsePrivateJson(stdout, label) {
  try {
    const value = JSON.parse(stdout);
    if (value === null || typeof value !== "object") throw new Error("invalid");
    return value;
  } catch {
    throw new Error(`${label} returned an unexpected response.`);
  }
}

export function requireTurnstileSecretListing(stdout) {
  const parsed = parsePrivateJson(stdout, "Secret verification");
  const secrets = Array.isArray(parsed) ? parsed : parsed.secrets;
  if (!Array.isArray(secrets) || !secrets.some((secret) => secret?.name === TURNSTILE_SECRET_NAME)) {
    throw new Error(`${TURNSTILE_SECRET_NAME} is not configured for the feedback Worker.`);
  }
  return true;
}

export function requireAuthenticatedAccount(stdout, expectedAccountId = PRODUCTION_ACCOUNT_ID) {
  const parsed = parsePrivateJson(stdout, "Cloudflare authentication verification");
  const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
  if (
    parsed.loggedIn !== true ||
    !accounts.some((account) => account?.id === expectedAccountId)
  ) {
    throw new Error("Cloudflare authentication does not include the reviewed production account.");
  }
  return true;
}

async function readDeploymentInputs(dependencies) {
  const configSource = dependencies.configSource ?? await readFile(WRANGLER_CONFIG_PATH, "utf8");
  const htmlSource = dependencies.htmlSource ?? await readFile(INDEX_PATH, "utf8");
  const config = parseWranglerConfig(configSource);
  requireProductionWorkerConfig(config);
  const database = requireProductionD1(config);
  requireProductionTurnstileSiteKey(htmlSource);
  return { accountId: config.account_id, database };
}

export async function deployFeedback(argv = process.argv.slice(2), dependencies = {}) {
  const { mode } = parseDeployArguments(argv);
  if (mode === "help") return { help: true };

  const status = dependencies.status || ((message) => process.stdout.write(`${message}\n`));
  const run = dependencies.runInvocation || runWranglerInvocation;
  const ensureWrangler = dependencies.ensureWrangler || (() => access(WRANGLER_PATH));
  const { accountId, database } = await readDeploymentInputs(dependencies);
  status("Local deployment preflight passed: production route, environment, D1 ID, and Turnstile site key are configured.");

  if (mode === "preflight") return { help: false, mode, database };

  try {
    await ensureWrangler();
  } catch {
    throw new Error("Local Wrangler is unavailable. Run npm ci with Node.js 22+ first.");
  }

  const authentication = await run(createWranglerInvocation([
    "whoami",
    "--json",
    "--config",
    WRANGLER_CONFIG_PATH
  ], { capture: true, label: "Cloudflare authentication verification" }));
  requireAuthenticatedAccount(authentication.stdout, accountId);
  status("Cloudflare authentication verified for the pinned production account; account details were not printed.");

  if (mode === "bootstrap-database") {
    status("Applying pending migrations before the first secret-created Worker version can exist...");
    await run(createWranglerInvocation([
      "d1",
      "migrations",
      "apply",
      database.binding,
      "--remote",
      "--config",
      WRANGLER_CONFIG_PATH
    ], { label: "Remote D1 bootstrap migration" }));
    status("Remote D1 bootstrap completed. No Worker was deployed and no secret was created.");
    return { help: false, mode, database };
  }

  const secretListing = await run(createWranglerInvocation([
    "secret",
    "list",
    "--format",
    "json",
    "--config",
    WRANGLER_CONFIG_PATH
  ], { capture: true, label: "Turnstile secret-name verification" }));
  requireTurnstileSecretListing(secretListing.stdout);
  status(`${TURNSTILE_SECRET_NAME} binding name verified; no secret value was read or printed.`);

  if (mode === "verify-remote") return { help: false, mode, database };

  status("Applying pending migrations to the configured remote D1 database before Worker deployment...");
  await run(createWranglerInvocation([
    "d1",
    "migrations",
    "apply",
    database.binding,
    "--remote",
    "--config",
    WRANGLER_CONFIG_PATH
  ], { label: "Remote D1 migration" }));

  status("Remote migrations completed. Deploying the feedback Worker...");
  await run(createWranglerInvocation([
    "deploy",
    "--config",
    WRANGLER_CONFIG_PATH
  ], { label: "Feedback Worker deployment" }));

  status("Feedback Worker deployment completed. The GitHub Pages frontend was not published.");
  status("Next gates: verify the production API, publish the frontend separately, then submit and retrieve one controlled feedback row.");
  return { help: false, mode, database };
}

export async function main() {
  const result = await deployFeedback();
  if (result.help) process.stdout.write(`${DEPLOY_USAGE}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Feedback Worker deployment stopped: ${error.message}\n`);
    process.exitCode = 1;
  });
}
