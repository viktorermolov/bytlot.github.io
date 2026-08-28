# Release checklist

## Product and calculations

- [x] The release matches the execution plan and excludes stated non-goals.
- [x] Inputs, assumptions, estimates, and calculated outputs are clearly distinguished.
- [x] Relevant automated calculation tests pass.
- [x] A consequential formula change has independent calculation review.
- [x] Results avoid false precision and unsupported universal recommendations.

## Quality

- [x] Mobile numeric entry, layout, and results are checked.
- [x] Keyboard flow, labels, focus visibility, contrast, and validation are checked.
- [x] Logo, favicon, visual tokens, and components follow the brand and design-stewardship guide.
- [x] Permanent URL, title, description, headings, and crawlable content are verified where applicable.
- [x] Static deployment behavior and broken links are checked.

## Privacy and operations

- [x] No user input is sent externally.
- [x] Any `localStorage` use is limited to vehicle assumptions and target hourly profit.
- [x] No secret, account, payment, backend, analytics, or paid dependency was introduced without an approved documented decision.
- [x] Documentation, roadmap, and decision records reflect consequential changes.

## Verification record

Completed locally on 2026-08-28. `npm run check` passed the formula suite and static-site validator; JavaScript syntax and Git whitespace checks passed. Browser smoke tests covered 320 px and 390 px mobile viewports plus a 1440 px desktop viewport, both calculator workflows, exact-cent rounding, keyboard tab behavior, labels, focus, local asset loading, horizontal overflow, and console errors.

Production verification completed on 2026-08-28 for application release commit `3016f6d`. GitHub Pages reported the commit as built. `https://bytlot.com/` returned `200`, HTTP redirected to HTTPS, required static assets returned `200`, both gasoline and EV calculator workflows produced expected results on a 390 px viewport, keyboard tabs worked, and the browser console was clean. Cloudflare edge delivery was observed; Cloudflare configuration and Search Console were not directly inspected.

Brand identity and EV field-alignment follow-up verified on 2026-08-28 for application commit `1c21c18` and CDN cache-busting commit `ada1738`. GitHub Pages reported `ada1738` as built. Production loaded the SVG mark, versioned stylesheet, ICO/PNG fallbacks, web manifest, and maskable icon successfully; HTTP redirected to HTTPS and required assets returned `200`. The charging-loss and electricity inputs aligned with a `0 px` top delta on desktop, the brand target measured `44 px`, and 320/390/800/1440 px checks had no horizontal overflow. Production EV shift and offer workflows returned the expected `$69.33` and `$24.69/hr` results, respectively, and the browser console was clean. The initial post-deploy check exposed stale edge-cached CSS; versioned asset URLs resolved it before release sign-off.

Calculator rhythm follow-up verified on 2026-08-28 for application commit `a15488f`. GitHub Pages reported the commit as built, and the versioned production stylesheet returned `200`. Both workflows measured a `22 px` field-group-to-action gap and full-width final field; at 1440 px their grid and form heights matched exactly. Checks at 320/390/800/801/1440 px had no horizontal overflow, the EV input top delta remained `0 px`, and production shift/offer workflows returned the expected `$69.33` and `$24.69/hr` results. HTTP redirected to HTTPS and the browser console was clean.
