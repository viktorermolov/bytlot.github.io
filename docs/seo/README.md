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

## Baseline — 2026-08-31

The product is one canonical static page. It has crawlable product and FAQ content, a self-canonical URL, permissive `robots.txt`, a one-URL sitemap, and only local runtime assets in application source. The application does not include analytics or external scripts, but an Aug. 31 production audit observed Cloudflare injecting its external RUM beacon at the edge; this remains a control-plane cleanup item. The initial SEO pass aligned the title and H1 with the Driver Profit search intent, retained delivery-and-gig neutrality, added `WebSite` and complete free `WebApplication` structured data, retained the visible FAQ content while removing search-feature-specific FAQ structured data, and added an accurate sitemap modification date.

No Search Console or Cloudflare traffic dataset was available for this baseline. Public search-result sampling did not establish index status and is not a substitute for Search Console.
