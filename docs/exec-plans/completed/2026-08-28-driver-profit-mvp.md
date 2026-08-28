# Driver Profit MVP execution plan

- **Status:** complete
- **Completed:** 2026-08-28
- **Objective:** prepare a useful platform-neutral Driver Profit calculator for launch at approximately zero incremental infrastructure cost.

## User problem and hypothesis

Gross gig earnings and offer payouts omit vehicle cost. A transparent browser calculator can help drivers estimate real profit and compare an offer against their target hourly profit. This remains a product hypothesis; no measured usage data is currently available.

## Delivered scope

1. **What did I really earn?** Gross earnings, hours, miles, and configurable vehicle assumptions produce gross hourly earnings, estimated vehicle cost, profit, profit/hour, profit/mile, and cost/mile.
2. **Should I take this offer?** Payout, estimated time, miles, optional return/deadhead miles, vehicle assumptions, and target hourly profit produce estimated profit, real hourly profit, profit/mile, and the minimum required payout rounded up to the next cent when needed.

The implementation supports separate gasoline and EV energy assumptions, both mi/kWh and kWh/100 mi EV efficiency units, charging loss, maintenance, tires, depreciation, and other configurable per-mile costs. Formula code is pure and separated from presentation.

## Non-goals preserved

No platform-specific rules, accounts, tax advice, trip tracking, server-side history, payments, database, runtime AI, analytics instrumentation, or conventional backend were added.

## Verification

- Formula and edge-case tests pass with Node's built-in test runner.
- Consequential formulas received independent calculation review.
- Static metadata, JSON-LD, local asset references, manifest assets, and legacy-content removal pass the repository validator.
- Local browser QA covered phone and desktop layouts, both workflows, keyboard tabs, validation, exact-cent behavior, and console output.
- The release checklist is complete at [`docs/operations/release-checklist.md`](../../operations/release-checklist.md).

## Evidence, analytics, and infrastructure

Initial evidence is qualitative/product reasoning only; analytics data is unavailable in this workspace. No analytics was invented or added. Infrastructure remains static GitHub Pages behind external Cloudflare, with no expected incremental recurring cost. Application release commit `3016f6d` was published and production-smoke-tested on 2026-08-28. Cloudflare edge delivery was observed, but Cloudflare configuration and Search Console were not directly inspected.

## Follow-up

The owner should review starter assumptions with real users and supply dated usage/search evidence before the roadmap is reprioritized.
