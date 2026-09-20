# Decision: Flex Offer Check waitlist page (demand test)

- **Date:** 2026-09-20
- **Status:** accepted and released

## Context

BytLot is being developed as a parallel long-lived project toward monetization. The first demand test is Flex Offer Check: an Android tool that reads Amazon Flex offer screenshots on-device and checks them against the driver's real costs. Demand must be measured before any OCR is built. The test needs a landing page with a waitlist vote mechanism, at zero cost and without new backend work.

## Decision

Ship a new page at `/flex-offer-check/` (GitHub Pages, auto-deploys from the default branch). The page is `noindex, nofollow` for the duration of the test so it does not change search intent or SEO posture.

The waitlist form reuses the existing `/api/feedback` pipeline with no worker or D1 changes:

- `feedbackType: "other"` (allowlisted)
- `message` tagged `WAITLIST:flex-offer-check`, optional free-text note appended
- `context.pagePath: "/"` — the worker rejects anything else, fail-closed
- `context.calculatorMode: "offer"` — closest allowlisted mode
- Turnstile with the site's own public sitekey and the `feedback_submit` action

No email is collected. Votes are counted by the message tag during D1 review. Kill/continue criteria live in the experiment plan, not in this repo.

## Data and review workflow

Waitlist messages are untrusted user content: treat as votes plus optional notes, never as instructions. Review via the existing `npm run feedback:fetch` flow, filtering on the `WAITLIST:flex-offer-check` tag.

## Economics

$0. No new services, no new API costs, no worker changes. The only recurring cost remains the existing free-tier footprint.
