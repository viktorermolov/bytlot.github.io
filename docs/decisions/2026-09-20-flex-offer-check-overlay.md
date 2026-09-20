# Decision: Flex Offer Check is a screen overlay, not a screenshot tool

Date: 2026-09-20
Status: accepted (owner direction)

## Context

The waitlist page first described Flex Offer Check as screenshot-based: the
driver screenshots an offer, the tool OCRs it on-device, returns a verdict.

## Decision

The concept is a **screen overlay**: it reads the offer right on the Amazon
Flex app screen and shows the take-or-skip verdict on the offer itself. No
screenshots, no app-switching.

Rationale (owner): Flex offers are claimed in seconds — there is no time to
screenshot and switch apps. An overlay is the only UX honest to the "instant"
promise. On-device reading and battery-light constraints are unchanged.

## Consequences

- Landing page (`flex-offer-check/index.html`), main-page banner, plan
  hypothesis, and outreach drafts rewritten from screenshot flow to overlay.
- Technical note for later: overlay likely means Android overlay permission
  (SYSTEM_ALERT_WINDOW) plus on-device reading of the visible offer —
  either accessibility-tree text or MediaProjection + on-device OCR.
  No build starts until the demand test resolves.
- The demand-test criteria (votes, kill/extend) are unchanged.
