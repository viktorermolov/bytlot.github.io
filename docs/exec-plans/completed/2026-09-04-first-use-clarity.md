# Driver Profit — first-use clarity

Started, implemented and published: 2026-09-04. Status: production verified.

## Scope

Implement the first bounded release from the [growth roadmap](../../roadmap/2026-09-04-growth-roadmap.md): quicker mobile entry, equally clear shift/offer positioning, accurate starter/saved/unsaved vehicle-assumption labels, static worked examples for both workflows, and clearer hierarchy for the existing offer-versus-target verdict.

Keep the calculation formulas, public canonical URL, platform-neutral model, feedback payload/backend, and allowed storage boundary intact. Examples never replace or save user inputs or results. No new service, runtime dependency, fee, or analytics is introduced.

## Work and ownership

- Root: integrate HTML/CSS/application changes, static examples, documentation, local browser verification.
- Terra settings implementation: scoped persistence helper and meaningful malformed/blocked-storage tests.
- Terra design steward: mobile, hierarchy, accessibility and brand review.
- Terra SEO specialist: visible-copy and example review; discovery evidence limits.
- Sol: final independent challenge of correctness, scope and privacy.

## Gates

- Automated calculation/settings/example checks; `npm run check` and `git diff --check`.
- Browser widths 320/390/800/801/1440 px; both workflows and expanded settings; no horizontal overflow.
- Keyboard tabs, example links, readable positive/below-target/negative/stale results.
- Verify examples do not change entered inputs or saved settings; only permitted settings survive reload.
- Validate one H1, canonical and truthful structured data; refresh substantive sitemap date and changed asset versions.
- Preserve the pre-existing feedback review-state/snapshot changes; do not include raw feedback in this work.
- Record the actual implementation/review outcome and distinguish local verification from publication.

## Evidence dependencies

No callable Search Console connector is available, but the owner signed into Search Console in the browser. The resulting [dated snapshot](../../analytics/snapshots/2026-09-04-search-console.md) confirms existing homepage indexation, the canonical and successful sitemap; the available performance period has zero impressions/clicks. No additional SEO page is included in this implementation. One homepage recrawl request was accepted after publication.

## Progress

- Read brand, SEO, roadmap and current implementation; design/SEO reviewers assigned.
- Selected static examples with links rather than a demo mode, preventing changes to visitor inputs, saved assumptions or live result state.
- Implemented compact mobile entry, short saved/starter/unsaved vehicle status, robust allowlisted legacy-settings restoration, static examples, first-input focus on example return, and an existing-target verdict badge that hides when stale.
- Preserved all formulas, feedback source/payload/Worker and the storage key. Added one small first-party settings module; its calculation import shares the existing versioned module URL. No package/dependency changes.
- Automated verification: `npm run check` passed 95 tests, site validation, Worker syntax and a dry-run build. JS syntax and whitespace checks passed. Tests cover malformed/partial/blocked settings and static example arithmetic.
- Browser verification: 320/390/800/801/1440 px, collapsed and expanded EV assumptions, no horizontal overflow. At 320×700, the first numeric field begins at 535 px; at 390 px width, 506 px. These are viewport-specific observations, not a universal usability claim. The desktop layout changes at 800/801 px as intended; new links/tabs retain 44 px minimum targets.
- Gas shift example returned $84.80. Gas offer returned $19.09/hr and the expected $26.18 minimum at a $22/hr target. EV offer returned $24.69/hr with a $30.32 minimum at a $25/hr target. Negative and stale results and keyboard mode navigation passed.
- Example navigation preserved entered values/current same-mode result and returned focus to the first field. Real keyboard input changed the vehicle label to unsaved, blur saved it, and reload restored it. Reverting a custom saved value to a starter remained unsaved until saved. Shift/offer payouts did not survive reload. Malformed/unavailable storage behavior is covered by unit tests, not a claim of browser permission testing.
- Static examples and result states were visually inspected on mobile and desktop; browser console showed no warnings/errors. SEO-specialist, design-steward and Sol code reviews found no remaining blocking issue after corrections.

## Publication and production verification

The owner explicitly authorized production publication after the first-stage checks passed. Application commit `8277aa605545a226289f7efd49fb936791d9cca2` was pushed to `master`; GitHub Pages run `33913694077` succeeded. `npm run check:release` passed all 95 tests, site validation, Worker dry run and production configuration validation. The staged secret-pattern scan and final independent review passed. Pre-existing feedback review files were excluded.

Production served the new copy/examples and exact release CSS, application/settings/calculation modules, robots and sitemap with `200`. HTTP and HTTPS `www` returned `301` to the canonical HTTPS homepage. The only HTML difference from the committed source was the previously documented Cloudflare RUM injection; no edge setting or Worker was changed.

With the existing saved EV assumptions, a $120 gross / 5-hour / 80-mile shift returned $103.00 profit; a $30 / 60-minute / 25-mile offer returned $24.69/hr and a $30.32 minimum for the existing $25/hr target. A $40 offer showed Meets your target; editing hid the stale verdict. Production checks at 320/390/800/801/1440 px, with collapsed and expanded settings, had no horizontal overflow. Example navigation preserved entered data/results and focused the first field; keyboard mode navigation passed. Reload restored vehicle assumptions/target without preserving payouts. Console warnings/errors were absent. Vehicle settings were not changed during the production smoke test.

Search Console accepted one request for `https://bytlot.com/` after publication and showed **Indexing requested**, with the URL added to its priority crawl queue. This confirms the request, not completion of the new crawl or a ranking change. See the [deployment record](../../operations/deployments.md) and [release checklist](../../operations/release-checklist.md).
