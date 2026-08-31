# Infrastructure status

## Current architecture

```text
User → Cloudflare → GitHub Pages → client-side application
```

The repository is a static GitHub Pages site with `bytlot.com` configured through a CNAME. Cloudflare exists outside this repository; no Cloudflare configuration or direct connector is available here. GitHub access is available through a connector.

The Driver Profit MVP was published from `master` on 2026-08-28. GitHub Pages reported the application release commit as built, the custom domain returned HTTPS `200`, Cloudflare redirected HTTP to HTTPS, and production assets and calculator workflows passed smoke tests. See [`deployments.md`](deployments.md) for the durable verification record.

## Cost and dependencies

The MVP targets approximately zero incremental recurring cost. It relies on existing GitHub Pages and the external Cloudflare/domain setup. No paid service, backend, database, analytics provider, or server-side runtime is required by the MVP.

The tracked production URLs assume the `bytlot.com` domain root. Repository-subpath hosting is not a supported release target; serve the repository root when testing locally.

## Limits and observed bottlenecks

No traffic, search, or product-event dataset is accessible from this workspace. Browser-only persistence cannot provide accounts, synchronized history, secrets, payments, or trusted server-side processing.

An Aug. 31, 2026 mobile PageSpeed lab run scored 99 with a 1.6 s LCP, 0 ms TBT, and 0.008 CLS. Its low-impact findings were a 4-hour browser TTL for first-party assets, one 4.7 KiB render-blocking stylesheet, a serial application-module import, and Cloudflare's automatically injected RUM beacon. The application now preloads its required calculation module and uses versioned URLs for the reported mutable assets. The stylesheet remains render-blocking because a critical-CSS split would duplicate most above-the-fold styles for an estimated 160 ms request.

Browser-cache TTL and RUM injection are Cloudflare control-plane settings, not GitHub Pages repository settings. Keep HTML short-lived. Before increasing static-asset TTL, require versioned URLs and exclude HTML, `robots.txt`, and `sitemap.xml`. Disable automatic RUM unless the owner explicitly approves and documents client-side performance telemetry.

## Next plausible step

A Cloudflare Worker is the smallest likely server-side option if a concrete need arises for a protected secret, webhook, trusted operation, rate limiting, or secure shared API. Before any expansion, write an infrastructure proposal: current limitation, evidence, alternatives, cost range, migration complexity, risks, and recommendation. Give the owner visibility before a recurring expense.
