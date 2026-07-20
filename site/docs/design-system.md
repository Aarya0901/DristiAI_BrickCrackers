# VIGIL Design System

All tokens live in `src/app/globals.css` as CSS custom properties, mapped into Tailwind v4 via `@theme inline`. Nothing in components should hardcode a color, size, or duration that has a token — see Section 17 anti-slop rule "spacing changes without a token."

## Color

VIGIL stays mostly monochrome. Accent colors carry meaning (system state), never decoration.

| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | `#F2F4F3` | Page background (cold off-white, not pure white) |
| `--bg-inverse` | `#0A0D10` | Dark sections, footer, code panels |
| `--surface-1` | `#FFFFFF` | Cards/panels on canvas |
| `--surface-2` | `#E7EAEA` | Recessed panel on canvas |
| `--surface-inverse-2` | `#12161A` | Recessed panel inside dark sections |
| `--ink-primary` | `#0B0F12` | Primary text |
| `--ink-secondary` | `#565F68` | Secondary/muted text (never < 4.5:1 contrast) |
| `--ink-inverse` / `--ink-inverse-secondary` | `#EEF1F2` / `#9AA3AC` | Text on dark surfaces |
| `--line-subtle` / `--line-strong` | `#D7DCDD` / `#0B0F12` | Hairline rules vs. strong outer frames |
| `--brand-cobalt` | `#3652E3` | Primary interactive accent — links, primary CTAs, focus rings, active nav |
| `--attention` / `--attention-soft` | `#1FD6E0` / `#C9F6F8` | Drishti attention field, heat visualization only |
| `--review` / `--review-soft` | `#E2A53D` / `#F8E6C4` | Behavioural-review-required state |
| `--high-review` / `--high-review-soft` | `#D1483F` / `#F2D3CF` | High-priority review only — never used for "low visibility" |
| `--healthy` / `--healthy-soft` | `#4C8F6A` / `#D7E9DD` | Normal/healthy system state |
| `--unobservable` / `--unobservable-soft` | `#8B93A0` / `#E4E7EA` | Visibility-insufficient — deliberately neutral grey, **not** red or amber, so low visibility never reads as suspicious (anti-slop rule) |

`--brand-cobalt` is intentionally distinct from the live reference's `#0562EF` (shifted toward indigo) so VIGIL doesn't read as a re-skin.

## Typography

- Primary sans: **Geist** (self-hosted via `next/font/google`, variable `--font-sans`), used for both headings and body at different weights/tracking — brief mandates exactly one sans face.
- Mono/technical: **IBM Plex Mono** (`--font-mono`) for eyebrows, coordinates, timestamps, code, JSON.
- Fluid scale via `clamp()`, no fixed breakpoint jumps:

| Token | Range | Used for |
|---|---|---|
| `--text-hero` | 52px → 112px | Hero H1 |
| `--text-section` | 38px → 76px | `[n/9]` section headings |
| `--text-heading-lg` | 28px → 40px | Card/panel headings |
| `--text-heading-md` | 22px → 28px | Sub-headings |
| `--text-body-lg` | 17px → 20px | Lead paragraphs |
| `--text-body` | 16px → 18px | Body copy |
| `--text-label` | 11px → 13px | Eyebrows, badges, mono annotations |

Tracking: headings use `--tracking-tight` (-0.045em) at hero scale, loosening to `--tracking-snug` at smaller heading sizes; labels use `--tracking-wide`/`--tracking-widest` uppercase.

## Spacing & grid

4px base scale, `--space-1` (4px) through `--space-12` (192px). Section vertical rhythm uses `--section-pad-y` (64px → 140px fluid). Content max-width `--content-max: 1280px` with fluid side padding `--content-pad`. A 12-column grid (`--grid-cols`) with fluid `--grid-gap` underlies all section layout — cards snap to shared column lines, no arbitrary offsets.

## Borders & radii

Structural elements (headings, section frames, nav) are `0px` radius — flatness is what reads as "designed," not decoration. Interactive elements (buttons, tags, small chips) use `--radius-xs` (2px) to `--radius-md` (6px) only. No pill buttons except small status tags. `--border-thin` (1px) is the default; `--border-thick` (2px) reserved for active/selected states and outer frames.

## Motion — exactly two curves

Measured from the live reference and reused as legitimate interaction-feel grammar (not IP):

- **`--ease-snap`** `cubic-bezier(0.23, 1, 0.32, 1)`, `--duration-snap` 160ms — hover, focus, press, toggle.
- **`--ease-reveal`** `cubic-bezier(0.22, 1, 0.36, 1)`, `--duration-reveal` 620ms — scroll reveal, section/card entrance, page transitions (`--duration-page` 650ms).

No other easing curves are introduced anywhere in the codebase. `prefers-reduced-motion: reduce` collapses all durations to near-zero globally (see `globals.css`) while preserving final state — information is never lost, only the animation is.

## Component-level rules

- `SectionFrame` owns the `〉SECTION NAME [n/9]` eyebrow, the section index, top/bottom hairlines, and the `--section-pad-y` rhythm — no page hand-rolls its own section padding.
- Diagrams share one node/line/arrow/label vocabulary (see `DiagramPrimitives` in `src/components/diagrams`), so Pipeline, Seat Graph, and Deployment diagrams all look like the same system.
- Status color (`review`/`high-review`/`healthy`/`unobservable`) is always paired with a text label — never color-only signaling (accessibility + "status never conveyed by color alone").
