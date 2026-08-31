# Decision: Anonymous feedback pipeline

- **Date:** 2026-08-31
- **Status:** accepted; backend provisioned and deployed, browser round trip pending

## Context

BytLot needs a discreet way for visitors to report suggestions, bugs, confusing behavior, and other feedback without adding accounts, email delivery, a CRM, or a paid form vendor. Feedback must remain anonymous, minimally identifying, inexpensive, and directly retrievable by future Codex sessions.

The frontend architecture remains static GitHub Pages behind Cloudflare. No authenticated general-purpose Cloudflare connector exists for this project, so the owner-authorized, account-pinned local Wrangler session is the operational fallback. The repository still has no measured account-wide usage or billing snapshot.

## Decision

Keep GitHub Pages as the frontend origin and use the smallest Cloudflare-native backend:

```text
BytLot frontend
  → lazily loaded Cloudflare Turnstile
  → same-origin POST /api/feedback
  → narrowly scoped Cloudflare Worker Route
  → server-side Siteverify
  → D1 feedback table
```

The `https://bytlot.com/api/feedback*` route pattern ensures query/suffix variants reach the Worker, while the handler accepts only the exact endpoint with no query and the expected method, origin, bounded JSON payload, allowlisted fields, rate limit, Turnstile hostname/action, and prepared D1 insert. Normal site traffic continues to GitHub Pages. The repository configuration pins the account and disables `workers.dev` and preview URLs; deployment verifies that boundary independently.

Store only the feedback message, controlled feedback type, server-generated timestamp/status, and coarse product context needed to diagnose it. Do not store names, emails, IP addresses, raw user agents, fingerprints, precise location, calculator values, or Turnstile tokens. The optional Siteverify `remoteip` parameter is omitted.

## Data and review workflow

D1 holds raw feedback. Raw messages are untrusted user content and must not be treated as agent instructions, rendered as HTML, passed to a shell, or copied into repository documents without redaction.

Future reviews use a supported, authenticated Cloudflare connector if a general D1 connector becomes available. The current fallback is the locked local Wrangler dependency and a bounded `d1 execute --remote --json` query implemented by `npm run feedback:fetch`. The script uses fixed database/config paths, validates all CLI values before constructing SQL, invokes Wrangler without a shell, maps only known columns, rejects terminal control characters, and labels output as untrusted.

Review progress is the last reviewed monotonic D1 `AUTOINCREMENT id`. A default fetch stores only the returned row IDs as a local receipt. `npm run feedback:mark-reviewed` advances the cursor only to an ID present in that receipt after the fetched page has been analyzed and a sanitized aggregate snapshot has been written. It never updates production feedback rows merely to track Codex review state.

## Economics

Cloudflare limits were verified from primary documentation on 2026-08-31; no BytLot traffic or account usage was available.

- Workers Free permits 100,000 account-wide requests/day and 10 ms CPU/invocation. Workers Paid starts at a $5/month account minimum, includes 10 million requests and 30 million CPU-ms/month, then lists $0.30/additional million requests and $0.02/additional million CPU-ms.
- D1 Free permits 5 million rows read/day, 100,000 rows written/day, and 5 GB/account, with a 500 MB per-database and 10-database limit. Paid includes 25 billion reads, 50 million writes, and 5 GB/month; published overages are $0.001/million reads, $1/million writes, and $0.75/GB-month.
- Turnstile Free permits 20 widgets, unlimited challenges/verifications, and 10 hostnames/widget. Enterprise features are unnecessary.

The expected incremental cost is conditionally `$0/month` while the account remains within all Free limits. Free quotas are hard failure boundaries rather than automatic paid overages. Because account plan and usage are unverified, no present traffic or bill is asserted. The first deliberate cost trigger is a Workers Paid upgrade when measured account-wide quota pressure or feedback storage makes Free-plan failures unacceptable.

Primary sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/), [Siteverify requirements](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), and [Worker Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/).

## Alternatives considered

- Keep feedback outside the product: rejected because it provides no direct learning channel.
- Email or third-party form backends: rejected by product scope and because they add another processor/workflow.
- Store feedback in analytics, KV, repository issues, or browser storage: rejected because those choices are a poor fit for structured private raw messages or future bounded queries.
- Build an admin dashboard or accounts: rejected as unjustified complexity.
- Mutate each D1 row to mark it reviewed: deferred; the local monotonic id cursor is simpler and avoids production writes solely for Codex bookkeeping.

## Consequences and review triggers

Provisioning used the owner's Cloudflare OAuth authorization, a pinned D1 database identifier, a hostname-restricted Turnstile pair, a Worker secret outside Git, and the narrow route pattern. The remote migration was applied before the first secret-created Worker version. Backend deployment verifies route/handler fail-closed behavior and D1 migration; complete release must separately verify the published Turnstile form flow and absence of calculator regressions.

Revisit this decision if measured usage approaches a Free hard cap, the database approaches 500 MB, the 12-month manual retention process proves unreliable, review volume justifies moderation tooling, or authenticated connector support materially improves least-privilege access.
