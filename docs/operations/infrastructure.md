# Infrastructure status

## Current architecture

```text
User → Cloudflare → GitHub Pages → client-side application
```

The repository is a static GitHub Pages site with `bytlot.com` configured through a CNAME. Cloudflare exists outside this repository; no Cloudflare configuration or direct connector is available here. GitHub access is available through a connector.

## Cost and dependencies

The MVP targets approximately zero incremental recurring cost. It relies on existing GitHub Pages and the external Cloudflare/domain setup. No paid service, backend, database, analytics provider, or server-side runtime is required by the MVP.

The tracked production URLs assume the `bytlot.com` domain root. Repository-subpath hosting is not a supported release target; serve the repository root when testing locally.

## Limits and observed bottlenecks

No traffic, search, or product-event data is accessible from this workspace. There is no observed technical bottleneck recorded yet. Browser-only persistence cannot provide accounts, synchronized history, secrets, payments, or trusted server-side processing.

## Next plausible step

A Cloudflare Worker is the smallest likely server-side option if a concrete need arises for a protected secret, webhook, trusted operation, rate limiting, or secure shared API. Before any expansion, write an infrastructure proposal: current limitation, evidence, alternatives, cost range, migration complexity, risks, and recommendation. Give the owner visibility before a recurring expense.
