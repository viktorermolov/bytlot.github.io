# Architecture

## Current MVP

```text
Visitor → Cloudflare → GitHub Pages → browser-side BytLot application
```

The repository is a static GitHub Pages site with the `bytlot.com` CNAME. Cloudflare is an external edge/domain layer; no Cloudflare configuration is stored here. Driver Profit is a vanilla HTML/CSS/JavaScript, client-only application with pure, tested calculation formulas.

Production uses the custom-domain root, so application and icon URLs are root-absolute. Local smoke tests must serve the repository root; a generic subpath preview is not a supported deployment shape.

## Boundaries

- No backend, accounts, subscriptions, database, runtime AI, application-owned analytics script, or external calculation API in the MVP. An automatically injected Cloudflare RUM beacon was observed on 2026-08-31 and remains an external control-plane cleanup item.
- Inputs and calculations remain on the device. The only permitted browser persistence is `localStorage` for vehicle assumptions and target hourly profit.
- Presentation code should not contain the authoritative formula logic. Formula behavior must be deterministic, documented, and testable.
- The calculation model is platform-neutral: no provider-specific payout rules or default assumptions belong in the core.

## Change triggers

Add infrastructure only for a demonstrated requirement, such as a protected secret, payment webhook, authentication, shared synchronized data, or server-side operation. First compare remaining client-only, a Cloudflare Worker, managed alternatives, and postponement. Record the limitation, evidence, cost range, risks, and owner decision in an infrastructure proposal/decision record.

See [`docs/operations/infrastructure.md`](docs/operations/infrastructure.md) for current status and [`docs/decisions/`](docs/decisions/) for rationale.
