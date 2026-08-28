# BytLot

**Know the real number.**

BytLot is a static web product for turning an incomplete headline number into the estimate that matters. Its first product is Driver Profit, a platform-neutral calculator for delivery drivers and gig workers.

Live product: [bytlot.com](https://bytlot.com/)

The MVP uses vanilla HTML, CSS, and JavaScript on GitHub Pages. Calculations run in the browser; no user data is sent. Browser storage, if enabled, is limited to vehicle assumptions and a target hourly profit.

Project operating documentation starts in [`AGENTS.md`](AGENTS.md). Product scope is in [`docs/product/vision.md`](docs/product/vision.md), and the completed MVP plan is [`docs/exec-plans/completed/2026-08-28-driver-profit-mvp.md`](docs/exec-plans/completed/2026-08-28-driver-profit-mvp.md).

## Local development

Requires Node.js 20 or newer. Run `npm run check` for formula and site validation, and `npm run serve` for a local static preview at `http://127.0.0.1:4173/`.
