# BytLot

**Know the real number.**

BytLot is a static web product for turning an incomplete headline number into the estimate that matters. Its first product is Driver Profit, a platform-neutral calculator for delivery drivers and gig workers.

Live product: [bytlot.com](https://bytlot.com/)

The MVP uses vanilla HTML, CSS, and JavaScript on GitHub Pages. Calculations run in the browser; the application does not transmit calculator inputs or results. Browser storage, if enabled, is limited to vehicle assumptions and a target hourly profit.

An anonymous feedback extension adds a separate, explicit action that sends only the visitor's selected feedback type, message, Turnstile token, and coarse page context to the same-origin `/api/feedback` Worker endpoint. It never sends calculator values. The account-pinned Cloudflare Worker, server-side Turnstile verification, D1 backend, and lazy-loaded frontend are live. No email service, account, or admin dashboard is involved.

Project operating documentation starts in [`AGENTS.md`](AGENTS.md). Product scope is in [`docs/product/vision.md`](docs/product/vision.md), and the completed MVP plan is [`docs/exec-plans/completed/2026-08-28-driver-profit-mvp.md`](docs/exec-plans/completed/2026-08-28-driver-profit-mvp.md).

## Local development

Requires Node.js 22 or newer; `.nvmrc` records the expected major version. Run `npm run check` for calculation, frontend, Worker syntax, and Worker dry-run checks, and `npm run serve` for a local static preview at `http://127.0.0.1:4173/`.

Feedback-specific local commands are `npm run feedback:db:local` for the local D1 migration and `npm run feedback:dev` for the same-origin local site plus Worker at `http://localhost:4173/` (use this hostname, not the numeric loopback URL, for feedback testing). The dedicated `worker/wrangler.local.jsonc` and `worker/src/local.js` path accepts only Cloudflare's published dummy token/key pair and is never used by the production deploy command. Real credentials must never be committed: local Wrangler state and `.dev.vars` are ignored, and the production `TURNSTILE_SECRET_KEY` must be set through Cloudflare tooling.

The backend was migrated and deployed before frontend publication. The production release then passed a controlled browser submission, D1 retrieval, calculator regression, and responsive-layout round trip. See the [completed execution plan](docs/exec-plans/completed/2026-08-31-user-feedback.md) and [release checklist](docs/operations/release-checklist.md).
