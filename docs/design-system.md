# VIGIL Design System — cal.com grammar, VIGIL semantics

Every value below is a token. Components reference tokens only — never raw
hex/px from the audit. Source of truth in code: `src/app/globals.css`.

## Colour — surfaces

| Token | Value | From audit | Use |
|---|---|---|---|
| `--bg-canvas` | `#F4F4F4` | §2 | page background |
| `--surface-card` | `#FFFFFF` | §2 | cards, mock-UI panels |
| `--surface-inset` | `#F4F4F5` | §2 pill grey | inset panels, chips, selected-off pills |
| `--bg-inverse` | `#101014` | §2 (darkened `/ai` toward neutral) | rare inverted sections, footer wordmark band |
| `--surface-inverse` | `#1B1B21` | §2 | panels on inverse |
| `--line-subtle` | `#E4E4E7` | §2 `#E1E2E3` (nudged to neutral zinc) | hairline card borders |
| `--line-strong` | `#D4D4D8` | derived | dividers needing more presence |
| `--line-inverse` | `#2A2A30` | derived | hairlines on inverse |

## Colour — ink

| Token | Value | From audit |
|---|---|---|
| `--ink-primary` | `#242424` | §3 headline ink |
| `--ink-secondary` | `#52525B` | §3 body (zinc-600, contrast-safe) |
| `--ink-muted` | `#8A8A93` | §3 `#898989` neutralised |
| `--ink-inverse` | `#F4F4F5` | derived |
| `--ink-inverse-muted` | `#A1A1AA` | derived |

## Colour — semantic accents (meaning only, product-UI only)

| Token | Value | Meaning |
|---|---|---|
| `--attention` | `#0E9FBE` (soft cyan) | attention field, beams, lens |
| `--attention-soft` | `#DDF3F8` | attention tint fills |
| `--review` | `#B97E1E` (amber) | medium review request |
| `--review-soft` | `#FAF0DC` | amber tint |
| `--high-review` | `#C0504D` (muted red, desaturated) | high-priority review only |
| `--high-review-soft` | `#F7E3E1` | red tint |
| `--healthy` | `#4F8267` (desaturated green) | normal seat / healthy stream |
| `--healthy-soft` | `#E0EDE4` | green tint |
| `--unobservable` | `#9CA3AF` (neutral grey) | visibility insufficient — **grey, never red** |
| `--unobservable-soft` | `#E9EAEC` | grey tint |

## Typography

- Display: **Inter Tight** (self-hosted via next/font, weights 500/600) — hero & headings.
- Body: **Inter** (400/500) — text, UI.
- Mono: **IBM Plex Mono** (400/500) — seat IDs, timestamps, JSON, commands, chips.

| Token | Value (desktop → mobile) | Use |
|---|---|---|
| `--text-hero` | `clamp(2.5rem, 1.9rem + 2.6vw, 4rem)` (64px @1440 → 40px @390, lh 1.1, ls −0.02em) | H1 |
| `--text-section` | `clamp(2rem, 1.6rem + 1.8vw, 3rem)` (48px → 32px, lh 1.1, ls −0.02em) | H2 section headings |
| `--text-card-title` | `1.25rem` (20px, lh 1.25, ls −0.01em, w600) | card headings |
| `--text-body-lg` | `1.125rem` (18px, lh 1.6) | hero support |
| `--text-body` | `1rem` (16px, lh 1.6) | body, answers |
| `--text-small` | `0.875rem` (14px, lh 1.5) | nav links, small UI text |
| `--text-eyebrow` | `0.75rem` (12px, lh 1, w500) | eyebrow pills |
| `--text-mono-sm` | `0.8125rem` (13px, lh 1.5) | mono chips, JSON |

## Radius scale (real scale, used consistently)

| Token | Value | Use |
|---|---|---|
| `--radius-pill` | `999px` | eyebrow pills, chips, announcement pill |
| `--radius-sm` | `8px` | inner mock-UI panels, pills, inputs, dropdown rows |
| `--radius-md` | `10px` | buttons |
| `--radius-lg` | `12px` | cards, shell cards, modals |
| `--radius-xl` | `16px` | hero shell + largest gateway cards only |

## Buttons (audited geometry)

| Token | Value |
|---|---|
| `--btn-h` | `36px` (nav/inline) · `--btn-h-lg: 46px` (hero) |
| `--btn-px` | `16px` |
| `--btn-radius` | `var(--radius-md)` |
| `--btn-font` | 14px / 500 |
| Primary | bg `--ink-primary` (#242424), text `#FFF`, hover → `#000` |
| Secondary | bg `--surface-card`, border `--line-subtle`, text `--ink-primary`, hover border `--line-strong` |
| Ghost | bg `--surface-inset`, no border |

## Layout

| Token | Value | From audit |
|---|---|---|
| `--container-max` | `1200px` | §1 |
| `--container-pad` | `24px` (all viewports) | §1 mobile gutters |
| `--shell-inset` | `12px` | §1 hero card inset |
| `--section-gap` | `clamp(96px, 12vw, 160px)` | §1 section pitch |
| `--card-pad` | `clamp(24px, 3vw, 32px)` | §7 |
| `--card-gap` | `24px` | §7 |
| `--nav-h` | `68px` | §1 |

## Shadows (barely-there, cal.com §2)

| Token | Value |
|---|---|
| `--shadow-card` | `0 1px 5px -4px rgb(36 36 36 / 0.7), 0 4px 8px 0 rgb(36 36 36 / 0.05)` |
| `--shadow-pop` | `0 8px 24px -8px rgb(36 36 36 / 0.12)` (dropdowns, modal) |

## Motion (quiet; one easing family)

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | everything |
| `--dur-micro` | `160ms` | hover, focus, toggles |
| `--dur-reveal` | `560ms` | section/card reveal (12–20px translate) |
| `--dur-accordion` | `280ms` | FAQ open/close |
| Marquee | `42s` linear loop, pause on hover | capability rail |

`prefers-reduced-motion`: loops and scroll-linked transforms off; state
changes instant; zero information loss. Canvas loops pause offscreen
(IntersectionObserver) with DPR capped at 2.

## Component rules

- Section rhythm: eyebrow pill → H2 (`--text-section`) → 1-line support → optional dual CTA → content (cal.com §7).
- Cards: white, 1px `--line-subtle`, `--radius-lg`, `--shadow-card`, `--card-pad`.
- Mock UI inside cards: anchored to the card bottom, bleeding to the bottom edge; own hairline + `--radius-sm`; may stack 2 deep with 8px offset.
- Status is never colour alone: every state chip carries a text label.
- Eyebrow pill: `--surface-card` bg, `--line-subtle` border, `--radius-pill`, 12px/500 ink-secondary text, 12px glyph.
- Mono only for: seat IDs, timestamps, FPS/latency numbers, JSON, command strings.
