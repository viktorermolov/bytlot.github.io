# Deployment log

## 2026-08-28 — Driver Profit MVP

- **Application release commit:** [`3016f6d`](https://github.com/viktorermolov/bytlot.github.io/commit/3016f6d808b4b4ebf1366c41b385338299204d6e)
- **Source:** `master`, repository root
- **Target:** [https://bytlot.com/](https://bytlot.com/)
- **GitHub Pages:** reported `built` for the application release commit with no build error
- **Edge and transport:** Cloudflare served HTTPS with `200`; HTTP redirected to HTTPS with `301`
- **Assets:** stylesheet, application modules, social image, manifest, `robots.txt`, and sitemap returned `200`
- **Product smoke test:** gasoline shift and EV offer workflows returned expected results on a 390 px viewport; keyboard tab navigation worked; no horizontal overflow, former-company copy, or console warnings/errors were present
- **Dependencies:** clean install had zero runtime/dev dependencies, zero npm vulnerabilities, and zero open Dependabot alerts after GitHub refreshed the default branch

Cloudflare configuration and Search Console were not directly inspected because no corresponding connection was available. This record verifies externally observed delivery, not every control-plane setting.

## 2026-08-31 — SEO stewardship and search signals

- **Application release commit:** [`1dccad8`](https://github.com/viktorermolov/bytlot.github.io/commit/1dccad83e23b474153660ad09f95656afe6049d1)
- **Source:** `master`, repository root
- **Target:** [https://bytlot.com/](https://bytlot.com/)
- **Delivery evidence:** production served the release-specific title, H1, methodology, and structured data after the push; response headers identified GitHub Pages delivery behind Cloudflare and a post-push `Last-Modified` timestamp
- **Edge and transport:** the canonical HTTPS page returned `200`; HTTP and HTTPS `www` redirected directly to `https://bytlot.com/` with `301`
- **SEO signals:** the self-canonical URL, permissive `robots.txt`, one-URL sitemap with an accurate `2026-08-31` `lastmod`, social metadata, stable favicon, `WebSite`, and free `WebApplication` were present in production
- **Structured-data validation:** Schema.org Validator fetched the production release and reported `0 errors` and `0 warnings`
- **Assets:** stylesheet, application module, SVG mark, `robots.txt`, and sitemap returned `200`
- **Product smoke test:** EV shift and offer workflows returned the expected `$74.50` and `$24.69/hr`; 320/390/800/801/1440 px checks had no horizontal overflow and the browser console was clean
- **Privacy and dependencies:** no analytics, external runtime dependency, user-data transmission, backend, or paid service was introduced

Search Console was not connected, so this release does not claim indexation, rankings, query demand, field Core Web Vitals, or traffic impact. The owner follow-up is to verify the domain property, submit the sitemap, inspect the canonical homepage, request one recrawl, and record a dated search baseline.

## 2026-08-31 — PageSpeed follow-up

- **Application release commit:** [`d59a837`](https://github.com/viktorermolov/bytlot.github.io/commit/d59a837)
- **Source:** `master`, repository root
- **Target:** [https://bytlot.com/](https://bytlot.com/)
- **Report baseline:** the supplied mobile PageSpeed Insights run scored Performance `99`, Accessibility `100`, Best Practices `100`, and SEO `100`; laboratory metrics were FCP `1.5 s`, LCP `1.6 s`, TBT `0 ms`, CLS `0.008`, and Speed Index `2.4 s`. The report contained no Chrome UX Report field data.
- **Application changes:** the calculation module is preloaded with an exact versioned URL; the application module and SVG mark use versioned URLs; validation now guards the preload/import match and privacy language. The interface now says calculator inputs remain on the device without making a broader claim about edge telemetry.
- **Deliberate non-change:** the `4.7 KiB` stylesheet remains external. The reported `160 ms` render-blocking opportunity did not justify duplicating critical CSS or risking flash, layout shift, and maintenance drift while LCP and CLS were already healthy.
- **Production verification:** the versioned application and calculation modules each loaded once; both EV workflows returned the expected `$74.50` and `$24.69/hr`; 320/390/800/801/1440 px checks had no horizontal overflow, the responsive breakpoint behaved correctly, and the browser console was clean.
- **Edge follow-up:** Cloudflare still injects its Web Analytics RUM beacon and applies a four-hour browser TTL to versioned static assets. Disabling automatic RUM and adding a long-lived immutable cache rule require an authenticated Cloudflare control-plane session and were not changed in this release.

No post-release PageSpeed score is claimed: a score is a sampled laboratory result and was not rerun with an available performance tracer. This record verifies the deployed source and production behavior instead.

## 2026-08-31 — Anonymous feedback

- **Application release commit:** [`94f30b4`](https://github.com/viktorermolov/bytlot.github.io/commit/94f30b49b17d1d4bce2e376163e610f3c46e7240)
- **GitHub Pages run:** `33443458794`, completed successfully
- **Source and target:** `master`, repository root, [https://bytlot.com/](https://bytlot.com/)
- **Backend ordering:** the production D1 migration completed before the first secret-created Worker version; the Turnstile secret remained outside Git; the narrow `https://bytlot.com/api/feedback*` route was deployed before the static frontend
- **Static publication:** production served the Feedback action, versioned feedback module/styles, and the hostname-restricted widget's public sitekey
- **Browser round trip:** Turnstile loaded only after the explicit Feedback action; a controlled non-sensitive submission succeeded; authenticated, logging-disabled Wrangler retrieved exactly the matching allowlisted D1 row; no raw message was committed
- **Cleanup:** the exact controlled smoke row was deleted and the zero-match result was verified; unrelated feedback remained untouched and pending review
- **Product and responsive smoke:** Shift Profit and Offer Check returned numeric results at 390 px; 390 px and 1440 px had no horizontal overflow; the mobile bottom sheet and desktop dialog fit; the browser console was clean
- **API and static smoke:** representative exact/query/method/origin/body rejection paths failed closed with generic `no-store` responses, while `/`, an application asset, `robots.txt`, and `sitemap.xml` returned `200`
- **Release checks:** a clean offline install reported zero vulnerabilities; all 89 automated tests, site validation, Wrangler dry run, JavaScript syntax, secret/former-entity scans, and Git whitespace checks passed; independent post-fix review found no P0–P2 findings

Cloudflare plan and aggregate account usage were not inspected. The feature's incremental-cost estimate remains conditionally `$0/month` only while the account stays within the documented Workers, D1, and Turnstile Free boundaries.

## 2026-09-04 — First-use clarity

- **Application release commit:** [`8277aa6`](https://github.com/viktorermolov/bytlot.github.io/commit/8277aa605545a226289f7efd49fb936791d9cca2)
- **GitHub Pages run:** [`33913694077`](https://github.com/viktorermolov/bytlot.github.io/actions/runs/33913694077), completed successfully
- **Source and target:** `master`, repository root, [https://bytlot.com/](https://bytlot.com/); owner explicitly authorized publication after successful first-stage checks
- **Changes:** compact mobile entry, clear Shift/Offer descriptions, truthful starter/saved/unsaved assumptions, two static worked examples, and a target-comparison verdict using the existing formulas
- **Release gate:** `npm run check:release` passed all 95 tests, site validation, Worker dry run and release validation; syntax, whitespace, staged secret-pattern scan, design/SEO review and final independent review passed
- **Delivery:** homepage and required release assets returned `200`; CSS, application/settings/calculation modules, robots and sitemap matched local files exactly. The HTML contained the new examples/copy and correct canonical; its only source difference was the previously documented Cloudflare RUM injection. HTTP and HTTPS `www` returned `301` to `https://bytlot.com/`.
- **Production calculations:** existing saved EV assumptions were preserved. A $120 gross / 5-hour / 80-mile shift returned $103.00 profit. A $30 / 60-minute / 25-mile offer returned $24.69/hr, a $30.32 required payout and Below your target at the existing $25/hr target; a $40 offer returned $34.69/hr and Meets your target.
- **Browser checks:** collapsed/expanded settings at 320/390/800/801/1440 px had no horizontal overflow; examples preserved inputs and current same-mode result, return links focused the first input, keyboard tabs worked, and input edits hid the stale verdict. Reload restored vehicle assumptions/target but no payouts; console warnings/errors were absent.
- **Search Console:** one post-publication homepage request showed **Indexing requested** and confirmed the priority crawl queue. The existing successful sitemap was not resubmitted. Accepted submission does not establish a completed new crawl, rankings or traffic impact.
- **Privacy and cost:** no new dependency, service, analytics, formula, feedback payload, Worker deployment or Cloudflare setting change. Existing feedback review files were excluded. No production feedback submission was needed for this unchanged feature.

The [completed plan](../exec-plans/completed/2026-09-04-first-use-clarity.md) records detailed scope and local verification. The [dated Search Console snapshot](../analytics/snapshots/2026-09-04-search-console.md) is a pre-release search baseline plus the separately labeled post-release submission outcome.
