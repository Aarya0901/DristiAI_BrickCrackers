# VIGIL SeatGraph — Final Merged Proposal & Implementation Plan

**Status:** Analysis + canonical plan. No code written.
**Inputs analysed:** `Drishti AI (fable 5 max).md` (Fable / "VIGIL") and `Drishti AI (gpt 5.6 sol).md` (Sol / "Invigilens SeatGraph").
**Confirmation:** Both files were read completely (Fable = 721 lines, Sol = 775 lines).

---

## 0. Assumptions about compulsory requirements (READ FIRST)

> The "compulsory requirements" block in the request arrived **empty** (template placeholders: `[OPTIONAL: TECH_STACK, BUDGET, DEADLINE, ...]`). To avoid inventing requirements, I am treating the following as compulsory, because **both** proposals treat them as the non-negotiable problem statement. **If any of these is wrong, correct it and I will re-trace.**

**Assumed compulsory set (the 20 mandatory objectives, common to both files):**
1. Multi-student detection & tracking from live video
2. Pose landmark extraction
3. Body posture analysis
4. Head-orientation analysis
5. Hand & wrist movement analysis
6. Repeated sideward glances
7. Excessive head turning
8. Body rotation toward neighbours
9. Unusual/repeated hand movements
10. Non-verbal communication candidates
11. Mobile phone detection
12. Chit / unauthorized paper (where feasible)
13. Other unwanted objects (where feasible)
14. Real-time explainable alerts
15. Seat-wise behavioural timelines
16. Event logging for review
17. Multi-person tracking
18. Privacy-conscious operation
19. No identity-based accusation
20. Human review before interpretation

**Unresolved questions that materially affect the plan** (marked as assumptions where I had to proceed):
- **Context = hackathon or production?** Both files are written primarily as *hackathon* dossiers (48–72 h) with production roadmaps attached. I assume **hackathon MVP first, production path second**. (Assumption)
- **Budget / team size / deadline:** not provided. I assume a **small team (3–5), consumer NVIDIA GPU, ~72 h MVP then 2–6 week hardening**. (Assumption)
- **Hosting:** both mandate **local/on-prem inference** (DPDP + latency). I adopt this as fixed.

---

# STEP 1 — Extract & Normalize Both Proposals

Both proposals describe the **same product**. They agree on ~90% of substance and differ mainly in vocabulary, model-vendor preference, and citation rigor. Normalized side by side:

| Dimension | Fable ("VIGIL") | Sol ("Invigilens SeatGraph") | Normalized common name |
|---|---|---|---|
| Core product idea | Seat-anchored, skeleton-first behaviour-intelligence layer on exam CCTV | Privacy-first, seat-aware behavioural intelligence on exam CCTV | **Seat-aware exam-hall behaviour assistant** |
| Target users | Chief invigilator / centre superintendent / control room | Invigilators, exam controllers, university admins | **Invigilators + exam-cell staff** |
| Primary problem | One invigilator can't watch 30–60 students; CCTV walls move the same bottleneck | Human invigilation misses subtle, repeated, relational, short-duration patterns | **Attention bottleneck across many seated students** |
| Proposed solution | Detect→pose→track+seat-anchor→head/hand→rule events→seat-graph→fusion+abstention→explainable cards | Same pipeline, OpenMMLab-centric, seat graph + calibration + abstention | **Modular CV pipeline → seat-graph evidence → explainable review cards** |
| Main journeys | Setup seat map → live monitor → review/dismiss alert → replay → export report | Register camera → seat map → live overlays → review/accept/dismiss/note → replay | **Setup → monitor → review → replay → report** |
| Mandatory features | 20 objectives (§3 coverage map) | 20 objectives (provenance matrix) | Identical (see §0) |
| Optional features | Anomaly head (MIL), learned temporal (ST-GCN/PoseC3D), multi-camera, GNN, digital twin, chains | TCN, graph transformer, OOD head, multi-camera, drift, chains | **Learned temporal + relational upgrades (post-MVP)** |
| Detection model | **YOLO11-s** (AGPL flagged) / RT-DETR backup | **RTMDet-s/m** (Apache) / YOLO11 backup | Person detector (license-sensitive choice) |
| Pose model | **RTMPose-m** (rtmlib/ONNX), RTMO-l for crowds | **RTMPose-m / RTMW-m** whole-body | RTMPose-m (agreed) |
| Tracker | **ByteTrack + custom Seat-Anchor** / BoT-SORT, OC-SORT | **ByteTrack** / Deep-OC-SORT | ByteTrack + seat anchoring (agreed) |
| Head orientation | keypoint-yaw all tiers + 6DRepNet Tier A | 6DRepNet gated by face quality + torso fallback | Coarse L/C/R + face-based only when big enough |
| Backend | **FastAPI + WebSocket + SQLite** | **FastAPI-style + WS + SQLite/PostgreSQL** | FastAPI + WS + SQLite (agreed) |
| Frontend | React dashboard (seat map, queue, timeline, skeleton toggle) | Same | React dashboard (agreed) |
| Data requirement | **Own recorded, consented, event-annotated dataset = the moat** | Same conclusion (custom dataset mandatory) | **Custom consented dataset (mandatory)** |
| Integrations | RTSP/USB camera; no cloud; optional Redis pub/sub at competition scale | RTSP/CCTV; optional central server; no cloud-first | Camera ingest; local-only; optional central aggregation |
| AI/automation | Pretrained det/pose/track + rule engine + optional learned heads | Same, with heavier OpenMMLab/TCN emphasis | Hybrid rules + pretrained models + light learned heads |
| Security/privacy | No FR, anonymous seat IDs, skeleton-first, transient face-crop yaw, 30-day retention, deletion API, DPDP mapping | Same posture, +RBAC, audit log, retention tiers, DPDP | **No FR, anonymity, skeleton-first, retention limits, DPDP alignment** |
| Monetization | Not the focus (hackathon); moat = benchmark + judgment layer | Not the focus; hints at institutional productization | **Not defined — gap in both** |
| Deployment | 3 sizes: MVP single-node → per-camera workers → per-room edge | MVP single-node → competition → multi-camera edge | Single-node MVP → edge per-room |
| Headline metric | **False alerts per student-hour** | **False alerts per student-hour** | Agreed headline metric |

### Assumptions each proposal makes (normalized)
- Fixed CCTV, 2.2–3.0 m height, front/diagonal angle; 20–60 (Fable) / 20–100 (Sol) students; 720p–1080p; seated writing; local compute.
- Fine eye-gaze from far CCTV is **not** reliable → use coarse head/torso direction. (Both agree.)
- Tiny chit/earbud detection is at/below the pixel floor → reframe honestly. (Both agree; Fable shows explicit pixel arithmetic.)

### Missing details / gaps (in both)
- **No business model / pricing / go-to-market** beyond "moat." (Both)
- **No concrete consent + DPIA legal artifacts** (templates mentioned, not provided). (Both)
- **No measured accuracy** — by design, because no public hall dataset exists. (Both, honest)
- **Multi-camera fusion under-specified** (deferred). (Both)

### Internal contradictions / tensions
- **Fable:** picks **YOLO11-s** (AGPL-3.0) for detection while positioning for institutional deployment — an AGPL license risk it flags but does not resolve.
- **Sol:** claims "no single dataset is sufficient" yet lists ~20 datasets, risking scope sprawl and license ambiguity if used carelessly (it flags this too).
- **Both:** promise ≤5 s / real-time on a single GPU while also processing person-count-heavy pose — feasible only with RTMO or capped FPS/stream count; must be measured, not asserted.

### Major risks (both agree)
No measured accuracy until data recorded · far-field head-pose unreliable · chit over-claim temptation · threshold brittleness across rooms · demo-day fragility · privacy backlash · alert fatigue.

**Normalization verdict:** These are **not two competing products** — they are two drafts of one product. The real task is choosing the stronger *engineering + evidentiary spine* and merging the best specifics.

---

# STEP 2 — Side-by-Side Comparison & Scoring

Scores are 1–10, evidence-based, and reflect the *quality of the proposal as an implementation foundation* (not the product's eventual value).

| # | Category | Fable | Sol | Evidence / reasoning |
|---|---|---:|---:|---|
| 1 | Clarity of problem | 9 | 9 | Both articulate the attention-bottleneck crisply; identical framing. |
| 2 | User value | 9 | 9 | Same value prop (relational, explainable, privacy-first). |
| 3 | Product differentiation | 9 | 8 | Both centre the seat-graph; Fable adds **counterfactual cards** as a sharper, demoable wedge. |
| 4 | UX completeness | 8 | 9 | Sol gives fuller alert-template language, explicit accept/dismiss/notes + audit; Fable's dashboard is strong but slightly terser. |
| 5 | Technical feasibility | 9 | 8 | Both feasible; Fable's `rtmlib`/ONNX entry point is lighter-weight than Sol's full OpenMMLab stack for 72 h. |
| 6 | Development complexity | 8 | 7 | Sol's OpenMMLab + more datasets + TCN/GNN raises setup burden; Fable defers learned models more aggressively. |
| 7 | Expected implementation time | 8 | 7 | Fable's hour-by-hour 72 h table is more execution-ready; Sol's is ordered but coarser. |
| 8 | Infra & operating cost | 9 | 9 | Both local-only, consumer GPU; Sol gives concrete India GPU price bands. |
| 9 | Security & privacy | 9 | 9 | Both no-FR, skeleton-first, DPDP-mapped; Sol adds explicit RBAC + audit_log table. |
| 10 | Scalability | 7 | 8 | Sol's Postgres option + camera register API scale slightly cleaner; Fable's Redis pub/sub path is fine but terser. |
| 11 | Maintainability | 8 | 7 | Fable's "commodity models, proprietary judgment layer" keeps surface small; Sol's larger stack = more to maintain. |
| 12 | Integration difficulty | 8 | 8 | Both RTSP-first, local; comparable. |
| 13 | Testing complexity | 9 | 8 | Fable's ablation matrix (−seat-anchor, −baseline, −pair, −abstention) is more decision-oriented; both strong. |
| 14 | Commercial viability | 6 | 6 | Both weak on monetization/GTM; tie. |
| 15 | Long-term extensibility | 8 | 9 | Sol's explicit model I/O contracts + schema make extension cleaner. |
| 16 | Risk of overengineering | 8 | 6 | **Fable more disciplined**: rules-first, learned models deferred, explicit "ship silently / defer." Sol lists more optional ML (TCN, GNN, OOD head, ~20 datasets) that invite scope creep. |
| — | **Total (of 160)** | **131** | **125** | Fable edges ahead on execution-readiness & overengineering discipline; Sol edges ahead on schema/UX polish. |

### Feature-set diff (normalized)

**Common to both:** detection, pose, ByteTrack+seat anchoring, head/torso direction, wrist/hand analysis, phone detection, chit-where-feasible, seat-aware behaviour graph (flagship), personal baseline calibration, uncertainty-aware abstention, skeleton-only replay, explainable non-accusatory alerts, seat timelines, event logging, human review, no facial recognition, DPDP posture, false-alerts/student-hour metric, custom consented dataset.

**Unique to Fable:** **Counterfactual alert cards** (the "what would NOT have triggered this" — its sharpest differentiator); explicit **pixel-math feasibility tiers (A/B/C)** per seat; `rtmlib` lightweight entry point; 15 concrete alert templates tied to engine state; live threshold sliders as a demo weapon; hard-negative feedback loop feeding weekly re-tune; adversarial 7-persona review.

**Unique to Sol:** Concrete **model I/O JSON contracts**; fuller **SQL schema** (cameras/seats/tracks/events/notes/audit_log); explicit **RBAC + audit log**; **retention tiers** (metadata / short RGB / skeleton-longest); concrete **India GPU price bands**; broader dataset catalog (FPI-Det, PoseTrack21, VisDrone, ExDark, Objects365); patent citations (US9154748B2, EP1987505A2, KR101765770B1).

**Conflicting recommendations:**
- **Detector:** Fable → YOLO11-s (AGPL, fast setup); Sol → RTMDet-s (Apache, cleaner license). **Resolve toward Apache** for institutional deployment (see §6).
- **Pose:** Fable → RTMPose-m body; Sol → RTMPose-m *whole-body* / RTMW. **Resolve to body RTMPose-m for MVP** (whole-body wrist detail is marginal at hall range and slower).
- **Tracker upgrade:** Fable → OC-SORT; Sol → Deep-OC-SORT. Minor; defer either to post-MVP.
- **DB:** Fable → SQLite only; Sol → SQLite/PostgreSQL. **SQLite MVP, Postgres for production.**

**Same problem solved differently:** head orientation (Fable keypoint-yaw-everywhere + 6DRepNet Tier A; Sol 6DRepNet-gated + torso fallback) — these are compatible and should be **merged** (keypoint yaw always, 6DRepNet when face is large enough, torso as corroboration).

**Strong ideas to preserve:** seat-graph + counterfactual cards (Fable), pixel-tier honesty (Fable), abstention (both), personal calibration (both), model I/O contracts + audit/RBAC schema (Sol), retention tiers (Sol), Apache-first licensing (Sol).

**Weak ideas to remove/defer:** eye-gaze as primary signal (both reject — keep rejected), long-range chit/earbud claims (reject), emotion recognition (reject), permanent cheating score (reject), end-to-end cheating classifier (reject), full GNN/interaction transformer for MVP (defer), digital-twin geometry beyond seat polygons (defer), ~20-dataset training program (trim to the few that matter).

**Valuable but postpone:** MIL anomaly head, learned temporal (TCN/ST-GCN/PoseC3D), conformal calibration, multi-camera fusion, drift monitoring, interaction-chain detection.

---

# STEP 3 — Feature Review Table

Recommendation categories: **Must Have (M)** = MVP core, **Should Have (S)** = MVP if time / V1, **Could Have (C)** = V1+, **Future (F)**, **Reject (R)**. Compulsory features flagged **[C#]** by objective number from §0.

| Feature | Source | User value | Tech feasibility | Business viability | Complexity | Dependencies | Risks | Recommendation | Reason |
|---|---|---:|---:|---:|---:|---|---|---|---|
| Multi-person detection **[C1,C17]** | Both | High | High | High | Low | Camera ingest | Small-person recall at Tier C | **Must** | Foundation; pretrained works day 1 |
| Pose landmark extraction **[C2]** | Both | High | High | High | Low | Detector | Wrist jitter far-field | **Must** | RTMPose-m proven real-time |
| ByteTrack + Seat-Anchor **[C1,C17]** | Both (Fable names anchor) | High | High | High | Med | Pose, seat polygons | Homography setup friction | **Must** | Seat anchor structurally kills ID switches |
| Seat-polygon setup UI | Both | Med | High | High | Low | Frontend | Manual per-hall setup | **Must** | Enables anonymity + relational logic |
| Posture analysis **[C3]** | Both | Med | High | Med | Low | Pose | Confounders (stretch) | **Must** | Cheap rule on keypoints |
| Head orientation (coarse L/C/R) **[C4,C6,C7]** | Both | High | High | High | Med | Pose | Far-field unreliability | **Must** | Merge keypoint-yaw + torso fallback |
| 6DRepNet face-crop yaw (Tier A) **[C4]** | Both | Med | High | High | Low | Face crop ≥40px | Tier A only | **Should** | Degree-level angle for front rows; transient, nothing stored |
| Hand/wrist analysis **[C5,C9]** | Both | High | High | Med | Med | Pose, desk zones | Finger detail absent | **Must** | Wrist trajectories + zone dwell |
| Torso rotation to neighbour **[C8]** | Both | High | High | Med | Low | Pose, seat geom | N4 posture confounder | **Must** | Strong corroborating cue |
| Non-verbal / relational candidates **[C10]** | Both | High | Med | High | Med | Seat graph | Data-light thresholds | **Must** (rule-based) | Core differentiation; rules first |
| **Seat-Aware Behaviour Graph (flagship)** | Both | Very High | Med | High | Med-High | Events, tracking | Needs 2-person scripted data | **Must** | The wedge vs all competitors |
| **Counterfactual alert cards** | Fable | Very High | High | High | Low | Rule engine exposing thresholds | Template↔math sync | **Must** | Nearly free once rules expose state; biggest demo "wow" |
| Personal baseline calibration | Both | High | Med | High | Med | Events, first 8–10 min | Cold-start, drift | **Should** | Named as *future work* in 2025 lit → closes a real gap; cuts FPs |
| Uncertainty-aware abstention + visibility tiers | Both | High | High | High | Low | Pose conf, occlusion | Crude v1 | **Must** | Honesty; converts weakness into trust |
| Phone detection **[C11]** | Both | High | Med | High | Med | Object detector, SCB/FPI-Det | Small-object range | **Must** | High-value alert; fine-tune + temporal confirm |
| Chit / paper (where feasible, Tier A) **[C12]** | Both | Med | Low-Med | Med | Med | Object detector, hand crops | Below pixel floor beyond ~4 m | **Should** (honesty-framed) | Reframe as hand-behaviour + close-range candidate; never over-claim |
| Other unwanted objects **[C13]** | Both | Low-Med | Low-Med | Med | Med | Object detector | Open-set noise | **Could** | Closed-set + review queue only |
| Explainable non-accusatory alerts **[C14,C19]** | Both | Very High | High | High | Low | Event engine | Language discipline | **Must** | Whitelist/blacklist language; 14-question cards |
| Seat-wise timelines **[C15]** | Both | High | High | High | Low | Events DB | — | **Must** | Direct objective |
| Event logging **[C16]** | Both | High | High | High | Low | DB | — | **Must** | Direct objective |
| Human review workflow (accept/dismiss/note) **[C20]** | Both | High | High | High | Low | Dashboard, DB | — | **Must** | Mandatory gate; feeds hard negatives |
| Skeleton-only privacy replay | Both | Med | High | Very High | Low | Pose store | "Where's RGB proof?" | **Should** | Privacy wow; keep short RGB event clip alongside |
| Hard-negative feedback loop | Fable | High | High | High | Low | Dismiss events | — | **Should** | Turns dismissals into threshold learning |
| RBAC + audit log | Sol | Med | High | High | Low | Backend | — | **Should** | Needed for real deployment + DPDP |
| Retention tiers + deletion API | Sol/Fable | Med | High | High | Low | Storage | — | **Should** | DPDP alignment |
| Model I/O contracts + typed schema | Sol | Med | High | High | Low | — | — | **Should** | Cleaner integration/testing |
| Live threshold sliders | Fable | Med | High | Med | Low | Fusion | Confusing if unlabeled | **Could** | Powerful demo device |
| Custom consented dataset + FP/student-hr benchmark | Both | Very High | Med | High | Med | Volunteers, annotation | Time pressure | **Must** | The moat + only credible accuracy source |
| MIL weakly-supervised anomaly head | Both | Med | Med | Med | Med | Recorded data | Noisy weak labels | **Future** | Competition-phase recall booster |
| Learned temporal (TCN / ST-GCN / PoseC3D) | Both | Med | Med | Med | Med-High | Labeled windows | Data-starved in 72 h | **Future** | Upgrade after rules proven |
| Pairwise GNN / interaction transformer | Both | Med | Low(72h) | Med | High | Lots of annotations | Data starvation | **Future** | Rules cover MVP; GNN is V2 |
| Interaction-chain detection | Both | High | Low(72h) | Med | High | Rare-event data | Starvation | **Future** | 3-step chain demo only if time |
| Multi-camera fusion | Both | Med | Low(72h) | High | High | Multi-cam calib | Complexity | **Future** | Production roadmap |
| Digital-twin geometry (beyond seat polygons) | Both | Low | Med | Low | High | Homography | Overbuild | **Future** | MVP needs only polygons + row tiers |
| Facial recognition / identity | (excluded) | Neg | — | Neg | — | — | DPDP + accusation hazard | **Reject** | Zero detection value; legal risk |
| Eye-gaze as primary signal | (excluded) | Neg | Low | — | — | — | Physically unrecoverable at range | **Reject** | Pixel physics; both reject |
| Long-range chit / earbud detection | (excluded) | Neg | Very Low | — | — | — | Below pixel floor | **Reject** | Honesty; would be destroyed in Q&A |
| Audio analysis | (excluded) | Low | Med | Low | Med | Mic | Privacy surface | **Reject (MVP)** | Scope + privacy; revisit with counsel |
| Emotion recognition | (excluded) | Neg | Low | Neg | — | — | Pseudo-scientific, bias | **Reject** | Not defensible |
| Permanent per-student "cheating score" | (excluded) | Neg | High | Neg | Low | — | Accusation by another name | **Reject** | Violates no-accusation objective |
| End-to-end cheating/not-cheating classifier | (excluded) | Neg | Med | Neg | Med | — | Unexplainable, unfair | **Reject** | Kills explainability + fairness |
| Cloud video upload | (excluded) | Neg | High | Neg | Med | Network | DPDP data-flow surface | **Reject** | Local-only mandate |

---

# STEP 4 — Strongest Foundation

**Decision: Fable ("VIGIL") is the primary foundation, hardened with Sol's engineering artifacts. The final product is a hybrid but Fable-led.**

**Product reasoning.** Both products are identical at the concept level, but Fable owns the single sharpest, cheapest, highest-impact differentiator: the **counterfactual alert card** ("a single 1.2 s glance would not have triggered this"). This is what makes the system read as *intelligent and fair* rather than as an alarm generator, and it is nearly free once the rule engine exposes its own thresholds. Fable also enforces **pixel-math feasibility tiers**, which is the honesty posture that wins judge trust and prevents the single biggest failure mode (chit over-claim).

**Technical reasoning.** Fable is more **execution-ready** (hour-by-hour 72 h plan, `rtmlib`/ONNX lightweight entry, aggressive deferral of learned models, explicit ablation matrix) and scores higher on **overengineering discipline**. Sol's OpenMMLab-heavy stack + TCN/GNN + ~20-dataset program is more likely to consume the 72 h budget on environment setup and training that cannot pay off without data.

**Business reasoning.** Sol contributes the artifacts that make the thing *deployable*: **model I/O contracts, full SQL schema, RBAC + audit log, retention tiers, and Apache-first licensing**. Adopting Sol's Apache-oriented detector (**RTMDet-s over YOLO11-s AGPL**) removes a real commercialization blocker Fable flagged but never resolved.

**Why not "Sol primary":** Sol is excellent as a reference spec but invites scope creep and defers less; its execution timeline is coarser.

**Why not "neither / full redesign":** Unnecessary. The two agree so completely that a redesign would discard proven, converged decisions and burn time.

**Net:** **Fable's spine + judgment layer + counterfactuals + tiers, wearing Sol's schema/contracts/RBAC/retention clothing, on an Apache-licensed model stack.**

---

# STEP 5 — Final Merged Proposal (Canonical Definition)

## 5.1 Product definition
- **Working name:** **VIGIL SeatGraph** (Vision-based Invigilation with Graph Intelligence + expLainability).
- **One-sentence description:** A privacy-first AI layer for ordinary exam-hall CCTV that anonymously tracks seats, detects individual and pairwise suspicious behaviour patterns, and hands invigilators explainable, counterfactual review cards — never accusations.
- **Problem statement:** A single invigilator cannot continuously observe 30–60 seated students, and raw CCTV walls merely relocate the same impossible attention task to a control room; subtle, repeated, and relational misconduct goes unseen while honest behaviour risks false accusation.
- **Target users:** Chief invigilator / centre superintendent (primary); exam-cell control room and university administrators (secondary).
- **Primary value proposition:** Turns existing CCTV into an explainable assistant that surfaces *review-worthy* behaviour with evidence, confidence, and visibility — reducing both missed misconduct and false accusations.
- **Key differentiators:** (1) Seat-anchored anonymous tracking; (2) relational **seat-graph** pairwise evidence; (3) **counterfactual** explanations; (4) **visibility-aware abstention**; (5) privacy-by-architecture (no facial recognition).
- **Intended platforms:** On-prem/edge workstation (Windows/Linux) + browser dashboard (React). No cloud video.
- **Success criteria (measured on own data before any claim):** low **false alerts per student-hour**; high event-level recall on scripted events; correct seat-attribution; graceful abstention on occluded/low-light frames; 100% of alerts fully explained (14-question cards); zero facial-recognition dependency.

## 5.2 Scope

**Compulsory (traced to §0):** objectives 1–20 — all retained (none technically impossible). Objective 12 (chit) is retained **but honesty-scoped to Tier A close-range only**, with explicit abstention beyond the pixel floor; this is the closest practical realization and is stated plainly.

**MVP features (48–72 h):** ingest + frame sampler; person detection; RTMPose-m; ByteTrack + seat-anchor; seat-polygon UI; keypoint head-yaw + torso fallback (+6DRepNet Tier A if time); wrist zones; rule event engine (B1–B6 glance/turn/rotation/hand); seat-graph pair correlator (C1–C4); counterfactual cards; personal baseline calibration; visibility score + abstention; phone detector (fine-tune + temporal confirm); FastAPI + WS + SQLite; React dashboard (seat map, alert queue, timeline, skeleton toggle, accept/dismiss/note); skeleton replay; **record mini-benchmark + measure FP/student-hour**; backup demo video.

**V1 features (2–6 weeks):** full custom dataset; detector/pose spot fine-tunes; hard-negative loop round 1; RBAC + audit log; retention tiers + deletion API; per-room calibration wizard; chit Tier-A candidate module (honesty-framed); OOD/abstention calibration; three-tier eval (controlled/difficult/OOD) + ablations + fairness slices; model cards.

**Future features:** MIL anomaly head; learned temporal (TCN/ST-GCN/PoseC3D); pairwise GNN / interaction transformer; interaction chains; multi-camera fusion; drift monitoring + retraining workflow; SIEM/audit integration; security hardening + pen test; DPIA with counsel; pilot MoU.

**Explicitly rejected:** facial recognition/identity; eye-gaze as primary signal; long-range chit/earbud detection; audio analysis (MVP); emotion recognition; permanent per-student cheating score; end-to-end cheating classifier; cloud video upload.

*Why these categories:* MVP = everything needed for a complete, honest, demoable vertical slice with a measured headline number. V1 = what makes it deployable and defensible to expert judges/institutions. Future = value that needs data volume or scale we won't have at MVP. Rejected = negative user value, legal/ethical hazard, or physical impossibility.

## 5.3 End-to-end user journeys

**User type A — Chief invigilator (operator):**
- **Entry point:** Opens dashboard on the room workstation before exam start.
- **Onboarding/setup:** One-time per hall — draws seat polygons on a still frame; system assigns anonymous seat IDs and per-seat visibility tier (A/B/C). Camera health check runs.
- **Core action:** Starts session; watches live seat map (green/observing/alert/unobservable) and severity-sorted alert queue.
- **Data processing:** Pipeline runs locally: detect→pose→track+seat-anchor→head/hand→rule events→seat-graph→fusion+abstention→card. Raw frames never persisted; 60 s RAM buffer only.
- **Results/outputs:** On threshold crossing, a review card appears with the 14 answers + counterfactual + short clip/skeleton replay.
- **Notifications:** WebSocket push to queue; severity ladder (silent-log → low → medium → high-review-request → unobservable).
- **Error/recovery:** Camera drop → "monitoring degraded" banner, local buffer, auto-resume. Occlusion → seat greys to "visibility insufficient" (never "suspicious"). Track uncertainty → events quarantined pending review.
- **Account management:** RBAC roles (invigilator / controller / admin); login; per-view audit log.
- **Support/feedback:** Dismiss with reason → hard-negative store; notes field per event.
- **Exit/deletion:** End session → generate session report (PDF). Deletion API purges clips/events per retention policy; per-student accommodation flag excludes a seat or relaxes thresholds (logged).

**User type B — Exam controller (reviewer/admin):**
- **Entry:** Central console (optional aggregation server).
- **Core action:** Reviews accepted alerts across halls; filters by seat/type/severity; reads timelines.
- **Outputs:** Session analytics (alerts/hr, dismiss rate, blind-spot heat map). **No permanent per-student score anywhere** — only event history with uncertainty.
- **Deletion/compliance:** Enforces retention windows; exports audit log; initiates DPIA artifacts.

**User type C — Monitored student (data subject, indirect):**
- **Entry/consent:** Institution posts exam notice + consent (institution is Data Fiduciary).
- **Processing:** Represented only as an anonymous seat ID; no face embedding, no name.
- **Recovery/appeal:** Every alert is reviewable evidence, never a verdict; appeals path via human review; accommodation flag available.

## 5.4 Functional requirements (per approved feature)

> Format per feature: **What user can do / What system must do / Inputs / Outputs / Validations / Failure conditions / Roles / Dependencies.**

**FR-1 Camera ingest & sampling** — User: register a camera (RTSP/USB). System: decode and sample 10–15 FPS. Inputs: stream URL/device. Outputs: frame stream. Validations: resolution ≥720p, FPS in range. Failure: on drop, buffer + degraded banner. Roles: admin. Deps: none.

**FR-2 Seat map setup** — User: draw seat polygons on a still frame. System: store polygons, assign anonymous IDs, compute per-seat visibility tier. Inputs: click points. Outputs: seat map + tiers. Validations: non-overlapping polygons, ≥1 seat. Failure: reject overlaps. Roles: admin. Deps: FR-1.

**FR-3 Detection + pose + tracking** — System: detect persons, estimate pose, track with ByteTrack, anchor tracks to seats. Inputs: frames, seat map. Outputs: per-seat track with keypoints. Validations: track→seat mapping confidence. Failure: quarantine events on identity uncertainty. Roles: system. Deps: FR-1/2.

**FR-4 Head/torso orientation** — System: compute coarse L/C/R yaw (all tiers) + torso rotation; refine with 6DRepNet where face ≥40 px. Inputs: keypoints, face crops. Outputs: direction stream + tier label. Validations: keypoint confidence gate. Failure: abstain (Tier C head direction). Roles: system. Deps: FR-3.

**FR-5 Hand/wrist analysis** — System: track wrist trajectories vs desk/lap/pocket zones. Inputs: keypoints, zone config. Outputs: hand-event candidates. Validations: zone calibration. Failure: abstain if wrists occluded. Roles: system. Deps: FR-3.

**FR-6 Rule event engine (B1–B6)** — System: emit candidate behaviour events using duration/repetition/baseline/geometry gates + hysteresis + cooldown. Inputs: direction/hand streams, baselines. Outputs: typed events. Validations: geometry whitelists (clock, invigilator, door). Failure: none fired if below threshold (logged). Roles: system. Deps: FR-4/5.

**FR-7 Seat-graph pair correlator (C1–C4)** — System: build directed time-decayed edges (glance_toward, responds, reciprocal, handoff_candidate); fire relational events on fused thresholds. Inputs: per-seat events + seat adjacency. Outputs: pair events. Validations: target-seat occupancy, session gate. Failure: no pair without both seats visible. Roles: system. Deps: FR-6.

**FR-8 Object detection (phone; chit Tier-A)** — System: run fine-tuned detector on frames + hand crops with N-of-M temporal confirmation. Inputs: crops. Outputs: object candidates + confidence. Validations: min confirmations. Failure: below floor → abstain / "uncertain". Roles: system. Deps: FR-3.

**FR-9 Evidence fusion + abstention** — System: combine signals into a score → severity ladder; abstain when visibility < tier-min. Inputs: all event signals + visibility. Outputs: severity-classified alert or "unobservable". Validations: hysteresis (enter θ_hi, exit θ_lo). Failure: never label "suspicious" under low visibility. Roles: system. Deps: FR-6/7/8.

**FR-10 Counterfactual card generator** — System: render 14 answers + "what would NOT have triggered this" from engine state (no free-text generation of numbers). Inputs: event state. Outputs: alert card. Validations: template↔math consistency check. Failure: if state incomplete, mark card "partial — review". Roles: system. Deps: FR-9.

**FR-11 Personal baseline calibration** — System: compute per-seat robust stats (median/P95) over first 8–10 min, drift-updated. Inputs: event history. Outputs: baseline thresholds. Validations: cold-start guard (use population prior until warm). Failure: fall back to population thresholds. Roles: system. Deps: FR-6.

**FR-12 Dashboard + review workflow** — User: view seat map/queue/timeline, toggle skeleton, accept/dismiss(reason)/note, replay. System: push alerts via WS, persist actions. Inputs: user actions. Outputs: updated states + hard-negative log. Validations: RBAC. Failure: offline mode shows last state. Roles: invigilator/controller/admin. Deps: FR-9/10.

**FR-13 Logging, retention, deletion** — System: store events/alerts/feedback + short encrypted clips + skeleton JSON; enforce retention tiers; expose deletion API + audit log. Inputs: retention config. Outputs: audited store. Validations: encryption at rest, TLS. Failure: block writes if storage/crypto unavailable. Roles: admin. Deps: FR-12.

**FR-14 Benchmark harness** — User: run eval on recorded data. System: compute FP/student-hour, event P/R/F1, seat-attribution, abstention %, latency, FPS. Inputs: annotated sessions + splits. Outputs: metrics report. Validations: no tuning on test split. Failure: refuse to report a number not measured. Roles: admin. Deps: all.

## 5.5 Non-functional requirements
- **Performance:** ≥10 processed FPS/stream on a consumer GPU (≥6 GB); alert latency ≤5 s from behaviour completion (**target — measure**).
- **Reliability/availability:** graceful degradation on camera/GPU loss; watchdog + camera heartbeat; local buffer + store-and-forward.
- **Scalability:** ~2–4 streams/consumer GPU; scale by adding per-room nodes; central server aggregates events only.
- **Accessibility:** dashboard WCAG-aware (keyboard nav, colour-blind-safe seat states, text alternatives to colour).
- **Security:** TLS in transit, AES at rest for clips; RBAC; secret management via env/OS keystore; rate limiting on APIs.
- **Privacy:** no facial recognition/identity; anonymous seat IDs; transient face-crop yaw (no embeddings stored); consent handled by institution.
- **Logging/monitoring:** structured event logs; audit log of every view/action; pipeline health metrics (FPS, GPU, RAM, camera status).
- **Backup/recovery:** event DB + config backups; deletion API tested; retention windows enforced.
- **Maintainability:** commodity models behind adapters; typed model I/O contracts; small proprietary "judgment layer."
- **Testing:** unit (rules), integration (pipeline), scenario tiers (T1/T2/T3), ablations, fairness slices.
- **Compliance:** DPDP Act 2023 + Rules 2025 alignment (engineering, not legal advice); DPIA before real deployment.

## 5.6 Recommended technical architecture

| Layer | Recommended | Reason | Alternative | Trade-off |
|---|---|---|---|---|
| Frontend | **React + WebSocket** (seat map, queue, timeline, skeleton canvas) | Rich real-time UX; matches both proposals | Svelte/Vue | React has largest ecosystem; minor bundle size |
| Backend | **FastAPI (Python) + WebSocket** | Same language as CV stack; async; zero-ops | Node.js | Python keeps one runtime with models |
| Database | **SQLite (MVP) → PostgreSQL (prod)** | Zero-ops start; clean scale path | Postgres from day 1 | SQLite simpler but single-node |
| Auth | **Session/JWT + RBAC** (invigilator/controller/admin) | Deployment need; Sol's schema | OAuth/SSO (institution) | Add SSO in production |
| Object/file storage | **Local encrypted disk** (event clips + skeleton JSON) | DPDP local-only; low cost | MinIO/S3-compatible on-prem | Cloud rejected for raw video |
| APIs | **REST + WS** (§5.9) | Simple, typed contracts (Sol) | gRPC | REST easier for hackathon/demo |
| Background jobs | **In-process async workers (MVP) → per-camera worker + Redis pub/sub (prod)** | Avoids premature microservices | Celery | Keep single-node until measured need |
| Person detection | **RTMDet-s (Apache-2.0)** | License-clean for institutions (resolves Fable's AGPL risk) | YOLO11-s (fast but AGPL), RT-DETR-R18 | RTMDet setup slightly heavier than Ultralytics |
| Pose | **RTMPose-m via rtmlib/ONNX** | Real-time CPU/GPU; lightweight entry (Fable) | RTMO-l (>25 people), RTMW (whole-body later) | Body-only wrist detail is coarse |
| Tracking | **ByteTrack + custom Seat-Anchor** | Motion-only suits uniforms; anchor kills ID switches | BoT-SORT / Deep-OC-SORT | One-time seat-polygon setup |
| Head pose | **keypoint-yaw (all) + 6DRepNet (Tier A) + torso fallback** | Honest tiering; degree-level where physics allows | WHENet | Tier B/C = 3-class only |
| Object detector | **RTMDet-s second stage on crops, phone fine-tuned (SCB/FPI-Det)** | Crop control + Apache | RT-DETR-R18 | Chit class data-hungry |
| Temporal/behaviour | **Rule engine (MVP)** → TCN/ST-GCN (V1+) | Explainable by construction; rules ARE the counterfactuals | End-to-end classifier | Unknown behaviours deferred to anomaly head |
| Relational | **Rule-based seat-graph correlator** → GNN (future) | Novel, explainable, data-light | Actor-transformer GNN | Hand-tuned thresholds initially |
| Search/vector | **None** | Not genuinely required | — | Avoid unnecessary infra |
| Analytics | **Local aggregation (alerts/hr, dismiss rate, heat map)** | Sufficient; no external service | Product analytics SaaS | Privacy + cost |
| Notifications | **WebSocket in-app** | Real-time queue | Email/SMS (prod) | In-app enough for MVP |
| Hosting | **On-prem/edge workstation** | DPDP + latency + reliability | Cloud (rejected for video) | Ops handled locally |
| CI/CD | **GitHub Actions (lint/test/build) + Docker (optional)** | Reproducible; light | Full k8s | Overkill for single-node |
| Monitoring | **Health endpoint + structured logs + camera heartbeat** | Operability | Prometheus/Grafana (prod) | Add in production |
| Security controls | **TLS, AES-at-rest, RBAC, audit log, rate limiting** | DPDP posture | HSM/KMS (prod) | Sufficient for pilot |

**Principle:** simplest architecture that supports requirements. No microservices, no message bus, no vector DB, no cloud, no learned models at MVP unless measured to help.

## 5.7 Data model (conceptual)

| Entity | Purpose | Key fields | Relationships | Ownership | Sensitive? | Retention | Index/search |
|---|---|---|---|---|---|---|---|
| **camera** | Registered stream | camera_id, hall_id, status, last_heartbeat | 1—* seats, events | admin | Low | Config lifetime | by hall_id |
| **seat** | Anonymous seat + geometry | seat_id, camera_id, polygon, neighbours, tier | *—1 camera; referenced by tracks/events | admin | Low (anonymous) | Config lifetime | by (seat_id,camera_id) |
| **track** | Anonymous person↔seat link | track_uid, camera_id, seat_id, t0/t1, avg_visibility, health | *—1 seat | system | Low (no identity) | Session + audit | by seat_id |
| **event** | Detected behaviour | event_id, seat_id, track_id, type, direction, t_start/t_end, repetitions, durations, pair_seat, signals(JSON), confidence, visibility, baseline_dev, severity, state, explanation, counterfactual, clip_ref | *—1 seat; ref pair_seat | system | **Medium** (behavioural) | Retention window | by seat, type, time, severity |
| **alert** | Surfaced review item | alert_id, event_id, severity, state, ts | 1—1 event | system | Medium | Retention window | by severity, state |
| **feedback** | Human decision | alert_id, action, reason, note, reviewer, ts | *—1 alert | reviewer | Low | Audit period | by action |
| **note** | Reviewer annotation | note_id, event_id, reviewer, note, created_at | *—1 event | reviewer | Medium | Audit period | by event_id |
| **audit_log** | Access/action trail | audit_id, actor, action, target_id, created_at | — | admin | Medium | Long (compliance) | by actor, time |
| **clip / skeleton asset** | Evidence replay | asset_id, event_id, type(rgb/skeleton), path(encrypted), created_at | *—1 event | system | **High (RGB)** | RGB shortest; skeleton longest | by event_id |

**Sensitive data:** short RGB event clips (highest), behavioural events (medium). **No** face embeddings, names, or identity linkage anywhere. **Retention tiers:** derived metadata (audit period) · short encrypted RGB clips (only reviewed incidents, shortest) · skeleton-only replay (longest, lowest risk). Raw frames never persisted (60 s RAM buffer).

## 5.8 API & integration plan

**Internal REST/WS (merged from both):**
`POST /cameras/register` · `POST /seatmaps/{camera_id}` · `GET /session` · `GET /seats` · `GET /live/{camera_id}` · `GET /events?camera_id=&seat=&type=&priority=&from=` · `GET /events/{id}` · `POST /events/{id}/accept` · `POST /events/{id}/dismiss` (reason enum → hard-negative store) · `POST /events/{id}/notes` · `GET /replay/{event_id}` · `GET /report/session.pdf` · `GET /health` · `WS /ws/alerts` · `WS /ws/live-overlays`.

**External integrations:**

| Integration | Purpose | Data exchanged | Auth | Failure handling | Cost | Vendor dependency | Fallback |
|---|---|---|---|---|---|---|---|
| RTSP/USB camera | Video ingest | Raw frames (local only) | Camera creds (local) | Buffer + degraded banner + reconnect | Owned hardware | None (standard RTSP) | USB / file input |
| Pretrained model weights (RTMDet/RTMPose/6DRepNet) | Inference | Model files (downloaded once) | None | Vendor pin + local cache | Free (Apache/MIT) | Low (OSS) | Alternate model in stack |
| SCB / FPI-Det datasets | Phone/posture fine-tune | Images/labels (research) | License acceptance | Audit license before use | Free (research) | Low | Own recorded crops |
| (Optional prod) Central aggregation server | Multi-hall dashboard | Events/metadata only (no raw video) | mTLS + RBAC | Store-and-forward on loss | Own hardware | None | Local-only mode |

**No third-party cloud AI, no external analytics, no data leaving premises.**

## 5.9 AI feasibility review

| AI feature | Necessary? | Model / category | Context/data | Prompting/retrieval | Accuracy limits | Hallucination risk | Eval strategy | Privacy | Latency | Cost drivers | Non-AI fallback | Human review |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Person detection | **Yes** | RTMDet-s (CNN detector) | COCO pretrain + hall fine-tune | N/A | Small/distant persons | Low | mAP, small-person AP by tier | Frames local | Low | GPU inference | None viable | Indirect |
| Pose estimation | **Yes** | RTMPose-m | COCO pretrain | N/A | Wrist/face far-field | Low | PCK@0.2 | Local | Low | GPU | None viable | Indirect |
| Tracking | **Yes (algorithmic, not "AI")** | ByteTrack + seat anchor | Detections | N/A | ID switches under occlusion | N/A | HOTA/IDF1/seat-attr | Local | Very low | CPU | Seat-only assignment | Indirect |
| Head pose | **Partly** | 6DRepNet (Tier A) + keypoint geometry | Face crops ≥40 px | N/A | Unreliable far-field | Low | L/C/R accuracy, angular MAE | Transient, no storage | Low | GPU | **Keypoint yaw (deterministic)** | Yes |
| Object (phone/chit) | **Yes** | RTMDet-s fine-tuned + temporal | SCB/FPI-Det + own | N/A | Below pixel floor at range | Medium (false objects) | AP50, event precision, FP/hr | Local | Low | Fine-tune GPU-hrs | Hand-behaviour rules | Yes |
| Behaviour events | **No — use rules** | Deterministic rule engine | Thresholds/baselines | N/A | Threshold brittleness | **None (deterministic)** | Event P/R/F1 | Local | Negligible | None | (Is the fallback) | Yes |
| Relational (seat-graph) | **No — use rules (MVP)** | Rule-based edges | Adjacency + events | N/A | Hand-tuned thresholds | None | Pair event P/R | Local | Low | None | (Is the fallback) | Yes |
| Personal baseline | **No — use statistics** | Robust stats (median/P95) | First 8–10 min | N/A | Cold-start/drift | None | FP reduction ablation | Local | Negligible | None | Population prior | Yes |
| Abstention | **No — use calibrated thresholds** | Visibility score + gates | Keypoint conf/occlusion | N/A | Crude v1 | None | FP on occluded set, ECE | Local | Negligible | None | (Is the safety layer) | Yes |
| Anomaly head (future) | Optional | Weakly-supervised MIL | Recorded sessions | N/A | Noisy weak labels | Low | Frame AUC | Local | Low | GPU-hrs | Rules | Yes |

**Rule of the house (both proposals, adopted):** where deterministic software is more reliable/economical (events, relations, baselines, abstention), **do not use AI**. AI is confined to detection, pose, head-pose, and object recognition — the perception layer only. The **judgment layer is deterministic and explainable**, which is what makes counterfactual cards possible.

## 5.10 Security & privacy review
- **Sensitive information:** short RGB event clips; behavioural event records. No identity data by design.
- **AuthN/AuthZ:** login + RBAC (invigilator / controller / admin); least privilege.
- **Encryption:** TLS in transit; AES at rest for clips/skeleton assets.
- **Secret management:** env vars / OS keystore; no secrets in repo.
- **Abuse cases:** operator misuse (mitigated by audit log + no identity), scope creep to surveillance (mitigated by retention limits + purpose limitation), model gaming.
- **Rate limiting:** on all mutating APIs.
- **Audit logging:** every view/accept/dismiss/note recorded.
- **Data deletion:** deletion API + enforced retention tiers.
- **Consent:** institution posts exam notice + consent (institution = Data Fiduciary); accommodation flag for PwD/medical.
- **Third-party exposure:** none — local-only, no cloud, no external analytics.
- **Top threats & mitigations:** false accusation → language whitelist + human gate + counterfactuals + abstention; privacy backlash → no FR + skeleton-first + retention limits; data breach → encryption + minimal retention + local storage; misidentification → anonymous seats only.
- **Flag for expert review:** DPDP DPIA (legal counsel), dataset license audit (legal), fairness audit (domain expert) — **required before real deployment**.

## 5.11 Feasibility & viability

| Area | Rating | Reasoning | Validation still needed |
|---|---|---|---|
| **Technical** | **High confidence** | All MVP components are pretrained/deterministic and proven in both dossiers; rules-first avoids data starvation | Measure FPS/latency at 40–60 people on target GPU |
| **Operational** | **Moderate confidence** | Local single-node is simple; per-room scale + camera geometry setup add ops burden | Per-room calibration wizard; watchdog behaviour under failure |
| **Financial** | **Moderate confidence** | Cost drivers identified (GPU node per 2–4 cameras, storage MBs–GB/session, zero cloud) but no unit economics | Real GPU throughput → cameras-per-node; storage growth at scale |
| **Market/user** | **Moderate confidence** | Clear demand (UPSC/UP Board deployments prove budget) and a real gap (relational + explainable + private); but no validated buyer/pricing | Interviews with exam controllers; willingness-to-pay |
| **Delivery** | **Moderate–High confidence** | Fable's hour-by-hour plan is realistic for MVP; V1 depends on dataset recording effort | Confirm volunteer availability + annotation capacity |

**Cost/schedule drivers (not invented numbers):** GPU throughput (→ streams/node), pose model choice at high person counts (RTMO vs RTMPose), dataset recording + annotation hours, fine-tune GPU-hours, per-room calibration effort, DPIA/legal review time.

## 5.12 Risk register

| Risk | Probability | Impact | Warning signs | Prevention | Mitigation |
|---|---|---|---|---|---|
| No measured accuracy before demo/deploy | High | High | No recorded data by mid-build | Schedule mini-benchmark at hour ~48 | One honest FP/student-hour number; backup demo video |
| Far-field head-pose unreliable | High | Medium | Noisy yaw in back rows | Tier system + abstention | Demo Tiers A/B only; torso corroboration |
| Chit over-claim | Medium | High | "We detect all chits" language | Locked honesty reframing + pixel math | Abstain beyond floor; hand-behaviour cue |
| Threshold brittleness across rooms | High | Medium | FP spikes in new room | Personal baselines + per-room calibration | OOD test room in eval |
| ID switches under occlusion | Medium | Medium | Track flips between seats | Seat-anchor + re-association | Event quarantine on uncertainty |
| Alert fatigue (too many FPs) | Medium | High | Operators ignore queue | Fusion gates + cooldown + hysteresis | Hard-negative loop; severity ladder |
| Privacy backlash / DPDP non-compliance | Medium | High | Stored raw video, identity features | No FR + retention limits + consent | DPIA with counsel before deployment |
| Dataset license violation | Medium | Medium | Redistributing research datasets | Audit each license before use | Rely on own recorded data (moat) |
| Demo-day fragility (GPU/light/volunteers) | Medium | High | Live pose stutter | Rehearse 2-person script | File-input fallback + recorded run |
| Scope creep (learned models in 72 h) | Medium | Medium | Time sunk in training | Rules-first, defer ML | Cut to MVP feature set |
| AGPL license blocks productization | Low (resolved) | Medium | Shipping YOLO11 in product | Use Apache RTMDet | Swap detector cleanly (adapter) |
| Legal/adoption: no validated buyer | Medium | Medium | No pilot interest | Early controller interviews | Shadow-mode pilot MoU |

## 5.13 Implementation roadmap

**Phase 0 — Requirement validation & technical discovery.**
Objective: confirm compulsory set, hardware, camera access, volunteer consent. Tasks: fix scope with stakeholder; verify GPU + RTSP; audit dataset licenses; draft consent form. Deps: none. Deliverables: signed scope + consent template + hardware check. Testing: smoke-test camera ingest. Completion: green camera feed + confirmed requirements. Risks: ambiguous compulsory set.

**Phase 1 — Project foundation.**
Objective: skeleton on screen. Tasks: env (`rtmlib`, RTMDet, supervision, FastAPI, React); webcam→pose overlay; repo + CI lint/test. Deps: P0. Deliverables: pose overlay demo. Testing: unit on utils. Completion: live skeleton. Risks: env setup.

**Phase 2 — Core backend & data model.**
Objective: pipeline spine + persistence. Tasks: detector→pose→ByteTrack; seat-polygon editor; seat-anchor assignment; SQLite schema (§5.7); FastAPI + WS. Deps: P1. Deliverables: tracked seats + events table. Testing: seat-attribution accuracy. Completion: stable per-seat tracks. Risks: homography.

**Phase 3 — Core user experience.**
Objective: events → explainable cards → dashboard. Tasks: head-yaw + torso; wrist zones; rule engine B1–B6; baseline calibration; visibility + abstention; counterfactual card generator; React seat map + queue + timeline + skeleton toggle + accept/dismiss/note. Deps: P2. Deliverables: end-to-end alert with counterfactual. Testing: event P/R on scripted clips. Completion: full vertical slice. Risks: threshold tuning, UI scope creep.

**Phase 4 — Integrations & automation.**
Objective: objects + relations + feedback. Tasks: phone detector fine-tune (SCB/FPI-Det) + temporal confirm; chit Tier-A candidate (honesty-framed); seat-graph pair correlator C1–C4; hard-negative feedback loop. Deps: P3. Deliverables: phone + pair alerts. Testing: object FP/hr, pair P/R. Completion: flagship demo works. Risks: small-object range, 2-person data.

**Phase 5 — Testing, security & observability.**
Objective: trustworthy + secure. Tasks: RBAC + audit log; retention tiers + deletion API; encryption; health endpoint + heartbeat; three-tier eval + ablations + fairness slices. Deps: P4. Deliverables: metrics report + security controls. Testing: ablation deltas, deletion test. Completion: measured FP/student-hour + passing security checks. Risks: time.

**Phase 6 — Beta launch.**
Objective: shadow-mode pilot. Tasks: per-room calibration wizard; one-term shadow run (log, don't act); collect operator feedback; DPIA draft. Deps: P5. Deliverables: pilot report. Testing: field FP/student-hour. Completion: stakeholder sign-off. Risks: adoption, drift.

**Phase 7 — Production launch.**
Objective: live with safeguards. Tasks: Postgres migration; per-room edge nodes + store-and-forward; monitoring stack; DPIA with counsel; appeals process. Deps: P6. Deliverables: production deployment. Testing: reliability SLOs. Completion: signed MoU + live. Risks: legal, ops.

**Phase 8 — Post-launch improvements.**
Objective: learned upgrades. Tasks: MIL anomaly head; TCN/ST-GCN; GNN relational; multi-camera fusion; drift monitoring + retraining from feedback. Deps: P7 + data volume. Deliverables: V2 models. Testing: A/B vs rules baseline. Completion: measured improvement. Risks: over-engineering.

## 5.14 Prioritized development backlog

```text
Epic: E1 — Perception pipeline (detect + pose + track + seat anchor)
Goal: Stable anonymous per-seat tracks from live CCTV
User value: Foundation for every downstream signal; enables anonymity
Dependencies: Camera ingest, seat-polygon editor
Tasks: RTMDet-s inference; RTMPose-m via rtmlib; ByteTrack; seat-anchor layer; seat polygon UI
Acceptance criteria: Given a 6-person clip, ≥95% frames map each track to correct seat; ID switches < baseline; runs ≥10 FPS on target GPU
Risks: Homography friction; small-person recall
Priority: P0
Suggested release: MVP
```
```text
Epic: E2 — Rule event engine + personal baselines
Goal: Emit B1–B6 behaviour events with duration/repetition/baseline/geometry gates
User value: Turns raw motion into meaningful, low-FP candidate events
Dependencies: E1, head/torso + wrist features
Tasks: head-yaw + torso; wrist zones; rules B1–B6; hysteresis + cooldown; per-seat baseline stats; geometry whitelists
Acceptance criteria: Single <1.8s glance produces NO alert; 3 glances >P95 within window produces a MEDIUM candidate; whitelisted clock/invigilator looks suppressed
Risks: Threshold brittleness; cold-start baselines
Priority: P0
Suggested release: MVP
```
```text
Epic: E3 — Seat-graph correlator + counterfactual cards (FLAGSHIP)
Goal: Fire relational (pair) events and render evidence + "what would NOT have triggered this"
User value: The core differentiator; makes the system read as intelligent and fair
Dependencies: E2, evidence fusion
Tasks: directed time-decayed edges (glance_toward/responds/reciprocal/handoff); fusion + severity ladder; counterfactual generator from engine state
Acceptance criteria: Reciprocal-glance pair triggers C1 with both seats visible; every card answers all 14 questions; counterfactual numbers exactly match engine state (consistency test passes)
Risks: 2-person scripted data; template↔math drift
Priority: P0
Suggested release: MVP
```
```text
Epic: E4 — Object detection (phone; chit Tier-A)
Goal: High-value object alerts with temporal confirmation, honesty-scoped
User value: Phones are the top real-world threat
Dependencies: E1
Tasks: fine-tune RTMDet-s on SCB/FPI-Det + own crops; N-of-M temporal confirm; Tier-A chit candidate with uncertainty language
Acceptance criteria: Phone lift at 3–4 m yields object alert with ≥N confirmations + clip; beyond pixel floor → "insufficient visibility" not a guess
Risks: small-object range
Priority: P1
Suggested release: MVP (phone) / V1 (chit)
```
```text
Epic: E5 — Dashboard + human review workflow
Goal: Live seat map, severity-sorted queue, timelines, skeleton toggle, accept/dismiss/note, replay
User value: Where invigilators actually work; mandatory human gate
Dependencies: E2/E3, backend WS
Tasks: React seat map + queue + AlertCard + timeline + replay modal + settings (seat editor, threshold sliders); RBAC
Acceptance criteria: Alert appears ≤5s after event; dismiss(reason) writes hard-negative + audit log; skeleton-only toggle hides RGB; no permanent per-student score anywhere
Risks: UI scope creep
Priority: P0
Suggested release: MVP
```
```text
Epic: E6 — Abstention, security, retention, benchmark
Goal: Trustworthy + deployable + measured
User value: Judge/institution trust; DPDP alignment; honest numbers
Dependencies: E1–E5
Tasks: visibility score + abstention gates; RBAC + audit log; encryption + retention tiers + deletion API; benchmark harness (FP/student-hour, event F1, seat-attr, ablations, fairness slices)
Acceptance criteria: occluded seat → "unobservable" (never "suspicious"); deletion API purges assets; eval reports only measured numbers; ablations show each layer cuts FPs
Risks: time pressure
Priority: P0 (abstention+benchmark) / P1 (RBAC+retention for V1)
Suggested release: MVP (abstention, benchmark) / V1 (RBAC, retention)
```

## 5.15 Validation plan

**Must validate BEFORE substantial development:**
- **Camera + geometry proof-of-concept:** verify pose/detection quality at real hall distances/angles on target camera → *technical PoC*.
- **Data availability + consent:** confirm volunteers + written consent + recording venue → *data availability test*.
- **Compute throughput:** measure FPS/latency at 40–60 people → *technical PoC*.
- **Dataset licenses:** audit SCB/FPI-Det terms → *legal/security review*.

**Can validate DURING beta:**
- **False-alerts/student-hour in the field** → *AI accuracy evaluation* (shadow mode).
- **Operator trust + alert fatigue** → *user interviews* with invigilators.
- **Buyer/pricing** → *pricing test* with exam controllers.
- **Fairness across clothing/build/glasses/row** → fairness slices on recorded data.
- **Abstention calibration** → occlusion/low-light slices.

**Methods:** technical PoC (camera + compute), data availability test, clickable dashboard prototype for operator interviews, AI accuracy eval on own benchmark, security review (DPIA), integration sandbox (RTSP), pricing test.

---

# STEP 6 — Traceability

Source key: **U** = user compulsory requirement (the 20 objectives, §0), **F** = Fable, **S** = Sol, **D** = derived recommendation.

| Final requirement / feature | Compulsory? | Source | Included release | Reason |
|---|---|---|---|---|
| Multi-person detection & tracking | Yes (C1,C17) | U, F, S | MVP | Foundation objective |
| Pose landmark extraction | Yes (C2) | U, F, S | MVP | Objective |
| Body posture analysis | Yes (C3) | U, F, S | MVP | Objective |
| Head-orientation (coarse L/C/R) | Yes (C4,C6,C7) | U, F, S | MVP | Objective; merged head approach |
| 6DRepNet Tier-A refinement | Partial (C4) | F, S | MVP if time | Degree-level front-row yaw |
| Hand & wrist analysis | Yes (C5,C9) | U, F, S | MVP | Objective |
| Body rotation toward neighbour | Yes (C8) | U, F, S | MVP | Objective |
| Repeated sideward glances | Yes (C6) | U, F, S | MVP | Objective (rule engine) |
| Excessive head turning | Yes (C7) | U, F, S | MVP | Objective |
| Unusual/repeated hand movements | Yes (C9) | U, F, S | MVP | Objective |
| Non-verbal communication candidates | Yes (C10) | U, F, S | MVP | Objective (seat-graph) |
| Seat-Aware Behaviour Graph (flagship) | Derived from C10 | F, S | MVP | Core differentiation |
| Counterfactual alert cards | No | F | MVP | Sharpest demo/fairness lever |
| Personal baseline calibration | No | F, S | MVP/V1 | FP reduction; closes lit gap |
| Uncertainty-aware abstention | Derived (C18/C20) | F, S | MVP | Honesty + trust |
| Mobile phone detection | Yes (C11) | U, F, S | MVP | Objective |
| Chit/unauthorized paper (Tier-A, feasible) | Yes (C12) | U, F, S | V1 (honesty-scoped) | Objective; physics-limited → closest practical alt |
| Other unwanted objects | Yes (C13) | U, F, S | V1 | Objective; closed-set + review |
| Real-time explainable alerts | Yes (C14) | U, F, S | MVP | Objective |
| Seat-wise timelines | Yes (C15) | U, F, S | MVP | Objective |
| Event logging | Yes (C16) | U, F, S | MVP | Objective |
| Privacy-conscious operation (no FR, skeleton-first) | Yes (C18) | U, F, S | MVP | Objective |
| No identity-based accusation | Yes (C19) | U, F, S | MVP | Objective; language whitelist |
| Human review before interpretation | Yes (C20) | U, F, S | MVP | Objective; accept/dismiss/note |
| Skeleton-only privacy replay | Derived (C18) | F, S | MVP/V1 | Privacy differentiator |
| Hard-negative feedback loop | No | F | V1 | Threshold learning |
| RBAC + audit log | Derived (C18) | S | V1 | Deployment + DPDP |
| Retention tiers + deletion API | Derived (C18) | S, F | V1 | DPDP alignment |
| Model I/O contracts + typed schema | No | S | V1 | Integration/testing quality |
| Apache-licensed detector (RTMDet-s) | Derived | S, D | MVP | Resolves AGPL productization risk |
| FP/student-hour benchmark + own dataset | Derived (credibility) | F, S | MVP | Only credible accuracy source; the moat |
| DPDP DPIA + consent artifacts | Derived (C18) | F, S, D | V1/Beta | Legal compliance (needs counsel) |
| MIL anomaly / TCN / GNN / multi-camera | No | F, S | Future | Post-MVP upgrades |
| Facial recognition / eye-gaze / audio / emotion / cheating-score / cloud | N/A | (excluded) | Rejected | Negative value / illegal-risk / infeasible |

**All 20 compulsory objectives appear above.** None is dropped; only objective 12 (chit) is honesty-scoped, with the reason and closest practical alternative stated.

---

# STEP 7 — Final Verdict (Executive Decision)

1. **Recommended foundation:** **Fable ("VIGIL") as the primary spine**, hardened with Sol's deployment artifacts and Apache-licensed models → **"VIGIL SeatGraph."**
2. **Most valuable ideas from Fable:** counterfactual alert cards; pixel-math feasibility tiers (A/B/C) + honest per-seat capability display; rules-first / defer-ML discipline; hard-negative feedback loop; hour-by-hour execution plan; live threshold sliders as a demo device.
3. **Most valuable ideas from Sol:** model I/O contracts; full SQL schema + RBAC + audit log; retention tiers (metadata / short RGB / skeleton-longest); Apache-first licensing (RTMDet over YOLO11-AGPL); concrete India cost bands; broader (but to-be-trimmed) dataset catalog incl. FPI-Det.
4. **Features removed and why:** facial recognition (zero detection value, DPDP/accusation hazard), eye-gaze as primary (physically unrecoverable at range), long-range chit/earbud (below pixel floor), audio (privacy + scope), emotion recognition (pseudo-scientific/bias), permanent cheating score (accusation by another name), end-to-end cheating classifier (kills explainability/fairness), cloud video upload (DPDP surface). Deferred (not removed): MIL anomaly head, learned temporal (TCN/ST-GCN/PoseC3D), GNN, interaction chains, multi-camera, digital-twin, ~20-dataset training program.
5. **Final MVP definition:** a single-hall, single-camera, single-GPU vertical slice — detect → pose → ByteTrack+seat-anchor → head/torso + wrist → rule events (B1–B6) → seat-graph pair events (C1–C4) → evidence fusion + abstention → **counterfactual review cards** in a React dashboard with accept/dismiss/note and skeleton replay, plus a **measured false-alerts-per-student-hour** number from the team's own consented recording.
6. **Biggest feasibility concern:** **no measured accuracy until the team records and annotates its own data** — everything credible hinges on the mini-benchmark. Mitigation: schedule recording at ~hour 48 and keep a backup demo video.
7. **Biggest business/user-validation concern:** **no validated buyer or pricing** in either proposal — demand exists (govt deployments) but willingness-to-pay and procurement path are unproven. Validate with exam-controller interviews before production investment.
8. **Recommended first implementation task:** stand up the perception spine — `rtmlib`/ONNX RTMPose + RTMDet-s on a webcam/RTSP frame with skeleton overlay (Epic E1, task 1), because every other module depends on stable per-seat tracks.
9. **Three decisions to finalize before coding:**
   - **(a) Context & license posture:** hackathon-MVP-first vs production-first, and confirm **Apache-only** model stack (RTMDet-s) to keep productization open.
   - **(b) Data plan:** volunteers, venue, consent form, and annotation capacity — the moat and the only accuracy source.
   - **(c) Compulsory-set confirmation:** verify the assumed 20 objectives (and any real budget/deadline/team constraints) so scope and traceability are correct.
10. **Recommendation: Conditional Go.**
   Proceed to build the MVP as defined. The **conditions** are the three decisions in (9) — most critically, a concrete **data-recording + consent plan** and **confirmation of the compulsory requirements**. Resolve those and this is a **Go**; without a data plan, the credibility of every claim collapses and it becomes a **No-Go** for anything beyond a UI demo.

---

## Appendix — Items flagged for expert review
- **Legal:** DPDP DPIA, consent templates, dataset license audit (SCB, FPI-Det, NTU, etc.), patent landscape (Fable notes patent DBs were not searched; Sol cites US9154748B2 / EP1987505A2 / KR101765770B1) — **run Google Patents before any "not patented" claim**.
- **Security:** encryption/key management, RBAC review, retention/deletion verification before real footage is stored.
- **Domain/fairness:** fairness slices (clothing, build, glasses, row) and abstention calibration require domain-expert sign-off.
- **Financial:** unit economics (cameras-per-node, storage growth) need measurement, not estimation.

*End of plan.*
