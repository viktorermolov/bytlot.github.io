# Google Search Console baseline — 2026-09-04

Source: owner-authorized browser session in Google Search Console, inspected on 2026-09-04. Property: `sc-domain:bytlot.com`. No connector/API dataset or export was used. No account identifiers or credentials are recorded here.

## Performance

- Search type: Web.
- Selected time filter: 3 months.
- Actual date range exposed by the chart: **2026-08-30 through 2026-09-02**; do not describe this as three months of observations or coverage since the site's launch.
- Total clicks: **0**.
- Total impressions: **0**.
- Query table: **No data**.
- UI displayed CTR `0%` and average position `0`; with no impressions these are not meaningful rate/rank observations. No position is established.
- UI freshness label at inspection: `Last update: 7.5 hours ago`; the label is relative and no exact processing timestamp was supplied.

## Sitemap

- Submitted sitemap: `https://bytlot.com/sitemap.xml`.
- Submitted: **2026-08-31**.
- Last read: **2026-09-03**.
- Status: **Success**.
- Discovered pages: **1**; discovered videos: **0**.

## Homepage URL Inspection

- Inspected URL: `https://bytlot.com/`.
- Status: **URL is on Google / Page is indexed**.
- Sitemap discovery includes the canonical sitemap above.
- Last crawl shown: **Aug 31, 2026, 9:53:47 AM**. Time zone was not displayed; do not reinterpret it as UTC.
- Crawled as: **Googlebot smartphone**.
- Crawl allowed: **Yes**.
- Page fetch: **Successful**.
- Indexing allowed: **Yes**.
- User-declared canonical: `https://bytlot.com/`.
- Google-selected canonical: **Inspected URL**, i.e. the same canonical homepage.
- HTTPS: **Page is served over HTTPS**.

The overview's aggregate Indexing section was still processing data, and no experience dataset was available. That processing message does not contradict the completed homepage-specific inspection. A new live test or indexing request was not necessary for this baseline; the first-use implementation was still local and had not been published.

## Interpretation and next comparison

Google has discovered and indexed the canonical homepage. The observed search report contains no impressions/clicks yet; it does not prove future lack of demand, a ranking penalty, or a calculator usability problem. No product-event, retention, Cloudflare traffic or billing evidence was supplied.

Proceed with the bounded first-use improvement. After publication, inspect the new public version and request recrawl once if appropriate. Compare later available periods with this actual date range; use full 28-day windows only when enough history exists. Keep content expansion to the roadmap's one useful pilot until query or user-need evidence supports more pages.

## Post-publication action — 2026-09-04

After application commit `8277aa6` was published and production verified, one indexing request for `https://bytlot.com/` completed its live eligibility check. Search Console displayed **Indexing requested** and confirmed addition to a priority crawl queue. No duplicate request or sitemap resubmission was made. This is operational evidence that Google accepted the request; the baseline metrics and prior crawl timestamp above remain unchanged observations, not post-release search results.
