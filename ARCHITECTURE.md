# Architecture

## Current application

```text
Visitor → Cloudflare → GitHub Pages → browser-side Driver Profit calculator
```

The repository serves vanilla HTML/CSS/JavaScript at the `bytlot.com` custom-domain root. Root-absolute assets are intentional; preview the repository root locally.

- `js/calculations.js`: pure, deterministic, platform-neutral formulas.
- `js/app.js`: calculator interaction, validation, rendering, and permitted settings persistence.
- `js/settings.js`: browser settings handling. Only vehicle assumptions and target hourly profit may persist, not earnings, mileage, or calculation history.
- `tests/` and `scripts/validate-site.mjs`: calculation, settings, worked-example, and static-site checks.
- No npm dependencies, accounts, subscriptions, runtime AI, external calculation API, or application-owned analytics script.

The shift and offer forms are local calculator controls, not feedback forms. JavaScript intercepts submission. Their controls intentionally have no `name` attributes, preventing financial values from being serialized into a URL if JavaScript fails. The calculator still requires JavaScript to work.

## Contact and retired feedback

The footer opens the visitor's email client through `mailto:`. The former feedback dialog, Worker code, and deployment/retrieval commands are absent. Its original design and release evidence remain historical records under `docs/decisions/` and `docs/exec-plans/completed/`.

External Worker routes, D1, Turnstile, and edge analytics status are not established by this repository cleanup. No live Cloudflare resources are changed. See [infrastructure status](docs/operations/infrastructure.md).

## Change triggers

Add infrastructure only for a demonstrated requirement. Compare client-only alternatives and postponement before proposing a backend. Document evidence, privacy/security boundaries, costs, risks, and the owner's decision before consequential changes.
