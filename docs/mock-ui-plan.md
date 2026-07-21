# Mock-UI Component Plan + Implementation Sequence

The mock-UI set is the design (brief §0). Every component is a real React
component sharing tokens with `/demo`; none is an image.

## Mock-UI set (shared primitives in `src/components/mock/`)

| Component | cal.com analog | Anatomy | Used on |
|---|---|---|---|
| `SeatMap` | booking widget calendar | 4×5 hall grid, seat cells with mono ID (C7), tier badge A/B/C, state fill + label (normal/review/high/unobservable), C7↔C8 edge highlight | hero, /demo, /seat-graph |
| `ThresholdPanel` | notice & buffers panel | rows: duration gate, repetition count, baseline sensitivity, visibility floor — label + segmented/select control | homepage How-it-works 02/04, /research |
| `AlertQueue` | notification stack | stacked review-request cards: severity chip, seat mono, behaviour line, relative time ("2 min ago"), stacked 2 deep | homepage, /demo |
| `TimelineStrip` | calendar week view | session clock axis, per-seat event bands (colour by state), gap for unobservable | /demo, How-it-works |
| `EvidenceCard` | — (VIGIL's best) | header (seat, severity, type), 14-field grid (duration, repetitions, visibility, confidence, baseline deviation, target seat, reciprocal response, geometry, object candidate, tier, window, thresholds, uncertainty, counterfactual), tabs | Trust section, /seat-graph, /demo |
| `CounterfactualTabs` | — | `What triggered / What did not trigger / What remains uncertain`, keyboard-operable | Trust section |
| `HealthChip` | — | CAM-A · heartbeat dot · 12.4 FPS · 1080p; GPU load bar; latency mono | /demo, /deployment, How-it-works 01 |
| `CommandChip` | short-link chip | `$ vigil analyze --source hall-a --privacy skeleton-first`, mono, copy affordance | hero |
| `AttentionLens` | overlay toggle | toggle + seat-map overlay: soft beams + heat field | /drishti, /demo |
| `StreamChip` | — | RTSP · 1080p · 15 FPS ingest state chip | How-it-works 01 |
| `SeatAnchorGrid` | availability editor | seat polygons snapping to tracks (before/after) | How-it-works 02 |
| `HeatField` | — | room-level attention heat over seat map | How-it-works 03, /drishti |
| `PairEdge` | — | two seat nodes + directed/reciprocal edge with weight label | How-it-works 04, /seat-graph |
| `SkeletonReplay` | — | pose-skeleton figure on neutral stage, play/scrub | /demo modal, /privacy |

Hero visual (`SeatFieldCanvas`): canvas, isometric-lite hall — 16 seats, soft
attention beams, low-amplitude heat field, C7↔C8 reciprocal edge, one grey
unobservable seat, camera frustum, floating mini `EvidenceCard`. Time-driven,
pauses offscreen, DPR ≤ 2, static under reduced motion.

## Implementation sequence

1. Scaffold: configs, fonts, `globals.css` tokens, layout, header/footer shells.
2. Content system: `src/content/*` (salvaged), banned-vocab lint, metric type + Vitest.
3. Mock-UI primitives (above) — the design's core asset.
4. Homepage sections in brief order: Hero → CapabilityMarquee → HowItWorks → CapabilityCatalog → TwoSurfaces → SmallFeatureGrid → Evaluation → Trust → BuildStages → FAQ → FinalCTA → Footer.
5. `/demo` dashboard (second priority surface).
6. `/drishti`, `/seat-graph`, `/research`, `/privacy`, `/deployment`, `/roadmap`, `/404`.
7. QA loop: screenshots all routes × 7 viewports, side-by-side vs `docs/reference-shots/`, fix, repeat ≥2; a11y smoke; content lint; metric tests; WebKit+Firefox pass; reduced-motion; keyboard-only; JS-disabled.
