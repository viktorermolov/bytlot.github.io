# BytLot brand and design stewardship

## Brand idea

BytLot helps people **know the real number** behind a headline price, rate, or payout. The visual system should feel like a calm financial instrument: direct, trustworthy, high-contrast, and useful before decorative.

The mark combines a measurement arc with a needle moving up and right. It represents finding a result and improving it—not speed, a specific gig platform, or a guaranteed profit.

## Logo assets

- `favicon_io/bytlot-mark.svg` is the regular square master.
- `favicon_io/bytlot-mark-maskable.svg` is the full-bleed safe variant for masked app icons.
- The header pairs the mark with live HTML text `BytLot`; do not turn the wordmark into a font-dependent image.
- Minimum digital mark size is 16 px; preferred interface size is 32 px or larger.
- Scale the whole SVG proportionally. Do not redraw, rotate, recolor, outline, distort, add effects, or place copy inside it.
- Generated PNG and ICO files must preserve the master artwork and sRGB colors. The SVG files remain the source of truth.

## Visual tokens

- Deep green `#14382d`: brand surface and primary dark field.
- Signal chartreuse `#d9ff73`: action/result accent; never use it for paragraphs on a light background.
- Canvas `#f3f5ef`: quiet page background.
- Ink `#10231d`: primary text.
- Preserve the existing native/system font stack. An external font needs an explicit privacy and performance decision.

Use generous space, restrained rounding, strong hierarchy, thin borders, and minimal shadow. Avoid gradients, glossy effects, decorative stock imagery, generic dashboard chrome, and one-off colors that bypass shared tokens.

## Component rules

- Driver Profit is a working surface. Keep its primary controls and result prominent.
- Form labels remain above controls; units stay inside the control shell; helper copy sits below and uses `aria-describedby` when it clarifies an input.
- Grid rows must use `align-items: start` so helper text never stretches or vertically displaces a neighboring input.
- Keep primary form actions one shared form-section space (22 px) below the final field group; when a validation message is visible, keep 12 px between the message and action.
- Preserve balanced desktop rows. In a two-column form with an odd final field, span that field across both columns rather than leaving an empty half-row.
- Maintain 44 px minimum touch targets, visible keyboard focus, and meaning that does not rely on color alone.
- Support 320 px and wider without horizontal scrolling. Check 320/390 px mobile, the 800 px layout boundary, and desktop before release.

### Feedback entry and dialog

- Feedback is a secondary product action. Place a discreet text-style `Feedback` button in the footer; do not add it to the calculator controls or compete with the primary calculation action.
- Give the footer action the same 44 px minimum target and visible focus treatment as every other interactive control. It may look like a link, but it remains a button because it opens an interface instead of navigating.
- Use the shared surface, line, ink, brand, signal, radius, spacing, and focus tokens for feedback. Do not introduce one-off colors, decorative icons, gradients, or a separate visual language.
- Present feedback in a compact modal dialog on larger screens and the same component as a bottom sheet at 520 px and below. Keep it within the viewport, allow its contents to scroll, account for safe-area insets, and ensure the Turnstile control cannot create horizontal overflow at 320 px.
- Keep the dialog title, visible text close control, fields, privacy helper, validation feedback, and primary action in a direct reading order. Labels remain above controls and helper/error text must be programmatically associated with its field.
- Opening the dialog moves focus to its title, keeps keyboard focus inside while open, and makes the page behind it unavailable. Escape and the visible close control dismiss it; closing returns focus to the footer trigger. Do not dismiss on an accidental backdrop click when a draft may be present.
- On submission, focus the first invalid field, announce request errors without removing the draft, prevent duplicate sends while pending, and move focus to the confirmation heading after success. Preserve a draft only in the current page session; do not put feedback text in browser storage.
- The mobile and desktop versions are one responsive component with the same semantics and content. Avoid motion that is necessary to understand state, and honor reduced-motion preferences if motion is added later.

## First-use patterns — 2026-09-04

- Keep the two existing workflows visible in the opening copy and tab bar. At 520 px and below, compact introductory/form spacing and omit the redundant in-form step label and estimate badge; retain the tab labels, primary H1/H2, input labels, and full-size controls. Desktop retains the fuller context.
- The shared vehicle disclosure shows a short gas/EV cost-per-mile summary plus a truthful state label: `Starter assumptions`, `Saved on this device`, or `Unsaved vehicle edits`. A failed write must not be described as saved; editing a custom saved profile back to starter values stays unsaved until the write succeeds.
- Worked examples are static, clearly illustrative articles below the main calculator and methodology, using borders and existing text tokens. Under-form text links lead to examples; their return links focus the appropriate first input. Examples never replace visitor values, saved settings or the current result.
- Offer Check may emphasize its existing target verdict in a compact textual badge. `Meets your target` uses the signal accent; `Below your target` uses a restrained outline. Hide the verdict when the inputs become stale or outside the offer result; do not imply an unconditional accept/decline recommendation.

## Design-steward workflow

For meaningful user-facing changes, explicitly assign a design-steward reviewer. The reviewer should:

1. Read this document and inspect existing tokens/components before proposing new ones.
2. Check visual hierarchy, spacing, alignment, responsive behavior, icon clarity at 16 px, focus, contrast, and positive/negative result states.
3. Prefer extensions to shared tokens and components over one-off fixes.
4. Return actionable findings to the site-owning agent, who alone integrates, commits, publishes, and performs the final browser handoff.
5. Record any accepted new token, logo variant, or reusable pattern here before release.

Agents do not persist between sessions. This document—not chat history—is the durable design authority.
