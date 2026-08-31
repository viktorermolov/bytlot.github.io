# BytLot operating map

BytLot helps people **know the real number** behind a headline price, rate, or payout. The current product is Driver Profit; its calculation engine and language must remain platform-neutral for delivery and gig work.

Start here, then use the detailed documents below rather than relying on chat history:

- Product intent and boundaries: [`docs/product/`](docs/product/)
- Current product sequence: [`docs/roadmap/`](docs/roadmap/); completed work: [`docs/exec-plans/completed/`](docs/exec-plans/completed/); future multi-session work starts in [`docs/exec-plans/active/`](docs/exec-plans/active/)
- Architecture and operations: [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`docs/operations/`](docs/operations/)
- Brand system and visual stewardship: [`docs/design/brand.md`](docs/design/brand.md)
- Search discovery and SEO stewardship: [`docs/seo/README.md`](docs/seo/README.md)
- Measurement and evidence: [`docs/analytics/`](docs/analytics/)
- Consequential choices: [`docs/decisions/`](docs/decisions/)

## Operating rules

- Keep the MVP vanilla HTML, CSS, and JavaScript, deployed as a static site. Calculations stay in the browser unless a concrete requirement justifies a change.
- Preserve low recurring cost and dependency discipline. Explain any paid dependency or meaningful architecture change to the owner before implementation.
- Calculation logic is product-critical: keep it deterministic, transparent, separated from presentation where practical, and covered by automated tests. A consequential formula change needs independent review.
- Prefer local processing. Send no user data. Browser `localStorage`, if used, is limited to vehicle assumptions and the user’s target hourly profit; do not store accounts, identities, or calculation history.
- Treat measured usage, search, and revenue data as unavailable until a connected source or dated repository snapshot supplies it. Never invent metrics.
- Before release, run relevant calculation tests, perform mobile and accessibility checks, confirm no privacy regression, and use the release checklist.
- Before changing visible UI, read the brand and design-stewardship guide. Assign a design-steward reviewer for meaningful visual changes; the site owner remains responsible for implementation and release.
- Before changing search intent, crawl controls, canonical signals, metadata, headings, structured data, or crawlable SEO content, read the SEO-stewardship guide and assign an SEO-specialist reviewer. Ground priorities in primary guidance and measured evidence; never promise rankings or invent search metrics.
- Use `npm run check` as the minimum local release gate. The production site is rooted at `https://bytlot.com/`; root-absolute asset paths are intentional for the custom-domain/GitHub Pages root.

## Roles and routing

Use the smallest appropriate team: Sol for consequential judgment and final challenge, Terra for normal professional implementation and review, Luna for routine discovery, maintenance, and QA. Add an explicit design-steward role for meaningful interface work: it reviews hierarchy, responsive behavior, accessibility, iconography, and adherence to the documented brand system. Add an SEO-specialist role for search-facing work: it reviews intent, crawlability, indexability, canonical signals, metadata, structured data, content quality, and evidence without taking over implementation or release. Persistent state belongs in this repository; agents are not assumed to persist between sessions, so accepted design decisions must be recorded in `docs/design/brand.md` and SEO decisions in `docs/seo/README.md`.
