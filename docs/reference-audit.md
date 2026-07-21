# Phase 0 — Live Reference Audit: cal.com

Audited 2026-07-21 against the live site (Framer-built marketing pages).
Values measured via DOM `getComputedStyle`, pixel-sampled from screenshots where
DOM was opaque, or read from extracted audit data. Screenshots were captured
at the time and used for this audit; raw machine data is now purged (one-time
audit tooling, not needed in the repository).

Pages: `/` (home), `/pricing`, `/enterprise`, `/ai`, `/solutions/sales`, `/blog`.
Viewports: 1440×1000, 1280×800, 1024×768, 390×844.

Note: cal.com's current marketing site is rendered by Framer with absolute
positioning and hashed class names; where DOM measurement was impossible,
values were pixel-sampled from screenshots (method noted per row).

---

## 1. Layout & container

| Value | Measurement | Source |
|---|---|---|
| Content column max-width | **1200px** (x=120 → x=1320 @1440px) | section wrappers `div.framer-1uc0xrr` etc., `padding: 0 12px` |
| Hero / feature "shell" card width | **1176px** (1200 − 2×12 inset) | `div.framer-eyoavh` rect x=132 w=1176 |
| Desktop gutters | 120px @1440 (i.e. centered, fluid below 1200+chrome) | same rects |
| Mobile gutters | **24px** @390 (hero card x=24, w=342) | mobile pass, `heroCard` |
| Nav height | ~**64–76px** (Sign-in text y=28 h=16; nav links h=60 y=7) | `a.framer-it7a3j` rect |
| Hero card top offset | y=96 @1440 (≈ 20–24px below nav) | `div.framer-eyoavh` |
| Section pitch | ~900px between section starts (eyebrow y: 1036 → 1936) | `framer-text` eyebrow rects |
| Gap between sections | ~**140–150px** whitespace; hairline divider with "+" cross markers at both ends at some boundaries | screenshot `_crop-howitworks` top edge |

## 2. Surfaces & backgrounds

| Layer | Value | Source |
|---|---|---|
| Page canvas | `#F4F4F4` | `body` computed + pixel sample (20,500) |
| Card surface | `#FFFFFF` | pixel sample (700,300) |
| Inset / pill grey | `#F1F1F2` – `#F5F5F5` | pixel samples (400,629), (260,224) |
| Hairline border | **`#E1E2E3`** | pixel scan across card edge (196,1300) |
| Inverse section (e.g. `/ai`) | deep blue-black `#0F0E1A` family with slightly lighter `#19182B` panels | `_crop-ai-top.png` |
| Card drop shadow | `rgba(36,36,36,.7) 0 1px 5px -4px, rgba(36,36,36,.05) 0 4px 8px` — extremely subtle | computed on `div.framer-eyoavh` |

## 3. Ink / text colours

| Role | Value | Source |
|---|---|---|
| Headline ink | `#242424` (rgb 36,36,36) | h1/h2 computed |
| Body ink | `#292929` (rgb 41,41,41) | `p.framer-text` computed |
| Secondary/support grey | `#6B7280` (rgb 107,114,128) | paragraph computed |
| Muted label grey | `#898989` (rgb 137,137,137) | eyebrow computed |
| Button fill (primary) | near-black `#262626`–`#272727` | pixel samples (623,1216), (688,1216) |

## 4. Typography (measured)

| Role | Font | Size / line-height | Weight | LS | Source |
|---|---|---|---|---|---|
| Hero H1 | Cal Sans | **64px / 70.4px (1.1)** | 600 | 0 | `h1.framer-styles-preset-1ks0tzq` |
| Hero H1 mobile | Cal Sans | **40px / 44px (1.1)** | 600 | 0 | mobile pass |
| Section H2 | Cal Sans | **48px / 52.8px (1.1)** | 600 | 0 | `h2.framer-styles-preset-14lqleo` |
| Card heading | Cal Sans (UI) | ~18–20px / 1.2 | 600 | 0 | `_crop-benefits` measurement |
| Body/support | Inter | **16px / ~26px** | 400 | 0 | computed paragraphs |
| Small label | Cal Sans UI Light | **14px / 21px** | 300 | −0.2px | "Sign in" link |
| Eyebrow (in pill) | Cal Sans UI Light | **12px / 12px** | 300 | 0 | "How it works" node |
| Micro grey label | Inter | **14px / 16px** | 500 | 0 | `p.framer-text` (rgb 137,137,137) |

Cal.com is NOT a poster-type site: 64px hero, 48px section headings, generous
whitespace does the work. Eyebrows are tiny lowercase labels inside a small
white hairline pill, often with a 10–12px icon, centred above the H2.

## 5. Radius scale (measured)

| Element | Radius | Source |
|---|---|---|
| Shell / hero card | **12px** | `div.framer-eyoavh` |
| Feature cards | 12px (visually 12–16) | screenshots + computed |
| Primary button (nav) | **12px**, height **36px**, padding 8px 12px | `a.framer-h6cN3` computed |
| Hero-size buttons | ~10–12px, height ~46–48px | `_crop-hero` |
| Eyebrow / announcement pill | full pill (999px) | screenshots |
| Mock-UI inner panels | ~8–10px | `_crop-benefits` (Notice & buffers panel) |
| Duration/time pills inside mock UI | ~8px | `_crop-hero` (15m/30m/45m/1h) |
| Number chip ("01") | ~8px, bg `#F4F4F4` | pixel sample (134,1321) |
| Icon tile (small grid) | ~12px icon box inside 12px card | `_crop-moregrid` |

## 6. Buttons

| Variant | Geometry | Source |
|---|---|---|
| Primary | near-black fill (`#262626`), white 14px medium text, h=36px, px=12–16, radius 12px, chevron "›" trailing, subtle inset highlight `rgba(255,255,255,.15) 0 2px 0 inset` | computed `a.framer-h6cN3` |
| Secondary | white fill, 1px `#E1E2E3` border, ink text, same geometry | `_crop-howitworks` "Book a demo" |
| Tertiary/ghost | light grey fill `#F1F1F2`, no border | pixel sample "Sign up with email" |
| Hover | gentle darken / arrow nudge; transitions are fast (~150–200ms ease) | live interaction |

## 7. Feature-card anatomy (the grammar that matters)

From `_crop-howitworks` / `_crop-benefits` (pixel-measured):

- Outer card: white, 1px `#E1E2E3` border, radius 12px, padding **~28–32px**.
- Text block: semibold heading (~18–20px) + 2–3 line grey support (16px, `#6B7280`).
- Gap text → mock UI: ~24–32px.
- **Mock UI bleeds to the card's bottom edge** (cut off mid-panel) — the mock
  is anchored bottom, not floating centered.
- Mock UI panels: white, own 1px hairline, radius ~8–10px, often **stacked
  2–3 deep with offset** behind the front panel.
- Inside mock UI: pills `#F4F4F4` bg radius 8; selected pill = white with
  border; toggles black; dropdown rows h≈40px radius 8 hairline border;
  pastel event blocks (lavender/rose/sky) in the week view; mono-ish small
  labels for times.
- Numbered steps: "01" chip = `#F4F4F4` rounded square (~8px radius), then
  heading, then support, then mock.

## 8. Marquee (logo strip)

- Label left: "Trusted by fast-growing…" 2-line small grey text; logos right, single row.
- Seamless duplicated loop, very slow (≈ 40s per loop), no visible fade mask on current site; pauses subtly on hover (JS-driven; no CSS animation name exposed).

## 9. Accordion (FAQ)

- Rows full-width of a ~1100px column; question 16–18px semibold ink; `+` icon right rotates to `×` when open.
- Hairline divider `#E5E5E5`-ish between rows; answer grey 16px, padding-bottom ~24px.
- Open animation ~250–350ms ease (grid-rows trick equivalent).

## 10. Footer

- Light (same canvas), large wordmark top-left ("Cal.com" ~24px semibold).
- 4–5 link columns (Solutions / Use Cases / Resources / Company + Downloads), heading semibold ~14px, links grey 14px, ~10px vertical rhythm.
- Bottom area: certification badges, social icons, legal line. Large multi-column, airy.

## 11. Motion

- Page/section reveal: ~400–600ms, opacity + small Y translate (Framer defaults).
- Micro-interactions: ~150–200ms ease on hover states.
- Easing family: ease-out / `cubic-bezier(0.22,1,0.36,1)`-like.
- Nothing bounces; nothing slides long distances.

## 12. Mobile adaptations (390px)

- Hero: two-column → stacked (copy, then booking widget below); H1 64→40px.
- Feature cards: grid → single column, full width.
- Small tile grid: 4×2 → 2×4.
- Nav: links collapse to hamburger overlay; CTA retained.
- Section padding compresses ~40%; gutters 24px.
- Mock UI: preserved, scaled to card width (not miniaturised below legibility).

## 13. What we deliberately do NOT copy

- Cal Sans (proprietary) → Inter Tight + Inter.
- Wordmark, logo, all illustration/mock-UI artwork, icons, copy, testimonials,
  customer logos, pricing — all original VIGIL equivalents.
- The "trusted by" logo wall — VIGIL has no customers; replaced by a
  capability-chip marquee (brief §4).
- Framer "+" divider motif is treated as cal.com flavour; VIGIL uses plain
  hairline dividers only.
