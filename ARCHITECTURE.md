# Architecture

## Current MVP

```text
Visitor → Cloudflare → GitHub Pages → browser-side BytLot application
```

The repository is a static GitHub Pages site with the `bytlot.com` CNAME. Cloudflare is the external edge/domain layer. The last verified production release is a vanilla HTML/CSS/JavaScript, client-side Driver Profit application with pure, tested calculation formulas.

Production uses the custom-domain root, so application and icon URLs are root-absolute. Local smoke tests must serve the repository root; a generic subpath preview is not a supported deployment shape.

## Boundaries

- The calculator remains browser-only and has no accounts, subscriptions, server-side calculation data, runtime AI, application-owned analytics script, or external calculation API. The sole application backend is the explicitly invoked feedback Worker and D1 store documented below. An automatically injected Cloudflare RUM beacon was observed on 2026-08-31 and remains an external control-plane cleanup item.
- Inputs and calculations remain on the device. The only permitted browser persistence is `localStorage` for vehicle assumptions and target hourly profit.
- Presentation code should not contain the authoritative formula logic. Formula behavior must be deterministic, documented, and testable.
- The calculation model is platform-neutral: no provider-specific payout rules or default assumptions belong in the core.

## Feedback extension

The accepted feedback architecture is the smallest explicit server-side exception to the client-only product boundary:

```text
Visitor explicitly opens and submits Feedback
  → same-origin POST https://bytlot.com/api/feedback
  → narrowly scoped Cloudflare Worker Route
  → server-side Cloudflare Turnstile Siteverify
  → parameterized insert into the bytlot-feedback D1 database
  → authenticated Wrangler retrieval by monotonic feedback ID
```

The Worker Route pattern is narrowly scoped to `https://bytlot.com/api/feedback*`; the terminal wildcard ensures query-string and suffix variants reach the Worker rather than GitHub Pages. The Worker itself accepts only the exact `/api/feedback` path with no query string, so those variants fail closed. The pattern must never be broadened to `bytlot.com/*`. All other requests continue to the existing GitHub Pages origin. Production uses the account-pinned `worker/wrangler.jsonc` with `worker/src/index.js`, disabled `workers.dev` and preview URLs, `FEEDBACK_DB`, and the coarse feedback rate limiter. Local integration uses the separate `worker/wrangler.local.jsonc` plus `worker/src/local.js`; the guarded deploy command never references either local-only file. That entrypoint accepts only Cloudflare's documented public dummy token/key pair and cannot replace production Siteverify. A public production Turnstile sitekey belongs in the frontend; only its matching production `TURNSTILE_SECRET_KEY` is secret and must be provisioned with Wrangler or another Cloudflare secret mechanism.

The browser may send only `feedbackType`, `message`, a Turnstile token, and coarse context consisting of `/`, `shift` or `offer`, an application version, and `mobile`, `tablet`, or `desktop`. Both `/` and the valid `/index.html` page alias are normalized to the fixed `/` context. The request explicitly omits credentials and the referrer. The Worker fixes the product to `driver-profit`, while D1 supplies the ID, UTC creation time, and default review status. Do not send or store calculator values, name, email, account data, URL query, raw user agent, exact viewport, fingerprint, precise location, advertising identifier, or IP address in D1. Normal network delivery still exposes protocol-level data such as an IP address and User-Agent to Cloudflare; the application neither adds them to its JSON payload nor persists them. The Turnstile token is verified and discarded, never persisted.

Security is fail-closed: exact method/path/origin and JSON media type, a 16 KiB body cap, feedback/context allowlists, 10–2,000-character messages, single-use server-side Turnstile verification with expected hostname and action, a fixed non-identifying rate-limit key, and bound D1 parameters are release requirements. Responses and logs must not echo messages, tokens, secrets, database details, or verification internals. Calculator privacy language remains true because calculator inputs and results are excluded from this separate, explicit submission.

On 2026-08-31 the account-pinned D1 database, hostname-restricted Turnstile widget, remote migration, Worker secret binding, and production Worker route were provisioned before the static frontend was published. Release commit `94f30b4` then passed the live Turnstile submission, D1 retrieval, responsive-layout, calculator-regression, and generic error-response gates. The controlled smoke row was removed by an exact predicate after verification; unrelated feedback remained untouched.

## Change triggers

Add infrastructure only for a demonstrated requirement, such as a payment webhook, authentication, shared synchronized data, or another trusted server-side operation beyond the released feedback exception. First compare remaining client-only, a Cloudflare Worker, managed alternatives, and postponement. Record the limitation, evidence, cost range, risks, and owner decision in an infrastructure proposal/decision record.

See [`docs/operations/infrastructure.md`](docs/operations/infrastructure.md) for current status and [`docs/decisions/`](docs/decisions/) for rationale.
