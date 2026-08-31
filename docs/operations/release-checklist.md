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

- [x] Calculator inputs and calculated results are not sent externally.
- [x] Any `localStorage` use is limited to vehicle assumptions and target hourly profit.
- [x] No secret, account, payment, backend, analytics, or paid dependency was introduced without an approved documented decision.
- [x] Documentation, roadmap, and decision records reflect consequential changes.

## Anonymous feedback release gate (complete)

- [x] Node.js 22+ is active; `npm ci`, `npm run check:release`, Worker tests, Wrangler dry run, local D1 migration, JavaScript syntax, and Git whitespace checks pass from a clean install.
- [x] `npm run feedback:deploy:preflight` pins the reviewed account, Worker entrypoint, narrow `https://bytlot.com/api/feedback*` route pattern, origin/hostname/action values, exact production D1 name/UUID, and production Turnstile sitekey; local `example.com`/`test` mode is rejected.
- [x] Before the first secret-created Worker version, `npm run feedback:deploy:bootstrap` authenticated the pinned account and applied the remote migration; only then was `TURNSTILE_SECRET_KEY` entered through stdin outside Git, and `feedback:deploy:verify` confirmed only its binding name.
- [x] `npm run feedback:deploy` reapplied pending migrations and deployed the Worker; a failure stops the sequence, and the command does not commit, push, publish the frontend, or submit feedback.
- [x] After Worker deploy and before frontend publication, the narrow route sent exact/query variants to the handler, representative rejection paths failed closed, and `/`, an application asset, `robots.txt`, and `sitemap.xml` still returned `200` from the static site.
- [x] Unit coverage verifies that the Worker rejects unsupported methods, wrong/missing origin, query strings, non-JSON and malformed/oversized bodies, unknown fields, invalid context, invalid feedback type, and messages outside 10–2,000 characters before persistence; production smoke confirmed `405`, `404`, `403`, and `400` representative responses.
- [x] Turnstile is configured for `bytlot.com`; Siteverify runs server-side and checks success, hostname, and `feedback_submit`; expired, duplicate, forged, unavailable, and mismatched tokens fail closed.
- [x] The production secret is stored outside Git, the public production sitekey has replaced the frontend placeholder, `.dev.vars` and `.wrangler/` remain ignored, and a repository/current-tree secret scan is clean.
- [x] The shared non-identifying rate limit runs only after successful Siteverify, so forged tokens cannot exhaust its bucket; no IP, fingerprint, raw user agent, location, or other identifier is stored, and D1 writes use bound parameters plus server-controlled product, timestamp, ID, and status.
- [x] An inspected browser request contains only feedback type, message, Turnstile token, `/`, calculator mode, application version, and coarse viewport category—never calculator values, earnings, vehicle assumptions, localStorage contents, referrer, query string, or exact viewport.
- [x] Keyboard open, modal focus containment, Escape/Close, focus return, invalid-field focus, live verification/error/success announcements, draft retention after recoverable failure, and success reset pass independently.
- [x] 320/390/800/801/1440 px checks have no horizontal overflow, the Turnstile widget fits, and existing Shift Profit and Offer Check calculations remain unchanged.
- [x] The reviewed static frontend is published only after the Worker gate passes; production then performs one controlled anonymous feedback submission, D1 stores exactly one expected row, authenticated Wrangler retrieves it by monotonic ID, and no raw message is committed to the repository.
- [x] Production error paths return generic no-store responses without messages, tokens, secrets, D1 details, or Siteverify internals; logs contain no feedback content or identifying request data added by the application.

## Verification record

Completed locally on 2026-08-28. `npm run check` passed the formula suite and static-site validator; JavaScript syntax and Git whitespace checks passed. Browser smoke tests covered 320 px and 390 px mobile viewports plus a 1440 px desktop viewport, both calculator workflows, exact-cent rounding, keyboard tab behavior, labels, focus, local asset loading, horizontal overflow, and console errors.

Production verification completed on 2026-08-28 for application release commit `3016f6d`. GitHub Pages reported the commit as built. `https://bytlot.com/` returned `200`, HTTP redirected to HTTPS, required static assets returned `200`, both gasoline and EV calculator workflows produced expected results on a 390 px viewport, keyboard tabs worked, and the browser console was clean. Cloudflare edge delivery was observed; Cloudflare configuration and Search Console were not directly inspected.

Brand identity and EV field-alignment follow-up verified on 2026-08-28 for application commit `1c21c18` and CDN cache-busting commit `ada1738`. GitHub Pages reported `ada1738` as built. Production loaded the SVG mark, versioned stylesheet, ICO/PNG fallbacks, web manifest, and maskable icon successfully; HTTP redirected to HTTPS and required assets returned `200`. The charging-loss and electricity inputs aligned with a `0 px` top delta on desktop, the brand target measured `44 px`, and 320/390/800/1440 px checks had no horizontal overflow. Production EV shift and offer workflows returned the expected `$69.33` and `$24.69/hr` results, respectively, and the browser console was clean. The initial post-deploy check exposed stale edge-cached CSS; versioned asset URLs resolved it before release sign-off.

Calculator rhythm follow-up verified on 2026-08-28 for application commit `a15488f`. GitHub Pages reported the commit as built, and the versioned production stylesheet returned `200`. Both workflows measured a `22 px` field-group-to-action gap and full-width final field; at 1440 px their grid and form heights matched exactly. Checks at 320/390/800/801/1440 px had no horizontal overflow, the EV input top delta remained `0 px`, and production shift/offer workflows returned the expected `$69.33` and `$24.69/hr` results. HTTP redirected to HTTPS and the browser console was clean.

SEO stewardship and search-signal release verified on 2026-08-31 for application commit `1dccad8`. `npm run check` passed all 17 calculation tests and the strengthened site validator; JavaScript syntax, XML parsing, Git whitespace, and current-tree former-entity scans passed. Production served the new title, H1, crawlable methodology, social metadata, and `WebSite` plus free `WebApplication` JSON-LD. Schema.org Validator reported `0 errors` and `0 warnings`. The canonical page, `robots.txt`, sitemap, stylesheet, application module, and SVG mark returned `200`; HTTP and `www` redirected directly to the HTTPS non-www canonical with `301`. Browser checks at 320/390/800/801/1440 px found no horizontal overflow, both EV workflows returned the expected `$74.50` and `$24.69/hr` results, and the console was clean. No analytics or external runtime dependency was introduced. Search Console ownership, index status, query evidence, and field Core Web Vitals remain owner follow-ups; laboratory Core Web Vitals were not measured because the required performance tracer was unavailable.

PageSpeed follow-up verified on 2026-08-31 for application commit `d59a837`. The supplied mobile report baseline was Performance `99`, Accessibility `100`, Best Practices `100`, and SEO `100`, with FCP `1.5 s`, LCP `1.6 s`, TBT `0 ms`, CLS `0.008`, and Speed Index `2.4 s`; it contained no field data. `npm run check`, JavaScript syntax checks, and Git whitespace checks passed after adding an exact versioned calculation-module preload, versioned entry-module and SVG URLs, accurate input-privacy copy, and validator guards. Production loaded one copy of each application module, returned the expected `$74.50` and `$24.69/hr` EV results, had no horizontal overflow at 320/390/800/801/1440 px, switched layout correctly across the 800/801 px breakpoint, and produced no console warnings or errors. The small external stylesheet was intentionally retained because the reported `160 ms` opportunity did not outweigh duplication and layout-risk costs. Cloudflare's injected Web Analytics RUM beacon and four-hour browser TTL remain explicit owner-side configuration follow-ups requiring an authenticated Cloudflare session; neither is represented as resolved here, and no post-release PageSpeed score is claimed.

Anonymous-feedback production release verified on 2026-08-31 for application commit `94f30b4`. The account-pinned D1 database and hostname-restricted Turnstile widget were created, migration `0001_create_feedback.sql` was applied before the secret-created Worker version, `TURNSTILE_SECRET_KEY` was bound outside Git, and the guarded Worker deployment completed on `https://bytlot.com/api/feedback*`. GitHub Pages run `33443458794` completed successfully and production served the versioned feedback assets plus real public sitekey. The exact API returned `405` for `GET`, a query variant returned `404`, a wrong-origin `POST` returned `403`, malformed JSON returned `400`, and normal `/`, application asset, `robots.txt`, and `sitemap.xml` requests returned `200`; error responses were generic and `no-store`.

The live browser confirmed that Turnstile was absent from initial page load, loaded only after the explicit Feedback action, completed verification, focused the dialog heading, focused the first invalid field, announced success, and returned focus to the opener after Close/Done. One controlled non-sensitive submission was accepted and authenticated Wrangler retrieved exactly its allowlisted D1 row without writing raw content to Git. That controlled row was then removed with an exact ID/type/message predicate and the deletion count was verified; unrelated row `2` remained untouched and pending review. Production at 390 px and 1440 px had no horizontal overflow, the mobile bottom sheet and Turnstile fit, both Shift Profit and Offer Check returned numeric results, and the browser console had no warnings or errors. The full 320/390/800/801/1440 px matrix and the remaining focus/error-state cases had already passed the isolated local release gate. A clean offline install reported zero vulnerabilities, `npm run check:release` passed all 89 tests plus site validation and Wrangler dry run, JavaScript syntax and Git whitespace checks passed, and independent post-fix review found no remaining P0–P2 issue.

Local feedback integration verified on 2026-08-31 with the isolated `worker/wrangler.local.jsonc` path. The migration was current; the browser lazy-loaded Feedback and Turnstile only after the footer action; a controlled browser submission reached the local Worker, returned exact `201 application/json` with `{ "ok": true }`, and produced one expected D1 row with only allowlisted context. Direct Worker/D1 smoke submissions also passed. The three locally created smoke rows were then deleted from simulated D1. This evidence does not satisfy any production checkbox above.
