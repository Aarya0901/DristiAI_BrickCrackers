# Content Truth — product claims and their sources

Every factual claim on the VIGIL site traces to a source in the research dossier
(`Drishti AI (fable 5 max).md`). Claims not yet evidenced are explicitly marked.

## Capability claims

| Claim | Source | Status |
|---|---|---|
| Anonymous seat tracking (seat IDs, no identity) | Dossier §5, §23 | Designed but not yet measured in a live session |
| Head direction estimation (coarse left/centre/right) | Dossier §16 | Component tested; not evaluated on seated-exam data |
| Drishti attention field (gaze-target heatmaps) | Dossier §13A | Planned integration; not yet benchmarked |
| Seat-graph pairwise evidence (directed/reciprocal edges) | Dossier §15C, §16 | Designed; held-out evaluation pending |
| Counterfactual alert cards with 14 explainability fields | Dossier §14 | Spec; not yet validated |
| Visibility-aware abstention (unobservable state) | Dossier §16 | Implemented in rule engine; ablation pending |
| Human-review-gated alert queue | Dossier §26 | Spec; real-world usability not tested |
| Camera/GPU health monitoring | Standard observability | Planned |
| Event-only retention (configurable window) | Dossier §23 | Designed for DPDP alignment |
| Skeleton-first replay (no raw video by default) | Dossier §23 | Spec |

## Metric claim sources

| Metric | Source | Status |
|---|---|---|
| False alerts / student-hour | Dossier §17 evaluation plan | Unmeasured — "Validation in progress" |
| Event-level recall | Dossier §17 | Unmeasured |
| Seat-attribution accuracy | Dossier §16 seat anchoring | Unmeasured |
| Alert latency ≤ 5 s | Dossier §2 real-time promise | Target — not yet a measured result |
| Low-visibility abstention rate | Dossier §16 | Unmeasured |
| Explanation completeness | Dossier §14 | Unmeasured |

## Privacy claims

| Claim | Source | Status |
|---|---|---|
| No facial recognition | Dossier §23 | Architecturally guaranteed (no face module in pipeline) |
| No identity linkage | Dossier §23 | Architecturally guaranteed (seat IDs only) |
| Local/on-premise inference | Dossier §24 | Designed |
| "Designed for DPDP-aligned deployment" | Dossier §23 | Language approved; not certified |
| Accommodation controls | Dossier §23.10 | Planned |

## Limitations (visible on site)

Every limitation listed in `src/content/research.ts` (§5 limitations) traces to
the dossier §4 pixel arithmetic and §12 feasibility analysis. None is softened.

## Note on fabrication

No performance number, customer name, certification, or deployment history is
invented on any page. The site is a product concept site for a system in the
prototype stage. Where a number would normally appear, the site renders
"Validation in progress" or a target label.
