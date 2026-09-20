# Decision: Flex Offer Check is a background watcher with notification verdict

Date: 2026-09-20
Status: accepted (owner direction)
Supersedes: `2026-09-20-flex-offer-check-overlay.md` (overlay concept)

## Context

Two earlier positionings — screenshot OCR, then screen overlay — did not match
how the tool must actually work.

## Decision

The app **runs in the background at all times**. When an instant offer appears
in the Amazon Flex app, it reads the offer from the screen and posts the
verdict — real $/hour, real $/mile after the driver's vehicle costs, and a
take-or-skip call — into an **Android notification**, within seconds.

## Constraints (owner)

- The 1-minute instant-offer accept window is the hard latency budget: the
  verdict must land in seconds.
- Reading stays on-device; nothing is uploaded; no per-scan costs.
- Battery story must be truthful: event-driven idling, no continuous screen
  recording. "No background work" claims are dropped.
- Feasibility verification (accessibility-tree reading vs MediaProjection+OCR,
  Play policy, Flex ToS risk) is pending — see
  `experiments/bytlot-flex-offer-check/feasibility-background-watcher.md`.
  No build starts until the demand test resolves AND feasibility is confirmed.

## Consequences

- Landing page, main-page banner, plan hypothesis, and outreach drafts
  rewritten for background-watcher + notification positioning.
