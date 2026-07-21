# Salvage Notes — what carries forward into the cal.com-grammar rebuild

Source: `.archive/site-20260721-215804/` (pre-revert `site/` @ `420cf7c`).

## 1. Content copy (carry forward near-verbatim)

The previous build's copy was written against the *same product brief* and is
excellent. All of it is reused in the new `src/content/` files:

- **Hero**: announcement pill, two-line headline ("The attention intelligence
  layer / for physical exam halls."), subheading, dual CTA, command strip
  `$ vigil analyze --source hall-a --privacy skeleton-first`, supporting line.
- **Capability rail** (7 chips) — verbatim.
- **Pipeline stages** (Observe/Anchor/Estimate/Correlate/Explain, 01–05) — verbatim.
- **Capabilities catalog** (7 items with index/eyebrow/title/summary) — verbatim.
- **Gateway cards** (Live Invigilator Assist / Control Room Intelligence with
  feature + stat lists) — verbatim copy, new cal.com-style card anatomy.
- **Legacy comparison** (5 vs 5 points) — verbatim.
- **FAQ** — all 15 Q&A + 5 categories verbatim; the new build adds URL-hash
  deep-linking and filter chips per brief §4.
- **Metrics** — the `Metric` type (`status: "measured" | "target" | "unmeasured"`)
  and 6 metric definitions verbatim; enforce "unmeasured → Validation in
  progress" at the component type level + Vitest test (brief §6).
- **Trust panels** (Never accuses / Says when it cannot see / Measures false
  alarms) — verbatim.
- **Sample evidence card** (seat C7 ↔ C8, timeline, triggered/not-triggered/
  uncertain, counterfactual) — verbatim; becomes the `CounterfactualTabs` data.
- **Alert JSON example** — verbatim, labelled "illustrative" wherever rendered.
- **Research content** — model stack, capability tiers A/B/C, dataset plan,
  5 limitations, references, evaluation principles — verbatim.
- **Privacy content** — 10 principles + DPDP alignment list — verbatim.
- **Deployment / roadmap / drishti / seat-graph content** — carried forward
  from archive (`content/deployment.ts`, `roadmap.ts`, `drishti.ts`,
  `seat-graph.ts`).
- **Demo data model** — `DemoSeat`/`SeatState` (normal/review/high-review/
  unobservable), `DemoAlert` fixtures, `timelineEvents`, `healthMetrics` —
  reused as the simulation state for the rebuilt `/demo`.
- **Navigation** — nav links, Product dropdown, footer columns; dropdown item
  descriptions updated to the brief §3 wording.

## 2. Patterns worth reusing (re-implemented on new tokens)

- Typed-content-file architecture: zero copy inline in components; every page
  binds to `src/content/*`. Kept exactly.
- `getMetric(id)` throwing on unknown ids — kept.
- Demo state machine: seat-state transitions + alert queue +
  accept/dismiss-with-reason + timeline + health chips — kept as interaction
  model, restyled.
- Canvas hero approach: single rAF loop, DPR cap, IntersectionObserver pause,
  reduced-motion static frame — kept; art direction changed completely (soft
  isometric-lite hall, attention beams, heat field, C7↔C8 edge, one grey
  unobservable seat, camera frustum, floating evidence card).
- Scripts: Playwright screenshot/matrix runner, a11y smoke, banned-vocabulary
  grep — rewritten for the new route list.

## 3. Discarded (and why)

- **All visual tokens** (`globals.css`): cold-grey canvas `#F2F4F3`, cobalt
  `#3652E3`, 0–10px radii, 112px hero type — wrong reference family (that was
  a Supermemory-grammar build). Replaced by cal.com-audited tokens
  (`docs/reference-audit.md` → `docs/design-system.md` in the new build).
- **`SectionFrame` "〉SECTION NAME [n/9]" eyebrow style** — not cal.com grammar;
  replaced by small muted eyebrow + moderate heading per audit.
- **All component styling** — rebuilt; only content bindings and interaction
  logic carried over.
- **Old reference-audit docs/screenshots** — audit of the wrong site;
  superseded by the Phase 0 cal.com audit.
- **Stock Next.js `public/*.svg`** — boilerplate, unused.
- **Old visual baselines** — regenerated for the new design.

## 4. Stack decisions retained

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 as
low-level utility layer · CSS variables as the token source of truth ·
`motion` for transitions · Playwright · Vitest. Same major versions as the
salvaged `package.json` (Next 16.2.10), minus anything the new build does not
need.
