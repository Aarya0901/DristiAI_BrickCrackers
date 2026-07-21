# Assumptions made and gaps remaining

## Assumptions

1. **Font self-hosting**: Inter Tight, Inter, and IBM Plex Mono are self-hosted
   automatically by `next/font/google` in Next.js 16 — no manual font files needed.

2. **Hero seat count**: The hero visual uses 3 rows × 8 columns = 24 seats to
   accommodate the C7↔C8 reciprocal pair referenced throughout the content
   (evidence card, alert JSON, seat graph). The brief's "12–20 seats" guidance
   is slightly exceeded; C7 by construction requires at least 7 columns in row C.

3. **Cal.com current state**: The live cal.com site at time of audit is
   Framer-built with hashed classes. Measurements were taken from live DOM
   where possible and pixel-sampled from screenshots where DOM was opaque.

4. **No blog**: cal.com has a blog at `/blog`; VIGIL is pre-pilot with no blog
   content. Not created.

5. **No pricing page**: Brief explicitly forbids a pricing page (§5: "A pricing
   page exists" is a fail condition). Build stages use the pricing-grid
   *structure* with status badges instead.

6. **No shadcn/ui**: All UI is token-driven, built directly. Brief forbids
   shadcn on marketing surfaces.

7. **Single easing curve**: cal.com uses one easing family throughout. VIGIL
   uses `cubic-bezier(0.22, 1, 0.36, 1)` everywhere.

8. **Container max-width**: 1200px measured from cal.com content column.

9. **Next.js 16 APIs**: Standard App Router APIs (metadata, next/font/google,
   Link, sitemap/robots, `not-found.tsx`) confirmed present and unchanged from
   Next.js 14/15.

10. **Canvas vs SVG for hero**: Used SVG + CSS animations instead of Canvas.
    SVG is accessible (text nodes with seat IDs are real DOM), CSS animations
    naturally pause via `animation-play-state`, and reduced-motion fully
    supported. The brief allows "SVG or Canvas."

## Gaps

1. **Visual side-by-side not yet performed**: The Playwright QA script captures
   baselines but the side-by-side comparison against cal.com reference shots
   has not been done inline. This is manual work — see `docs/visual-qa.md`.

2. **WebKit and Firefox not tested**: Cross-browser QA pending (Playwright
   project uses Chromium for screenshot capture).

3. **Lighthouse not run**: Performance audit pending. The site should target
   ≥90 desktop / ≥80 mobile.

4. **SEO metadata**: OG images not yet generated (`opengraph-image.tsx` is a
   stub — the brief references `opengraph-image.tsx` in the salvage; not yet
   implemented). Canonical URLs point to `https://vigil.example.com` (placeholder).

5. **`/demo` interaction fidelity**: The dashboard is a simulation — seat
   states do not animate transitions, dismissal is stateful but not persisted,
   attention lens is a visual toggle without real data overlay. Good enough as
   a marketing-demo surface per brief §7.

6. **Counter analytics strip removed**: The salvage had unused counterStrip data
   (sessions/events/student-hours). Not included — would need measured values.

7. **`docs/content-truth.md` table completion**: Some rows are placeholders
   ("Spec; not yet validated"). These are intentionally honest.

8. **Mobile drawer animation**: CSS transition-based (not framer-motion).
   Acceptable per brief ("animated open/close") but the cal.com drawer uses
   Framer for smooth spring physics. Acceptable because the drawer is CSS
   `transform: translateY` with `var(--ease-out)`.

9. **Hero evidence-card preview**: The floating mini card at the hero's right
   edge uses absolute positioning. On narrow viewports it hides (below 640px).
   Brief's "floating at the edge like cal.com floats its widget" is honored at
   tablet+.

10. **Favicon**: The `icon.svg` is the VIGIL mark (seat grid). A traditional
    `.ico` multi-resolution favicon is not generated; the SVG icon should work
    in modern browsers.
