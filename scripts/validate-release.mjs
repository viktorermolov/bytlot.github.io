import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { requireProductionTurnstileSiteKey } from "./deploy-feedback.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
try {
  requireProductionTurnstileSiteKey(html);
  console.log("Release validation passed (production Turnstile site key configured).");
} catch (error) {
  process.stderr.write(`Release validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
