# Instrumentation

## Application status

No analytics instrumentation is included in the application source. Calculations are local, calculator inputs are not transmitted by the application, and permitted browser storage remains limited to vehicle assumptions and the target hourly profit.

## Observed edge instrumentation

An Aug. 31, 2026 production audit found Cloudflare automatically injecting its Web Analytics/RUM beacon. It loads `static.cloudflareinsights.com/beacon.min.js` and sends page-performance timing to the first-party `/cdn-cgi/rum` endpoint. The repository does not add this script, and the connected workspace cannot inspect or change the Cloudflare control plane.

This beacon does not receive calculator inputs from the application, but it is still client-side telemetry and adds two requests. To preserve the intended no-client-analytics posture, disable automatic RUM in Cloudflare and verify that both requests disappear. If the owner intentionally keeps it, record that decision and update the privacy language before treating analytics as approved.

## Future decision gate

Before adding instrumentation, document:

1. the decision it will enable;
2. why Cloudflare traffic, Search Console, repository data, or owner-provided data cannot answer it;
3. the smallest event set needed;
4. cost and privacy implications; and
5. the owner’s approval if it introduces a service or recurring cost.

Potential events, only if justified, are `calculator_started`, `calculator_completed`, `offer_calculated`, `assumptions_changed`, `second_calculation`, `result_shared`, and `return_visit`. Do not add them by default. Avoid identifiers, sensitive inputs, and calculation payloads unless a documented product need and privacy review establish otherwise.
