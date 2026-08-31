import assert from "node:assert/strict";
import test from "node:test";

import {
  FEEDBACK_DATABASE_BINDING,
  PRODUCTION_ACCOUNT_ID,
  TURNSTILE_SECRET_NAME,
  WRANGLER_CONFIG_PATH,
  WRANGLER_PATH,
  createWranglerInvocation,
  deployFeedback,
  parseDeployArguments,
  parseWranglerConfig,
  requireAuthenticatedAccount,
  requireProductionD1,
  requireProductionTurnstileSiteKey,
  requireProductionWorkerConfig
} from "../scripts/deploy-feedback.mjs";

const DATABASE_ID = "11111111-1111-4111-8111-111111111111";
const PRODUCTION_SITE_KEY = "0x4AAAAAAAAAAAAAAAAAAAAAAAAAA";

function configSource(databaseId = DATABASE_ID) {
  return `{
    // JSONC comments and trailing commas are intentional test coverage.
    "account_id": "${PRODUCTION_ACCOUNT_ID}",
    "name": "bytlot-feedback-api",
    "main": "src/index.js",
    "reference_url": "https://developers.cloudflare.com/d1/",
    "workers_dev": false,
    "preview_urls": false,
    "routes": [{
      "pattern": "https://bytlot.com/api/feedback*",
      "zone_name": "bytlot.com",
    }],
    "vars": {
      "ALLOWED_ORIGIN": "https://bytlot.com",
      "EXPECTED_TURNSTILE_HOSTNAME": "bytlot.com",
      "TURNSTILE_ACTION": "feedback_submit",
    },
    "d1_databases": [
      {
        "binding": "FEEDBACK_DB",
        "database_name": "bytlot-feedback",
        "database_id": "${databaseId}",
      },
    ],
  }`;
}

function htmlSource(siteKey = PRODUCTION_SITE_KEY) {
  return `<dialog id="feedback-dialog" data-turnstile-sitekey="${siteKey}"></dialog>`;
}

function deploymentDependencies(overrides = {}) {
  const invocations = [];
  const messages = [];
  const runInvocation = async (invocation) => {
    invocations.push(invocation);
    if (invocation.args[0] === "whoami") {
      return {
        stdout: JSON.stringify({
          loggedIn: true,
          accounts: [{ id: PRODUCTION_ACCOUNT_ID, name: "not-printed" }]
        })
      };
    }
    if (invocation.args[0] === "secret") {
      return {
        stdout: JSON.stringify([
          { name: TURNSTILE_SECRET_NAME, type: "secret_text", value: "must-never-be-printed" }
        ])
      };
    }
    return { stdout: "" };
  };

  return {
    dependencies: {
      configSource: configSource(),
      ensureWrangler: async () => {},
      htmlSource: htmlSource(),
      runInvocation,
      status: (message) => messages.push(message),
      ...overrides
    },
    invocations,
    messages
  };
}

test("deployment arguments require an explicit non-ambiguous mode", () => {
  assert.deepEqual(parseDeployArguments(["--preflight"]), { mode: "preflight" });
  assert.deepEqual(parseDeployArguments(["--bootstrap-database"]), { mode: "bootstrap-database" });
  assert.deepEqual(parseDeployArguments(["--verify-remote"]), { mode: "verify-remote" });
  assert.deepEqual(parseDeployArguments(["--deploy-worker"]), { mode: "deploy-worker" });
  assert.deepEqual(parseDeployArguments(["--help"]), { mode: "help" });
  assert.throws(() => parseDeployArguments([]), /exactly one guarded deployment mode/u);
  assert.throws(
    () => parseDeployArguments(["--preflight", "--deploy-worker"]),
    /exactly one guarded deployment mode/u
  );
});

test("JSONC preflight requires one production D1 UUID and one production-shaped site key", () => {
  const config = parseWranglerConfig(configSource());
  assert.equal(config.reference_url, "https://developers.cloudflare.com/d1/");
  assert.deepEqual(requireProductionD1(config), {
    binding: FEEDBACK_DATABASE_BINDING,
    databaseName: "bytlot-feedback"
  });
  assert.equal(requireProductionWorkerConfig(config), true);
  assert.equal(requireProductionTurnstileSiteKey(htmlSource()), true);

  for (const databaseId of [
    "",
    "__D1_DATABASE_ID__",
    "00000000-0000-0000-0000-000000000000",
    "11111111-1111-1111-1111-111111111111"
  ]) {
    assert.throws(
      () => requireProductionD1(parseWranglerConfig(configSource(databaseId))),
      /production D1 database UUID/u
    );
  }

  for (const siteKey of [
    "",
    "__TURNSTILE_SITE_KEY__",
    "1x00000000000000000000AA",
    "2x00000000000000000000AB",
    "2x00000000000000000000AC",
    "3x00000000000000000000FF",
    "looks-real-but-is-not-a-cloudflare-key"
  ]) {
    assert.throws(
      () => requireProductionTurnstileSiteKey(htmlSource(siteKey)),
      /production-shaped, non-test Turnstile site key/u
    );
  }
});

test("production preflight rejects local Turnstile test mode and a broadened route", () => {
  const testMode = parseWranglerConfig(configSource());
  testMode.vars.EXPECTED_TURNSTILE_HOSTNAME = "example.com";
  testMode.vars.TURNSTILE_ACTION = "test";
  assert.throws(
    () => requireProductionWorkerConfig(testMode),
    /reviewed EXPECTED_TURNSTILE_HOSTNAME value/u
  );

  const localOrigin = parseWranglerConfig(configSource());
  localOrigin.vars.ALLOWED_ORIGIN = "http://localhost:4173";
  assert.throws(
    () => requireProductionWorkerConfig(localOrigin),
    /reviewed ALLOWED_ORIGIN value/u
  );

  const broadRoute = parseWranglerConfig(configSource());
  broadRoute.routes[0].pattern = "https://bytlot.com/*";
  assert.throws(
    () => requireProductionWorkerConfig(broadRoute),
    /single reviewed https:\/\/bytlot\.com\/api\/feedback\* route/u
  );
});

test("production preflight pins the entrypoint and forbids assets or plaintext secrets", () => {
  for (const [mutation, expectedError] of [
    [(config) => { config.account_id = "00000000000000000000000000000000"; }, /reviewed Cloudflare account id/u],
    [(config) => { config.name = "bytlot-feedback-local"; }, /reviewed Worker name and production entrypoint/u],
    [(config) => { config.main = "src\/local.js"; }, /reviewed Worker name and production entrypoint/u],
    [(config) => { config.assets = { directory: "." }; }, /must not publish static assets/u],
    [(config) => { config.vars.TURNSTILE_SECRET_KEY = "plaintext"; }, /must not be stored in plaintext/u]
  ]) {
    const config = parseWranglerConfig(configSource());
    mutation(config);
    assert.throws(() => requireProductionWorkerConfig(config), expectedError);
  }
});

test("production D1 and authenticated account are pinned", () => {
  const wrongDatabase = parseWranglerConfig(configSource());
  wrongDatabase.d1_databases[0].database_name = "other-database";
  assert.throws(() => requireProductionD1(wrongDatabase), /must be named bytlot-feedback/u);

  assert.equal(requireAuthenticatedAccount(JSON.stringify({
    loggedIn: true,
    accounts: [{ id: PRODUCTION_ACCOUNT_ID }]
  })), true);
  assert.throws(() => requireAuthenticatedAccount(JSON.stringify({
    loggedIn: true,
    accounts: [{ id: "00000000000000000000000000000000" }]
  })), /reviewed production account/u);
  assert.throws(() => requireAuthenticatedAccount("{}"), /reviewed production account/u);
});

test("preflight is local-only and remote verification is read-only", async () => {
  const local = deploymentDependencies({
    runInvocation: async () => assert.fail("preflight must not invoke Wrangler")
  });
  const preflight = await deployFeedback(["--preflight"], local.dependencies);
  assert.equal(preflight.mode, "preflight");

  const remote = deploymentDependencies();
  const verified = await deployFeedback(["--verify-remote"], remote.dependencies);
  assert.equal(verified.mode, "verify-remote");
  assert.deepEqual(remote.invocations.map((invocation) => invocation.args[0]), ["whoami", "secret"]);
});

test("first bootstrap migrates D1 before any secret-created Worker version", async () => {
  const state = deploymentDependencies();
  const result = await deployFeedback(["--bootstrap-database"], state.dependencies);

  assert.equal(result.mode, "bootstrap-database");
  assert.deepEqual(state.invocations.map((invocation) => invocation.args[0]), ["whoami", "d1"]);
  assert.deepEqual(state.invocations[1].args.slice(0, 5), [
    "d1",
    "migrations",
    "apply",
    FEEDBACK_DATABASE_BINDING,
    "--remote"
  ]);
  assert.equal(state.invocations.some((invocation) => invocation.args[0] === "secret"), false);
  assert.equal(state.invocations.some((invocation) => invocation.args[0] === "deploy"), false);
});

test("guarded deployment uses local Wrangler without a shell and preserves migration-before-deploy order", async () => {
  const state = deploymentDependencies();
  const result = await deployFeedback(["--deploy-worker"], state.dependencies);

  assert.equal(result.mode, "deploy-worker");
  assert.deepEqual(state.invocations.map((invocation) => invocation.args[0]), [
    "whoami",
    "secret",
    "d1",
    "deploy"
  ]);
  for (const invocation of state.invocations) {
    assert.equal(invocation.command, WRANGLER_PATH);
    assert.equal(invocation.options.shell, false);
    assert.equal(invocation.args[invocation.args.indexOf("--config") + 1], WRANGLER_CONFIG_PATH);
  }

  assert.deepEqual(state.invocations[2].args.slice(0, 5), [
    "d1",
    "migrations",
    "apply",
    FEEDBACK_DATABASE_BINDING,
    "--remote"
  ]);
  assert.deepEqual(state.invocations[3].args.slice(0, 1), ["deploy"]);
  assert.equal(state.invocations.some((invocation) => invocation.args.includes("login")), false);
  assert.equal(state.invocations.some((invocation) => invocation.args.includes("put")), false);
  assert.equal(state.invocations.some((invocation) => /(?:^|\/)git$/u.test(invocation.command)), false);

  const visibleMessages = state.messages.join("\n");
  assert.equal(visibleMessages.includes("must-never-be-printed"), false);
  assert.match(visibleMessages, /frontend was not published/u);
});

test("missing secret binding fails before remote migration or Worker deployment", async () => {
  const state = deploymentDependencies();
  state.dependencies.runInvocation = async (invocation) => {
    state.invocations.push(invocation);
    if (invocation.args[0] === "whoami") {
      return {
        stdout: JSON.stringify({ loggedIn: true, accounts: [{ id: PRODUCTION_ACCOUNT_ID }] })
      };
    }
    if (invocation.args[0] === "secret") return { stdout: "[]" };
    assert.fail("mutation must not run without the secret binding");
  };

  await assert.rejects(
    () => deployFeedback(["--deploy-worker"], state.dependencies),
    /TURNSTILE_SECRET_KEY is not configured/u
  );
  assert.deepEqual(state.invocations.map((invocation) => invocation.args[0]), ["whoami", "secret"]);
});

test("migration failure stops the Worker deployment", async () => {
  const state = deploymentDependencies();
  const originalRunner = state.dependencies.runInvocation;
  state.dependencies.runInvocation = async (invocation) => {
    if (invocation.args[0] === "d1") {
      state.invocations.push(invocation);
      throw new Error("Remote D1 migration failed.");
    }
    return originalRunner(invocation);
  };

  await assert.rejects(
    () => deployFeedback(["--deploy-worker"], state.dependencies),
    /Remote D1 migration failed/u
  );
  assert.deepEqual(state.invocations.map((invocation) => invocation.args[0]), ["whoami", "secret", "d1"]);
});

test("Wrangler invocation factory never enables a shell", () => {
  const invocation = createWranglerInvocation(["whoami", "--json"], {
    capture: true,
    label: "test"
  });
  assert.equal(invocation.command, WRANGLER_PATH);
  assert.equal(invocation.options.shell, false);
  assert.deepEqual(invocation.options.stdio, ["ignore", "pipe", "pipe"]);
  assert.equal(invocation.options.env.WRANGLER_WRITE_LOGS, "false");
  assert.equal(Object.hasOwn(invocation.options.env, "WRANGLER_LOG_PATH"), false);
});
