# Instrumentation

## MVP status

No analytics instrumentation is included initially. Calculations are local and no user data is sent. This keeps the MVP low-cost and privacy-conscious while product behavior is not yet required for a defined decision.

## Future decision gate

Before adding instrumentation, document:

1. the decision it will enable;
2. why Cloudflare traffic, Search Console, repository data, or owner-provided data cannot answer it;
3. the smallest event set needed;
4. cost and privacy implications; and
5. the owner’s approval if it introduces a service or recurring cost.

Potential events, only if justified, are `calculator_started`, `calculator_completed`, `offer_calculated`, `assumptions_changed`, `second_calculation`, `result_shared`, and `return_visit`. Do not add them by default. Avoid identifiers, sensitive inputs, and calculation payloads unless a documented product need and privacy review establish otherwise.
