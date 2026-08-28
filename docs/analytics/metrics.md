# Metrics and evidence

No product analytics instrumentation is active initially. There is no Cloudflare or Search Console connector available to this workspace. A GitHub connector is available, but it does not supply product or search behavior metrics.

## What can answer which question

| Question | Needed evidence | Current status |
| --- | --- | --- |
| Is the site discovered? | Cloudflare traffic and/or Search Console data | Data unavailable in workspace |
| Do people use Driver Profit? | Calculator starts and completions | Data unavailable; no event tracking |
| Which workflow is more useful? | Workflow-specific completion/repeat signals | Data unavailable |
| Should priority or monetization change? | Relevant measured usage plus user/market evidence | Insufficient data until supplied |

## Owner data-request process

Request only the data needed for a specific decision and name the period. For an initial Driver Profit review, ask for Cloudflare unique visitors, page views, top URLs, and referrers; and Search Console impressions, clicks, CTR, top queries, and top pages for the same period. Screenshots are acceptable; request a CSV only when it materially improves analysis.

Store a dated, source-labeled summary in `docs/analytics/snapshots/` when the owner provides meaningful data. Include definitions, period, values, limitations, unusual events, and comparison basis. Never store secrets or manufacture values.
