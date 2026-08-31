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
