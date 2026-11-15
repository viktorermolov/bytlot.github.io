# Infrastructure status

## Current repository

Driver Profit is a static GitHub Pages site at `https://bytlot.com/`, with Cloudflare as the external edge/domain layer. Calculations run locally in the browser; contact uses email via a `mailto:` link. There is no current Worker source, feedback endpoint integration, Wrangler dependency, or feedback deployment/retrieval command.

Use Node.js 22+ and `npm run check` for tests and static validation. Use Python 3 through `npm run serve` to preview the repository root. No npm packages are required.

## External resources: not verified by this cleanup

Earlier releases provisioned a feedback Worker route, D1 database, and Turnstile widget. Removal of their repository code does not establish whether those resources still exist, receive traffic, or incur usage. The November 2026 source cleanup does not inspect, delete, reconfigure, or deploy any Cloudflare resource. Any future decommissioning needs a separate review of live resources and retained feedback before action.

An August 31, 2026 audit recorded an injected Cloudflare RUM beacon. That is historical evidence, not a fresh assertion of present configuration; see [instrumentation](../analytics/instrumentation.md).

## Historical records

- [Deployments](deployments.md)
- [Original feedback decision](../decisions/2026-08-31-anonymous-feedback-pipeline.md)
- [Completed feedback implementation](../exec-plans/completed/2026-08-31-user-feedback.md)

Old feedback commands in those records are not supported by the current checkout. Do not restore tooling or change infrastructure merely to follow a historical runbook.
