# Salvage Inventory — `site/` @ commit `420cf7c`

Recorded: 2026-07-21, before rollback. Branch `main`, working tree clean.
Commit that added `site/`: `420cf7c` ("site") — single commit, identified via
`git log --oneline --diff-filter=A -- site/`.

Archive locations (verified, 166 files, SHA-256 manifest match):
- `.archive/site-20260721-215804/` (git-ignored) + `.archive/checksums-site.txt`
- `C:\Users\mites\AppData\Local\Temp\opencode\site-archive-20260721-215804.tar.gz` (outside repo)
- Excluded from archive: `node_modules/`, `.next/` (regenerable from `package-lock.json`).

## Verdict summary

The previous build targeted the **wrong visual reference** (Supermemory-style:
cold grey canvas, cobalt accent, 0–10px radii, 112px poster type). The current
brief mandates the **cal.com grammar** (soft warm canvas, near-black buttons,
rounded radius scale, 56–72px hero, mock-UI-led cards). Therefore: **code and
tokens are mostly not reusable; content copy, IA, and the demo data model are
excellent and are carried forward** (see `salvage-notes.md`).

## Routes (8)

| Route | File | Keep? |
|---|---|---|
| `/` | `src/app/page.tsx` (159 ln) | Structure only — section order matches brief but card anatomy is wrong reference |
| `/drishti` | `src/app/drishti/page.tsx` (105) | Section plan reusable |
| `/seat-graph` | `src/app/seat-graph/page.tsx` (66) | Section plan reusable |
| `/research` | `src/app/research/page.tsx` (172) | Section plan reusable |
| `/deployment` | `src/app/deployment/page.tsx` (116) | Section plan reusable |
| `/privacy` | `src/app/privacy/page.tsx` (75) | Section plan reusable |
| `/demo` | `src/app/demo/page.tsx` (32) | Concept reusable; visuals rebuilt to cal.com tokens |
| `/404` | `src/app/not-found.tsx` (47) | Rewrite |

## Content files (`src/content/`) — the highest-value salvage

| File | Keep? |
|---|---|
| `types.ts` (Metric type with `status: "measured"\|"target"\|"unmeasured"`) | **Yes, near-verbatim** — matches brief §6 exactly |
| `home.ts` (hero copy, pipeline stages, trust panels, sample evidence card, gateway cards, legacy comparison, use cases, deployment modes) | **Yes** — copy matches brief §4 almost verbatim |
| `capabilities.ts` (7-item catalog) | **Yes, verbatim** — matches brief §4 CAPABILITIES |
| `faq.ts` (15 Q&A + 5 categories) | **Yes, verbatim** — matches brief §4 FAQ list exactly |
| `metrics.ts` (6 metrics, all `unmeasured`/`target`, `getMetric()`) | **Yes, verbatim** — implements brief §6 honesty rule |
| `navigation.ts` (nav, dropdown, footer columns) | **Yes, minor edits** (dropdown descriptions per brief §3) |
| `research.ts` (model stack, tiers, dataset plan, limitations, references, evaluation principles) | **Yes** |
| `privacy.ts` (10 principles, DPDP alignment) | **Yes** |
| `deployment.ts`, `roadmap.ts`, `drishti.ts`, `seat-graph.ts` | **Yes** (reviewed in archive, content carried forward) |
| `demo.ts` (seat states, alert fixtures, timeline events, health metrics) | **Yes** — data model for the rebuilt `/demo` |

## Components (44) — mostly discard, salvage patterns

| Component | Keep? |
|---|---|
| `demo/*` (DemoDashboard, SeatMap, AlertQueue, ReviewModal, SkeletonReplay, TimelineStrip, HealthPanel) | Interaction models + state machine reusable; visual layer rebuilt |
| `hero/SeatFieldCanvas.tsx` (329 ln canvas hero) | Approach reusable (rAF, DPR cap, offscreen pause); must be re-art-directed to cal.com softness (brief §2) |
| `sections/EvidenceCard.tsx`, `FaqAccordion.tsx`, `CapabilityCatalog.tsx`, `AblationMatrix.tsx`, `MetricCard.tsx` | Logic/content binding reusable; styling rebuilt on new tokens |
| `layout/SiteHeader/Footer/MobileNav` | Structure reference only; cal.com nav/dropdown/drawer differ |
| `ui/Button.tsx`, `AnnouncementPill.tsx`, `Modal.tsx` | Rebuild against audited button geometry |
| `sections/UseCaseCarousel.tsx`, `BadgeRail.tsx`, `PipelineTabs.tsx`, `StageCards.tsx`, `ComparisonChart.tsx`, `DeploymentCard.tsx`, `GatewayCard.tsx`, `LegacyComparison.tsx`, `TrustPanel.tsx`, `PipelineDiagram.tsx`, `FinalCta.tsx` | Discard styling; some content bindings reused |
| `drishti/AttentionFieldCanvas.tsx`, `seat-graph/SeatGraphDiagram.tsx` | Rebuild as cal.com-style mock UI |

## Token / config files

| File | Keep? |
|---|---|
| `src/app/globals.css` (tokens) | **No** — wrong reference family (cold grey + cobalt + sharp corners + 112px type). Replaced by cal.com-audited tokens |
| `docs/design-system.md`, `docs/reference-audit.md`, `docs/reference-audit-data.json` | No — audit of the wrong reference site; superseded by new cal.com audit |
| `package.json` | Partially — same stack (Next 16.2.10, React 19, Tailwind v4, motion, Playwright, Vitest); new build keeps versions, drops unused deps as needed |
| `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` | Yes — config shapes carried forward |
| `scripts/*.mjs` (visual-qa, self-check, a11y-smoke, reference-audit, section-check) | Patterns reusable; rewritten for new routes/tokens |

## Docs / assets

- `site/README.md`, `site/AGENTS.md`, `site/CLAUDE.md` — superseded by new root README.
- `public/*.svg` — stock Next.js boilerplate assets; discard.
- `docs/reference-screens/*.png` (32 shots) — screenshots of the wrong reference; retained in archive only.
- `docs/self-check/*.png`, `visual-baselines/*.png` + `report.json` — old baselines; new baselines regenerated per brief §14.

## Exact git commands run

```powershell
git log --oneline -20 ; git status --short ; git branch --show-current
git log --oneline --diff-filter=A -- site/          # -> 420cf7c
git ls-files site                                    # 164 tracked files
robocopy site .archive/site-20260721-215804 /E /XD node_modules .next
# SHA-256 manifest compare: 166 files, CHECKSUMS MATCH
tar -czf %TEMP%\opencode\site-archive-20260721-215804.tar.gz -C .archive site-20260721-215804
git revert --no-edit 420cf7c                         # see below
```
