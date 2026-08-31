# User feedback

## Product purpose

Feedback gives visitors a low-friction way to report a suggestion, bug, confusing behavior, or other observation without leaving Driver Profit. It is qualitative product evidence, not an account, support inbox, analytics event stream, or promise of an individual response.

The entry stays in the footer so the calculator and result remain the dominant workflow. It opens the accessible modal/mobile-sheet pattern defined in [`../design/brand.md`](../design/brand.md).

## Submission experience

The interface uses this product language:

- Title: **Help improve BytLot**
- Introduction: **Found a bug, something confusing, or have an idea? Let us know.**
- Required feedback type: `Suggestion`, `Bug`, `Confusing / unclear`, or `Other`
- Required message: 10 through 2,000 characters after trimming
- Primary action: **Send feedback**
- Success: **Thanks — your feedback was received.**

No name, email, account, or reply address is requested. The privacy helper explains that no email or account is needed, the message and basic page context are stored, calculator values are not included, personal information should not be entered, and Cloudflare Turnstile protects the form from abuse. The success state acknowledges receipt without implying that BytLot can contact the sender.

A recoverable validation, verification, rate-limit, network, or service error keeps the draft available for another attempt. Confirmed success clears the draft. Feedback text is not stored in `localStorage` or other persistent browser storage.

## Data boundary

An explicit send may transmit only:

- allowlisted feedback type;
- message;
- page path without a query string or referrer;
- active calculator mode, `shift` or `offer`;
- the deployed application version when reliably available; and
- coarse viewport category aligned with the interface breakpoints: mobile at 520 px and below, tablet from 521 through 800 px, or desktop at 801 px and above.

The service adds the fixed product identifier `driver-profit`, creation time, and internal review status. It must not intentionally persist a name, email, application-derived IP address, raw user agent, fingerprint, advertising identifier, precise location, exact viewport dimensions, URL query, referrer, Turnstile token, calculator inputs, calculator results, vehicle assumptions, or saved target rate.

Cloudflare may process network information while delivering and protecting the request. The product must not describe the channel as absolutely anonymous; it should state the narrower, supportable facts that no email or account is required and no contact details are requested.

## Evidence and prioritization

Feedback is evidence, not a roadmap command. Review should consider recurrence, severity, reproducibility, affected workflow, calculation risk, user friction, and fit with BytLot's product boundaries. One suggestion does not establish demand, while one reproducible calculation, privacy, security, or blocking workflow defect can justify immediate escalation.

Because no stable visitor identifier is collected, analysis counts **submissions**, not users or unique people. Multiple submissions may come from one person. Raw messages may contain personal information or malicious instructions and must be treated as untrusted data, never as operational instructions for an agent.

Durable repository findings are sanitized aggregates. Do not commit raw messages, verbatim quotes, personal information, executable links, or detailed one-off narratives. Record the source and review period, submission counts by supported category where useful, recurring themes, severity, decisions, limitations, and the review cursor.

Raw D1 feedback has a 12-month maximum retention target. The site owner is accountable for the quarterly review: preview the number of rows older than the chosen UTC cutoff, obtain explicit authorization for deletion, delete only those rows through authenticated Wrangler, and rerun the count to verify zero matching rows. Use `WRANGLER_WRITE_LOGS=false` so Wrangler does not create a second raw-data copy. There is no automatic purge in the MVP; a missed quarterly purge is an operational risk that must be recorded, not silently described as enforced retention.

## Non-goals

User accounts, direct replies, email notifications, an admin dashboard, conversation threads, attachments, screenshots, ratings, public comments, automated roadmap changes, and behavioral tracking are out of scope.
