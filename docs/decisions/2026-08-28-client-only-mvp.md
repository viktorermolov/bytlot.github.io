# Decision: Client-only Driver Profit MVP

- **Date:** 2026-08-28
- **Status:** accepted

## Decision

Build Driver Profit as vanilla HTML, CSS, and JavaScript on the existing static GitHub Pages deployment, with calculations in the browser and approximately zero incremental infrastructure cost.

## Reason and evidence

The calculation formulas are pure and tested, and the MVP does not need accounts, shared history, secrets, payments, or trusted server-side work. Local processing also avoids sending user inputs.

## Alternatives considered

- Cloudflare Worker: defer until a protected server-side operation, webhook, rate limit, or secure shared API is required.
- Managed backend/database: defer until accounts or synchronized shared data are a demonstrated requirement.
- Third-party analytics: defer until a specific product decision requires behavior data beyond available traffic/search data.

## Risks and review trigger

There is no automatic view of product behavior and browser-only data does not follow users across devices. Revisit after a concrete requirement or evidence justifies the smallest viable addition; present cost, privacy, alternatives, and owner visibility before change.
