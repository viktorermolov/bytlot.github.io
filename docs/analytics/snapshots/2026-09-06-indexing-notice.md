# Search Console redirect notice review — 2026-09-06

Sources: owner-supplied PDF notification dated September 6, 2026; the previously authorized signed-in Search Console browser session for `sc-domain:bytlot.com`; direct production HTTP requests on September 6. The email and account identifiers are not copied into the repository.

## Notification and affected URLs

The notification reports **Page with redirect**. The Page indexing report shows one indexed page and three non-indexed URLs, all under this single reason. Its freshness label is September 3, 2026; the detail panel separately labels first detection as September 4. Preserve these displayed dates without inferring a common processing timestamp.

All three examples show an August 31, 2026 crawl:

| Reported URL | Observed current response | Destination |
| --- | --- | --- |
| `http://bytlot.com/` | `301` | `https://bytlot.com/` |
| `http://www.bytlot.com/` | `301` | `https://www.bytlot.com/`, then `301` to `https://bytlot.com/` |
| `https://www.bytlot.com/` | `301` | `https://bytlot.com/` |

## Canonical homepage

- Inspected URL: `https://bytlot.com/`.
- Search Console: **URL is on Google / Page is indexed**.
- Last crawl: **September 4, 2026, 12:59:17 PM**, as displayed; no timezone label was supplied.
- Crawled as: Googlebot smartphone.
- Crawl allowed: Yes. Page fetch: Successful. Indexing allowed: Yes.
- User-declared canonical: `https://bytlot.com/`; Google-selected canonical: **Inspected URL**.
- Discovery includes `https://bytlot.com/sitemap.xml`.
- Direct production request: `200`, self-canonical, no robots meta or `X-Robots-Tag` exclusion observed, September 4 release asset marker present.
- `robots.txt` allows crawling and references the canonical sitemap. The sitemap contains only `https://bytlot.com/`, with the substantive `2026-09-04` lastmod.

## Decision

No corrective site or Cloudflare change is needed for this notice. The excluded URLs are intentional variants of the indexed canonical homepage. Google's [Page indexing documentation](https://support.google.com/webmasters/answer/7440203#page_with_redirect) explains that redirected non-canonical URLs are excluded; this reason is distinct from a redirect error. Google's [redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects) treats permanent redirects as canonicalization signals.

Do not remove the redirects to make these duplicates indexable. No Validate Fix action, repeat indexing request or sitemap resubmission was performed. The HTTP www route uses two redirects but terminates successfully, with no observed loop; it does not explain an indexing failure of the canonical homepage. The accepted [September 4 indexing request](2026-09-04-search-console.md) is now followed by a more recent recorded crawl, but causation and exact indexed content were not inspected.

This review establishes the notice's affected URLs and current canonical index status. It supplies no new performance, ranking, conversion or traffic measurement.

## Follow-up requested by owner — September 6, 2026

The refreshed Page indexing report still shows one indexed page and the same three redirect variants, with a September 3 data-freshness label. A validation cycle was already active when the report was refreshed: **Started: September 6**, **Pending: 3**, **Failed: 0**. This follow-up did not start or restart validation. Pending is not a completed validation result.

The canonical homepage's refreshed Google Index inspection still says **URL is on Google / Page is indexed**. A new live test completed at **September 6, 2026, 3:45:41 PM**, as displayed, using **Google Inspection Tool smartphone**. It returned **URL is available to Google / Page can be indexed**, with crawl allowed, successful fetch, indexing allowed and the correct declared canonical `https://bytlot.com/`. The live test does not determine Google's selected canonical or itself add a page to the index; its availability result is separate from the existing Google Index status.

The Sitemaps report remains **Success**, with one discovered page, submission August 31 and last read September 3. Direct HTTP checks again found `200` for the canonical homepage and the same intentional `301` routes documented above.

No technical indexing defect requiring a site change was found. Preserve the redirects: their exclusion can remain in the report, and validating them does not make them appropriate index targets. No site, Cloudflare, robots, sitemap or canonical change, repeat indexing request, or validation restart was performed. Google's [validation guidance](https://support.google.com/webmasters/answer/7440203?hl=en) advises waiting for an active cycle to finish before starting another; this record does not promise a Passed outcome for intentionally retained redirects.
