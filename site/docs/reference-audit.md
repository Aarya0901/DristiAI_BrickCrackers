# Reference Audit — supermemory.ai (Phase 0)

**Method:** Playwright (Chromium), full-page screenshots + `getComputedStyle` extraction, at 1440×1000, 1280×800, 1024×768, 390×844, across home, `/research`, `/connectors`, `/memory-graph`, `/rag`, `/personal`, `/pricing`, `/case-studies`.

Raw screenshots: `docs/reference-screens/*.png` (32 files). Raw computed-style dump: `docs/reference-audit-data.json`. Script: `scripts/reference-audit.mjs` (`node scripts/reference-audit.mjs`, requires Playwright + Chromium, not run in CI).

This document records **structural DNA** (grid, spacing, type scale, motion timing, border/radius language) measured directly from the live site. Colors, wordmark, illustrations, and copy are **not** reused — VIGIL has its own palette and assets per the brief. Where the brief's written visual-direction spec (monochrome + sharp border system) differs from the live site's current softer/bluer skin, the brief's spec wins for VIGIL's actual color and radius choices; the live site is used for rhythm, density, and motion grammar.

## Global

| Property | Measured value |
|---|---|
| Body font | `"DM Sans", sans-serif` |
| Heading font | `"Space Grotesk", sans-serif` |
| Mono/technical font (labels, code) | `"DM Mono", monospace` |
| Base html font-size | `16px` |
| Body background | `rgb(255,255,255)` |
| Body ink | `rgb(11,16,21)` (~`#0B1015`, near-black, not pure `#000`) |
| Primary accent | `rgb(5,98,239)` (~`#0562EF`, footer bg / big CTA blocks) |
| Global corner radius on core elements (nav link, h1, h2, card, footer) | `0px` — the "sharp/blocky" read comes from **flat 0px-radius text and structural elements**; radius is reserved for buttons/pills/tag chips only |
| Nav height | `71px`, `border-bottom: 1px solid rgb(197,219,242)`, `background: rgba(255,255,255,.95)` + backdrop-blur, `position: fixed` |
| Page max content width | effectively full viewport for hero/band sections, constrained (~`1100–1200px`) for text columns |

## Type scale (desktop, 1440px viewport)

| Role | Font | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Hero H1 | Space Grotesk | `72px` | 500 | `74.88px` (1.04) | `-4.176px` (~-0.058em) |
| Section H2 | Space Grotesk | `44px` | 500 | `46.2px` (1.05) | `-1.76px` (~-0.04em) |
| Nav link / small label | DM Sans | `15px` | 500 | `21px` | `-0.15px` |
| Eyebrow / numbered label | DM Mono | ~`12–13px` | 500–600 | tight | uppercase, wide tracking |

H1 tightens progressively at narrower breakpoints (measured drop-off toward ~`40–48px` at 390px) — never a fixed px value, always a fluid/clamped scale with markup-controlled line breaks, matched by VIGIL's `clamp()` scale.

## Borders, radii, motion

- Structural borders are **1px hairlines**, low-contrast blue-grey (`rgb(197,219,242)`-class), not heavy black rules.
- Cards, diagrams, and code panels use small, consistent radii (roughly `8–12px` equivalent) — not sharp `0px`, not pill. VIGIL's brief explicitly asks for **more square** than this (restrained radii, "no excessive pill cards"), so VIGIL will run radii tighter than the live reference.
- Micro-interaction transitions (nav link hover, button state): `0.18s` / `0.12s`, easing `cubic-bezier(0.23, 1, 0.32, 1)`.
- Section/card reveal transitions: `0.6s / 0.7s / 0.5s`, easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- These two easing families (`cubic-bezier(0.23,1,0.32,1)` for instant micro-feedback, `cubic-bezier(0.22,1,0.36,1)` for content reveal) are adopted as VIGIL's two motion curves — see `docs/design-system.md`.

## Composition rhythm (observed across routes)

1. Fixed thin-border nav, logo/links/CTA, ~71px tall.
2. Hero: small eyebrow chip → big left-aligned editorial H1 with deliberate line break → muted support paragraph → two CTAs (filled + ghost) → a technical/product visual to the right (diagram, node cluster, or dashboard crop) that is **animated**, not static.
3. Dense **three-up icon+heading+text card rows** with thin borders and small numbered/tag chips — used for both "problem" framing and "capability" framing.
4. At least one **centered, large standalone statement heading** breaking the left-aligned rhythm (e.g. "Set once. Always fresh.") — a full-width beat between denser sections.
5. **Technical diagrams**: rounded-rect nodes, thin connecting lines (solid + dashed), directional arrows, small mono labels on edges, restrained color (mostly ink + one accent).
6. **Code/terminal panels**: dark background, colored syntax tokens, rounded corners, three window-control dots, monospace.
7. **Benchmark/metric cards**: bars or numeric callouts with source labels, never bare unsourced numbers.
8. **Logo/integration rail**: dense grid of small bordered tiles (icon + name + one-line description + "learn more" link), 2–3 columns desktop, 1 column mobile.
9. **FAQ**: category filter pills, accordion rows with chevron rotation, hairline dividers.
10. **Footer**: full-bleed accent-color panel, white text, 4 link columns, small logo mark, and a **giant wordmark bleeding off the bottom edge of the viewport** — the single most memorable brand beat on the site. VIGIL reproduces this footer beat with its own wordmark.
11. Numbered eyebrow labels (`01 / MEMORY`, breadcrumb-style `› CASE STUDIES`) recur on every route as the section-identity device — directly maps to VIGIL's `〉SECTION NAME [n/9]` requirement.

## Mobile (390×844)

- Nav collapses to logo + menu affordance (no default hamburger icon panel visible at rest).
- Hero image drops below the headline/CTA stack; headline shrinks but keeps its manual line break.
- Three-up card rows collapse to a single column, full width, same border treatment.
- Footer wordmark still bleeds off the viewport edge — scaled but not removed.

## Deviations VIGIL intentionally makes from the live reference

Per the brief's explicit Section 5/6 direction, VIGIL does **not** copy:

- the blue/white color system (VIGIL uses near-black ink, cold off-white, muted blue-grey, cobalt/cyan/amber/red/green semantic accents — see `docs/design-system.md`);
- the softer ~8–12px card radii (VIGIL runs tighter, mostly `2–6px`, "no excessive pill cards");
- any logo, illustration, or copy;
- the rounded 3D node-cluster hero graphic (VIGIL's hero is an isometric seat-field, not a sphere cluster).

VIGIL **does** adopt: the nav height/behavior class, the numbered-section rhythm, the dense three-up card grammar, the diagram-with-mono-labels grammar, the two-easing-family motion system, the centered-statement interstitial beat, and the giant-wordmark footer beat.
