# BytLot

**Know the real number.**

BytLot is a static, platform-neutral Driver Profit calculator for delivery drivers and gig workers.

Live product: [bytlot.com](https://bytlot.com/)

Vanilla HTML, CSS, and JavaScript run on GitHub Pages behind Cloudflare. Calculations stay in the browser. Optional local storage is limited to vehicle assumptions and target hourly profit. Contact is a `mailto:` link; there is no feedback form or application backend in the current source.

## Local development

Use Node.js 22 or newer (`.nvmrc`). No npm dependencies are required.

- `npm run check`: Node calculation/settings/example tests and static-site validation.
- `npm run serve`: Python 3 static preview at `http://127.0.0.1:4173/`. Serve the repository root because asset paths target the custom-domain root.

Start with [AGENTS.md](AGENTS.md), [architecture](ARCHITECTURE.md), and the [release checklist](docs/operations/release-checklist.md).

The retired feedback implementation is preserved in [historical records](docs/exec-plans/completed/2026-08-31-user-feedback.md). Its former commands and deployment instructions are not current. Removing source/tooling does not prove that external Cloudflare resources have been decommissioned; this cleanup does not inspect or change them.
