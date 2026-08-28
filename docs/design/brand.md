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
- Maintain 44 px minimum touch targets, visible keyboard focus, and meaning that does not rely on color alone.
- Support 320 px and wider without horizontal scrolling. Check 320/390 px mobile, the 800 px layout boundary, and desktop before release.

## Design-steward workflow

For meaningful user-facing changes, explicitly assign a design-steward reviewer. The reviewer should:

1. Read this document and inspect existing tokens/components before proposing new ones.
2. Check visual hierarchy, spacing, alignment, responsive behavior, icon clarity at 16 px, focus, contrast, and positive/negative result states.
3. Prefer extensions to shared tokens and components over one-off fixes.
4. Return actionable findings to the site-owning agent, who alone integrates, commits, publishes, and performs the final browser handoff.
5. Record any accepted new token, logo variant, or reusable pattern here before release.

Agents do not persist between sessions. This document—not chat history—is the durable design authority.
