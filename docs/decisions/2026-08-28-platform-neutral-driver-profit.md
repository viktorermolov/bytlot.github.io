# Decision: Keep Driver Profit platform-neutral

- **Date:** 2026-08-28
- **Status:** accepted

## Decision

Driver Profit will serve delivery drivers and gig workers generally. Its core calculator will not include any platform-specific rules, earnings assumptions, or endorsements.

## Reason and evidence

The product problem is the gap between payout/gross earnings and estimated vehicle-adjusted profit, which applies across platforms. A neutral model keeps inputs understandable and formula behavior reusable.

## Alternatives considered

- Build for one named platform first: faster initial framing, but creates misleading specificity and limits reuse.
- Include platform presets in the core: defer; no evidence or maintained assumptions justify them.

## Risks

Neutral language may be less immediately discoverable for a niche search. Address only with evidence-backed content or optional presets later, without changing core formulas.
