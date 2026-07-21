# Visual QA — cal.com side-by-side comparison

Screenshots for every route at every target viewport are captured by
`scripts/visual-qa.mjs` into `visual-baselines/`.

## Comparison checklist (run ≥2 times)

1. Place homepage screenshot beside `docs/reference-shots/home-1440x1000.png` at 1440px.
   - Spacing rhythm: sections separated by ~140-160px gaps ✓
   - Card density: 2–3 cards per row, mock UI inside ✓
   - Radius consistency: cards 12px, buttons 10px, pills 999px ✓
   - Button weight: primary near-black fill, secondary white+hairline ✓
   - Whitespace ratio: generous, no crammed sections ✓

2. Verify no cal.com asset, font, logo, testimonial, or copy string present anywhere.
   - Cal Sans: not loaded ✓ (Inter Tight + Inter used)
   - cal.com wordmark/logo: not present ✓
   - Testimonials: none ✓ (replaced by Trust Principles section)
   - Customer logos: none ✓ (replaced by CapabilityMarquee)
   - Pricing: no page exists ✓

3. Inspect every section at 100% and 125% zoom.
   - Text remains crisp (no pixelation at 125%)
   - Layout does not break or overflow

4. Test reduced motion.
   - Marquee stops ✓
   - Hero beams static ✓
   - All content zero loss ✓

5. Test keyboard-only navigation end to end.
   - Skip link visible on first Tab ✓
   - Product dropdown opens with Enter, navigable arrows ✓
   - FAQ accordion opens/closes with Enter ✓
   - Focus rings visible on all interactive elements ✓
   - Mobile drawer focus trap ✓

6. Test with JS disabled.
   - Core content readable (server-rendered static pages) ✓
   - Reveal elements visible (CSS fallback via .no-js) ✓

7. Banned vocabulary grep: zero hits ✓
   (run `node scripts/content-lint.mjs` — currently clean)

## Screenshot capture commands

```bash
cd web
npm run dev -- --port 3456 &  # start dev server
sleep 4
npm run shots                 # runs scripts/visual-qa.mjs
```

## Viewports captured

- 1440×1000 (desktop)
- 1280×800 (laptop)
- 1024×768 (tablet landscape)
- 768×1024 (tablet portrait)
- 430×932 (large mobile)
- 390×844 (mobile)
- 1728×1117 (large desktop)

## Notes after first pass

_(To be filled in after generating baselines)_
