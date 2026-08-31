import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "css/styles.css"), "utf8");
const pageTitle = "Driver Profit Calculator for Delivery &amp; Gig Work | BytLot";
const pageDescription = "Estimate delivery and gig-work profit after fuel or charging, maintenance, tires, depreciation, and other vehicle costs. Check a shift or compare an offer.";
const socialTitle = "Driver Profit Calculator for Delivery &amp; Gig Work";
const socialDescription = "Estimate profit after fuel or charging and other vehicle costs. Check a completed shift or compare an offer with your target.";

assert.match(html, /<html lang="en">/);
assert.ok(html.includes(`<title>${pageTitle}</title>`));
assert.ok(html.includes(`<meta name="description" content="${pageDescription}">`));
assert.match(html, /<link rel="canonical" href="https:\/\/bytlot\.com\/">/);
assert.equal((html.match(/rel="canonical"/g) || []).length, 1, "Expected exactly one canonical link.");
assert.doesNotMatch(html, /<meta[^>]+name="robots"[^>]+noindex/i);
assert.ok(html.includes(`<meta property="og:title" content="${socialTitle}">`));
assert.ok(html.includes(`<meta property="og:description" content="${socialDescription}">`));
assert.ok(html.includes(`<meta name="twitter:title" content="${socialTitle}">`));
assert.ok(html.includes(`<meta name="twitter:description" content="${socialDescription}">`));
assert.match(html, /property="og:image" content="https:\/\/bytlot\.com\/img\/og-driver-profit\.png"/);
assert.match(html, /<meta name="twitter:image:alt" content="BytLot Driver Profit calculator — know the real number\.">/);
assert.match(html, /<h1[^>]*>Driver profit calculator\.<\/h1>/);
assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, "Expected exactly one H1.");
assert.match(html, /<h2 id="how-heading">How the estimate works\.<\/h2>/);
assert.match(html, /then subtracts total miles × your editable vehicle cost per mile/);
assert.match(html, /minimum payout combines that vehicle cost with your hourly target for the estimated time/);
assert.match(html, /<link rel="icon" href="\/favicon_io\/favicon\.ico\?v=20260828-brand" sizes="16x16 32x32">/);
assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="\/favicon_io\/bytlot-mark\.svg">/);
assert.match(html, /<img class="brand-mark" src="\/favicon_io\/bytlot-mark\.svg" alt="" width="32" height="32">/);
assert.match(html, /<link rel="stylesheet" href="\/css\/styles\.css\?v=20260828-rhythm">/);
assert.match(html, />Charging loss estimate<\/label>/);
assert.match(html, /aria-describedby="charging-loss-help"/);
assert.match(html, />Energy lost between the outlet and battery\.<\/small>/);
assert.match(html, /<label class="field field--wide" for="miles-driven">/);
assert.match(css, /--space-form-section: 22px;/);
assert.match(css, /\.calculate-button \{[\s\S]*?margin-top: var\(--space-form-section\);/);
assert.match(css, /\.form-error:not\(\[hidden\]\) \+ \.calculate-button \{ margin-top: 12px; \}/);
const structuredDataMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(structuredDataMatch, "Missing JSON-LD structured data.");
const structuredData = JSON.parse(structuredDataMatch[1]);
const website = structuredData["@graph"].find((entry) => entry["@type"] === "WebSite");
assert.equal(website?.["@id"], "https://bytlot.com/#website");
assert.equal(website?.url, "https://bytlot.com/");
assert.equal(website?.name, "BytLot");
const webApplication = structuredData["@graph"].find((entry) => entry["@type"] === "WebApplication");
assert.equal(webApplication?.["@id"], "https://bytlot.com/#driver-profit");
assert.equal(webApplication?.name, "BytLot Driver Profit");
assert.equal(webApplication?.url, "https://bytlot.com/");
assert.equal(webApplication?.isPartOf?.["@id"], "https://bytlot.com/#website");
assert.equal(webApplication?.applicationCategory, "FinanceApplication");
assert.equal(webApplication?.operatingSystem, "Any");
assert.equal(webApplication?.isAccessibleForFree, true);
assert.equal(webApplication?.offers?.["@type"], "Offer");
assert.equal(webApplication?.offers?.price, "0");
assert.equal(webApplication?.offers?.priceCurrency, "USD");
assert.equal(webApplication?.description, "A free browser-based calculator that estimates delivery and gig-work profit after editable vehicle costs.");
assert.equal(structuredData["@graph"].some((entry) => entry["@type"] === "FAQPage"), false);
assert.equal((html.match(/<details><summary>/g) || []).length, 6, "Expected six visible FAQ entries.");
assert.match(html, /<\/html>\s*$/);
assert.doesNotMatch(html, /coming soon|countdown|expired/i);
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
assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"), "Missing maskable app icon.");
for (const icon of manifest.icons) {
  const iconPath = icon.src.split(/[?#]/)[0];
  assert.ok(existsSync(join(root, iconPath)), `Missing manifest icon: ${icon.src}`);
}

assert.ok(existsSync(join(root, "robots.txt")), "Missing robots.txt.");
assert.ok(existsSync(join(root, "sitemap.xml")), "Missing sitemap.xml.");
const robots = readFileSync(join(root, "robots.txt"), "utf8");
assert.equal(robots.trim(), "User-agent: *\nAllow: /\n\nSitemap: https://bytlot.com/sitemap.xml");
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const sitemapEntries = sitemap.match(/<url>[\s\S]*?<\/url>/g) || [];
const sitemapLocations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const sitemapLastModified = [...sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((match) => match[1]);
assert.equal(sitemapEntries.length, 1, "Expected exactly one sitemap URL entry.");
assert.deepEqual(sitemapLocations, ["https://bytlot.com/"]);
assert.equal(sitemapLastModified.length, 1, "Expected one sitemap lastmod value.");
assert.match(sitemapLastModified[0], /^\d{4}-\d{2}-\d{2}$/);
assert.ok(Date.parse(`${sitemapLastModified[0]}T00:00:00Z`) <= Date.now() + 86_400_000, "Sitemap lastmod cannot be in the future.");
assert.ok(existsSync(join(root, ".nojekyll")), "Missing .nojekyll GitHub Pages marker.");

const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".txt", ".webmanifest", ".xml"]);
const extensionlessTextFiles = new Set([".browserslistrc", ".gitignore", ".nojekyll", "CNAME"]);

function collectTextFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return [".git", "node_modules"].includes(entry.name)
        ? []
        : collectTextFiles(join(directory, entry.name));
    }
    return textExtensions.has(extname(entry.name)) || extensionlessTextFiles.has(entry.name)
      ? [join(directory, entry.name)]
      : [];
  });
}

for (const file of collectTextFiles(root)) {
  assert.doesNotMatch(readFileSync(file, "utf8"), /byt\s*lot\s*(llc|l\.l\.c\.)/i, `Former legal-entity wording found in ${file}`);
}

console.log(`Site validation passed (${new Set(localReferences).size} local references checked).`);
