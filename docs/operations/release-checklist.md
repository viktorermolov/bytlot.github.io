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
