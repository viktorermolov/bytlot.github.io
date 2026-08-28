import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

assert.match(html, /<html lang="en">/);
assert.match(html, /<title>Driver Profit Calculator/);
assert.match(html, /<meta name="description"/);
assert.match(html, /<link rel="canonical" href="https:\/\/bytlot\.com\/">/);
assert.match(html, /property="og:image" content="https:\/\/bytlot\.com\/img\/og-driver-profit\.png"/);
assert.match(html, /<h1[^>]*>Know what you really earned\.<\/h1>/);
const structuredDataMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(structuredDataMatch, "Missing JSON-LD structured data.");
const structuredData = JSON.parse(structuredDataMatch[1]);
const faq = structuredData["@graph"].find((entry) => entry["@type"] === "FAQPage");
assert.ok(faq, "Missing FAQPage structured data.");
for (const question of faq.mainEntity) {
  assert.ok(html.includes(`<summary>${question.name}</summary>`), `FAQ question is not visible: ${question.name}`);
  assert.ok(html.includes(`<p>${question.acceptedAnswer.text}</p>`), `FAQ answer is not visible: ${question.name}`);
}
assert.match(html, /<\/html>\s*$/);
assert.doesNotMatch(html, /coming soon|countdown|expired/i);
assert.doesNotMatch(html, /byt\s*lot\s*(llc|l\.l\.c\.)/i);
assert.doesNotMatch(html, /fonts\.googleapis\.com|<script[^>]+https?:\/\//i);

const localReferences = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => path !== "/")
  .map((path) => path.split(/[?#]/)[0]);

for (const path of localReferences) {
  assert.ok(existsSync(join(root, path)), `Missing local asset: ${path}`);
}

const manifest = JSON.parse(readFileSync(join(root, "favicon_io/site.webmanifest"), "utf8"));
assert.equal(manifest.name, "BytLot Driver Profit");
for (const icon of manifest.icons) {
  assert.ok(existsSync(join(root, icon.src)), `Missing manifest icon: ${icon.src}`);
}

assert.ok(existsSync(join(root, "robots.txt")), "Missing robots.txt.");
assert.ok(existsSync(join(root, "sitemap.xml")), "Missing sitemap.xml.");
assert.ok(existsSync(join(root, ".nojekyll")), "Missing .nojekyll GitHub Pages marker.");

console.log(`Site validation passed (${new Set(localReferences).size} local references checked).`);
