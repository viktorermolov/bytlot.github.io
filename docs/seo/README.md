# SEO stewardship

BytLot SEO exists to help the right people discover a useful, accurate product. It does not override product boundaries, calculation integrity, privacy, or the brand system.

## SEO-specialist role

Assign an SEO specialist when work changes search intent, crawlability, indexability, canonical URLs, titles and descriptions, headings, structured data, crawlable explanatory content, internal links, `robots.txt`, or the sitemap. The specialist is a reviewer and adviser; the site-owning agent integrates, tests, commits, publishes, and records the release.

The specialist must:

1. Read the product, analytics, architecture, and brand documents before recommending changes.
2. Inspect both repository source and the production URL. Separate observed facts from recommendations and unverified control-plane state.
3. Prefer current primary guidance, especially Google Search Central and Schema.org, over generic checklists.
4. Use dated Search Console or traffic evidence when prioritizing queries, pages, or content. If the evidence is unavailable, say so and limit work to clear technical or people-first improvements.
5. Review search intent, title and heading alignment, canonical signals, crawl directives, sitemap accuracy, structured-data eligibility, visible-content parity, mobile presentation, accessibility, privacy, and production delivery.
6. Return prioritized findings and a minimal safe implementation set. Do not directly commit, publish, change DNS/CDN settings, or add tracking unless the owner explicitly expands the scope.

Agents are not assumed to persist between sessions. This document and the repository records are the durable SEO authority.

## Guardrails

- Write for people who need a transparent driver-profit estimate. Do not add keyword-stuffed, duplicated, doorway, location, or platform pages without evidence that each page serves a distinct user need.
- Keep Driver Profit platform-neutral. Platform names may clarify compatibility, but must not imply affiliation, endorsement, or platform-specific logic.
- Do not promise rankings, traffic, rich results, or indexation. Structured data must describe visible, truthful content and does not guarantee a search feature.
- Do not invent search volume, rankings, impressions, clicks, CTR, conversions, or Core Web Vitals. Store supplied measurements as dated source-labeled snapshots under `docs/analytics/snapshots/`.
- Do not add analytics, ad technology, consent tooling, a backend, paid SEO services, or external runtime dependencies without an approved product and privacy decision.
- Do not invent or imply a legal entity unless the owner supplies a current, documented legal basis.
- Use one canonical production origin: `https://bytlot.com/`. Root-absolute asset paths are intentional.
- Add sitemap `lastmod` only when it is the accurate date of a substantive page update, not every documentation or deployment change.

## Release gate

For an SEO-affecting release:

- Run `npm run check`, JavaScript syntax checks where applicable, and `git diff --check`.
- Confirm one descriptive H1, a concise intent-aligned title, an accurate unique description, a self-canonical URL, and matching social metadata.
- Parse JSON-LD and verify every claim matches visible page content. Validate required properties against the current feature documentation.
- Confirm `robots.txt` permits the intended crawl, references the canonical sitemap, and the sitemap contains only canonical absolute URLs with honest dates.
- Check the production canonical URL and required assets over HTTPS, mobile and desktop layout, calculator behavior, and browser console.
- Record the production commit and verification in `docs/operations/deployments.md` and the release checklist.

## Measurement follow-up

Repository and public-page checks cannot prove Google indexation, the selected canonical, query performance, or ranking. The owner should establish or verify the `https://bytlot.com/` Search Console property, submit `https://bytlot.com/sitemap.xml`, inspect the canonical homepage, and request recrawling after a substantive release. Future prioritization should use impressions, clicks, CTR, top queries, top pages, index coverage, and the same-period Cloudflare traffic requested in `docs/analytics/metrics.md`.

## Primary references

- [Google Search Central: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google Search Central: snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Google Search Central: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Search Central: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google Search Central: software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Google Search Central: site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google Search Central: people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

## Planning review — 2026-09-04

The [growth roadmap](../roadmap/2026-09-04-growth-roadmap.md) and [competitor analysis](competition-2026-09-04.md) record a reviewed planning direction: retain Driver Profit and its canonical homepage; establish Search Console evidence; strengthen reproducible examples and assumptions; start with one practical vehicle-cost content pilot after recording the available baseline. A second page about offer evaluation with return miles/time requires query evidence or a documented user need. No public headings, metadata, crawl controls, URLs, or structured data were changed by this planning review.

Competitor pages and a dated Google sample establish available alternatives, not their traffic, stable rankings, or BytLot demand. Free access and privacy are useful but are not proven unique differentiators. Existing Google guidance also applies to AI search features; no special AI file or markup is required. Future page expansion must update the currently single-page site validator and preserve the release gates above.

Search metrics and account billing remain unavailable for this review. Any content pilot before sufficient observations must explicitly retain that limitation; do not turn the proposed query themes into measured keyword priorities.

## Baseline — 2026-08-31

The product is one canonical static page. It has crawlable product and FAQ content, a self-canonical URL, permissive `robots.txt`, and a one-URL sitemap. The primary calculator runtime uses local assets and includes no application analytics. The optional feedback flow lazy-loads Cloudflare Turnstile only after a visitor explicitly opens **Feedback**, so neither its module nor the external verification script is part of the primary page load. Separately, an Aug. 31 production audit observed Cloudflare injecting its external RUM beacon at the edge; this remains a control-plane cleanup item. The initial SEO pass aligned the title and H1 with the Driver Profit search intent, retained delivery-and-gig neutrality, added `WebSite` and complete free `WebApplication` structured data, retained the visible FAQ content while removing search-feature-specific FAQ structured data, and added an accurate sitemap modification date.

No Search Console or Cloudflare traffic dataset was available for this baseline. Public search-result sampling did not establish index status and is not a substitute for Search Console.

## First-use implementation and Search Console — 2026-09-04

The first-use implementation adds a concise two-workflow introduction and two static, explicitly illustrative worked examples on the existing homepage. H1, title, description, canonical, social metadata and structured data retain their existing intent. The one-URL sitemap has a substantive `2026-09-04` modification date. Example arithmetic is checked against the existing calculation engine. SEO and design-steward reviews passed; implementation and production verification are recorded in the [completed plan](../exec-plans/completed/2026-09-04-first-use-clarity.md). Application commit `8277aa6` was published through successful GitHub Pages run `33913694077`; the public canonical, examples, versioned assets, robots and sitemap were verified. Search Console accepted one indexing request after publication and confirmed addition to the priority crawl queue; this is not evidence of a completed recrawl or ranking impact.

An owner-authorized browser session supplied the [Search Console baseline](../analytics/snapshots/2026-09-04-search-console.md). The homepage is indexed, crawl/indexing are allowed, page fetch succeeded, and Google's selected canonical matches `https://bytlot.com/`. The sitemap was submitted Aug. 31 and last read Sept. 3 with Success and one discovered page. The available Aug. 30–Sept. 2 performance chart has zero impressions and clicks; no meaningful average position is established. The aggregate Indexing overview is still processing. These observations supersede the earlier absence of index evidence, but do not establish query demand, product use or ranking impact.
