# Infrastructure status

## Current architecture

```text
User → Cloudflare → GitHub Pages → client-side application
```

The repository is a static GitHub Pages site with `bytlot.com` configured through a CNAME. Cloudflare edge/DNS settings remain outside Git, while the feedback Worker has reviewed production and isolated local Wrangler configurations under `worker/`. No general-purpose Cloudflare connector is available; the owner-authorized, account-pinned local Wrangler session is the supported operational fallback.

The Driver Profit MVP was published from `master` on 2026-08-28. GitHub Pages reported the application release commit as built, the custom domain returned HTTPS `200`, Cloudflare redirected HTTP to HTTPS, and production assets and calculator workflows passed smoke tests. See [`deployments.md`](deployments.md) for the durable verification record.

## Cost and dependencies

The deployed MVP targets approximately zero incremental recurring cost. It relies on existing GitHub Pages and the external Cloudflare/domain setup. No paid service, backend, database, analytics provider, or server-side runtime is required by the deployed calculator.

On 2026-08-31 the feedback D1 database, hostname-restricted Turnstile widget, remote migration, Worker secret binding, and production route were provisioned through the authenticated Wrangler fallback. Backend rejection-path smoke tests passed while normal GitHub Pages routes remained available. The browser submission/retrieval round trip remains pending until the matching frontend commit is published. No account-wide usage or billing snapshot is available, so the `$0` estimate below remains conditional.

The tracked production URLs assume the `bytlot.com` domain root. Repository-subpath hosting is not a supported release target; serve the repository root when testing locally.

## Limits and observed bottlenecks

No traffic, search, or product-event dataset is accessible from this workspace. Browser-only persistence cannot provide accounts, synchronized history, secrets, payments, or trusted server-side processing.

An Aug. 31, 2026 mobile PageSpeed lab run scored 99 with a 1.6 s LCP, 0 ms TBT, and 0.008 CLS. Its low-impact findings were a 4-hour browser TTL for first-party assets, one 4.7 KiB render-blocking stylesheet, a serial application-module import, and Cloudflare's automatically injected RUM beacon. The application now preloads its required calculation module and uses versioned URLs for the reported mutable assets. The stylesheet remains render-blocking because a critical-CSS split would duplicate most above-the-fold styles for an estimated 160 ms request.

Browser-cache TTL and RUM injection are Cloudflare control-plane settings, not GitHub Pages repository settings. Keep HTML short-lived. Before increasing static-asset TTL, require versioned URLs and exclude HTML, `robots.txt`, and `sitemap.xml`. Disable automatic RUM unless the owner explicitly approves and documents client-side performance telemetry.

## Anonymous-feedback path

The deployed backend and release-gated frontend use this routing shape:

```text
Visitor → GitHub Pages frontend
        → Turnstile challenge
        → POST https://bytlot.com/api/feedback
        → narrowly scoped Cloudflare Worker Route
        → server-side Turnstile Siteverify
        → parameterized INSERT into D1
```

Normal page and asset requests continue to GitHub Pages. The route pattern `https://bytlot.com/api/feedback*` deliberately sends query/suffix variants to the Worker, whose handler accepts only the exact `/api/feedback` path with no query string. It uses an application rate-limit binding and fails closed on missing bindings, verification failure, or database failure. The Turnstile secret belongs in a Cloudflare secret binding, never source control. The browser uses `no-referrer`, and the application deliberately omits the optional visitor IP from Siteverify and does not persist an IP, identity, raw user agent, calculator values, or Turnstile token.

The local retrieval fallback uses the locked Wrangler dependency without a shell:

```sh
npm run feedback:fetch
```

It performs a bounded remote D1 query and emits JSON marked as untrusted user content. [`docs/analytics/feedback/README.md`](../analytics/feedback/README.md) defines the complete review process. `feedback:mark-reviewed` advances only the repository cursor; it does not mutate D1 rows.

Local browser integration is deliberately isolated from production. `npm run feedback:db:local` applies migrations to simulated D1, while `npm run feedback:dev` serves the site and local Worker from `worker/wrangler.local.jsonc`. Its separate `worker/src/local.js` verifier accepts only Cloudflare's documented public dummy token/key pair; the production entrypoint still calls Siteverify and requires the exact `bytlot.com` hostname plus `feedback_submit` action. The production deployment guard reads only `worker/wrangler.jsonc` and rejects local `example.com`/`test` settings.

## Guarded production deployment

Production provisioning was first completed on 2026-08-31 with Node.js 22, locked Wrangler, a pinned Cloudflare account, the `bytlot-feedback` D1 database, a `bytlot.com`-restricted Turnstile widget, and a secret binding outside Git. The public sitekey is committed; the secret value must never enter a command argument, repository file, log, or review artifact.

The repository exposes four deliberately separate commands:

```sh
npm run feedback:deploy:preflight
npm run feedback:deploy:bootstrap
npm run feedback:deploy:verify
npm run feedback:deploy
```

`feedback:deploy:preflight` is local-only and rejects a missing, placeholder, malformed, or test D1/sitekey configuration. It pins the reviewed Cloudflare account, Worker name/entrypoint, exact `bytlot-feedback` database name, narrow `https://bytlot.com/api/feedback*` route pattern, disabled `workers.dev`/preview URLs, `ALLOWED_ORIGIN=https://bytlot.com`, `EXPECTED_TURNSTILE_HOSTNAME=bytlot.com`, and `TURNSTILE_ACTION=feedback_submit`; the local `example.com`/`test` path cannot pass this guard. `feedback:deploy:bootstrap` verifies the pinned account and applies remote D1 migrations before a first `wrangler secret put` can create a Worker version. Only after that migration succeeds may the secret be entered through interactive stdin. `feedback:deploy:verify` confirms the authenticated account and only the `TURNSTILE_SECRET_KEY` binding name; captured account and secret-list output is not printed. Guarded Wrangler invocations disable disk logging.

`feedback:deploy` first runs the complete release check, repeats the guard, verifies the secret name, reapplies any pending migrations, and only then deploys the Worker. A failed authentication, account match, secret check, migration, or Worker deployment stops the sequence. The guard never runs Git, commits, pushes, publishes GitHub Pages, or submits production feedback.

Keep the remaining gates explicit and in this order:

1. Run the guarded Worker deployment and retain its non-secret result for the release record.
2. Verify the production API handler and representative rejection paths while confirming normal site routes still reach GitHub Pages.
3. Publish the static frontend separately through the reviewed GitHub Pages workflow only after the Worker gate passes.
4. In the published browser flow, send one controlled non-sensitive message, verify exactly one D1 row, retrieve it with `npm run feedback:fetch`, and record only sanitized evidence.

The first two steps cannot prove the full Turnstile browser round trip because the production widget is hostname-bound and the frontend is intentionally not published by the Worker guard. Therefore the successful submission remains a distinct post-publication gate rather than being simulated or silently automated.

## Verified pricing boundary

Pricing and limits below were checked against Cloudflare's primary documentation on 2026-08-31. They describe vendor limits, not measured BytLot usage.

| Service | Free boundary relevant here | First paid boundary |
| --- | --- | --- |
| Workers | 100,000 requests per day per account; 10 ms CPU per invocation | Workers Paid has a $5/month account minimum, includes 10 million requests and 30 million CPU-ms per month, then charges $0.30 per additional million requests and $0.02 per additional million CPU-ms |
| D1 | 5 million rows read/day, 100,000 rows written/day, 5 GB/account; also 500 MB/database and 10 databases/account | Paid includes 25 billion rows read, 50 million rows written, and 5 GB/month; overages are $0.001/million reads, $1/million writes, and $0.75/GB-month |
| Turnstile | Free, up to 20 widgets, unlimited challenges/verifications, and 10 hostnames/widget | Enterprise is contact-sales and is not required by this design |

Workers and D1 Free limits are hard operational caps. Workers returns an error after its daily request allocation; D1 queries error after daily read/write limits and writes stop at the storage cap. Therefore the conditional incremental estimate is `$0/month` only while aggregate account usage remains inside all Free limits. There is no traffic or account-usage snapshot in this repository, so current consumption and the first capacity limit cannot be claimed. If the Cloudflare account already pays for Workers, the feedback feature can remain within that existing inclusion; otherwise the first deliberate recurring-cost step is the $5/month Workers Paid plan.

One accepted submission inserts one feedback table row, while storage-engine work and any future indexes can affect the metered row count; the initial schema has no secondary index. Retrieval queries also count toward D1 rows read. Monitor actual Worker requests/CPU and D1 `rows_read`, `rows_written`, and database size before considering an upgrade. Do not infer a bill from feedback count alone.

Primary sources:

- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) and [mandatory server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Worker Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/) and [Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Wrangler D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/)

## Provisioning and review trigger

Provisioning and backend deployment are complete; public release still requires the static frontend commit plus the controlled production submission/retrieval gate. Before describing actual billing as `$0`, inspect the account plan and aggregate account-wide usage through an authorized source; repository configuration alone proves only that this architecture fits the documented Free limits.

Revisit the architecture before upgrading when daily hard-cap pressure, a 500 MB feedback database, unacceptable quota-related unavailability, a new retention obligation, or measured review volume justifies a change. Give the owner visibility before any recurring expense.
