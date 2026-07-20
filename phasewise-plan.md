# VIGIL SeatGraph — Technical Implementation Blueprint (phasewise)

**What this document is:** the *how* — architecture, tech stack, repo layout, Docker design, typed contracts, module specs (signatures + pseudocode), config schema, and a phase-by-phase build order. It is written so any implementer (human or LLM) can build the system without re-deciding anything.
**What it is not:** the *what/when/why*. Those live in the two authority documents:

- `plan.md` — **design authority** (models, schema, feature reasoning, roadmap).
- `IMPLEMENTATION_PLAN.md` — **execution authority** (day-wise gates 20→26 July, scope matrix, stop conditions, regression clips R1–R7, metrics, demo script). **Its gates always win on scope.**

**Environment:** RTX 4060 Laptop (8 GB VRAM) · Docker 29 + Compose v5 · host Python 3.14 (container pins 3.12 — see A3).
**Standing constraint (user):** Python and Docker at every step. Reconciled with `IMPLEMENTATION_PLAN.md` §5/§19 (which cut Docker-as-microservices and CI): **Docker is used strictly as the single-process packaging + reproducible-run layer** — one app image, one web build stage, one compose service. Not microservices.

---

## 1. Architecture Decisions (ADRs)

| # | Decision | Choice | Why (traceable) | Rejected |
|---|---|---|---|---|
| A1 | Process topology | **Single-process Python monolith**: CV pipeline + judgment + FastAPI in one process | `IMPLEMENTATION_PLAN.md` §5 "one process, SQLite, no auth, no Redis" | Microservices, Celery, Redis |
| A2 | Concurrency | **One blocking pipeline thread** + asyncio main loop (uvicorn); handoff via `asyncio.Queue` using `loop.call_soon_threadsafe` | CV libs are blocking/GIL-heavy; API must stay responsive; simplest correct model | Multiprocessing, per-camera workers |
| A3 | Runtime | Container base **`python:3.12-slim`** (not host 3.14) | onnxruntime/torch wheels lag new CPython; Docker makes host version irrelevant | Host venv as primary |
| A4 | Perception | **Pretrained ONNX only** via `rtmlib` (person det + RTMPose-m) on `onnxruntime-gpu` (CUDA EP) | No training on critical path (`IMPLEMENTATION_PLAN.md` §1); Apache/MIT licenses | torch in core path, fine-tuning |
| A5 | Judgment | **Deterministic rules** (duration/repetition/baseline/hysteresis/cooldown) | Rules *are* the explanation (counterfactuals); fully unit-testable | End-to-end classifier (rejected permanently) |
| A6 | Persistence | **SQLite via SQLModel** (typed pydantic models, zero-ops, file in mounted volume) | `plan.md` §5.6; survives restart; single-node | Postgres (Phase 4 roadmap) |
| A7 | Frontend | **React 18 + Vite + TypeScript**, built to static files, **served by FastAPI** (single origin) | No CORS, one container, one port; canvas for seat map/overlay | Separate web server, heavy UI kits |
| A8 | Model adapters | Every model behind a **typed Protocol** (`Detector`, `PoseEstimator`, `AttentionEstimator`) | Swap YOLOX↔RTMDet or ray↔Gaze-LLE = config change; contains API drift | Direct library calls scattered in pipeline |
| A9 | Config | **All thresholds in `config/config.yaml`** (pydantic-validated), never scattered constants | `IMPLEMENTATION_PLAN.md` §19 item 3; live-tunable | Hardcoded magic numbers |
| A10 | Attention (USP 1) | Default = **keypoint head-direction ray → zone** (deterministic); Gaze-LLE = **optional adapter** gated by Day-1 go/no-go | `IMPLEMENTATION_PLAN.md` §9 USP1 is kill-able; head-ray always works | Gaze-LLE on critical path |
| A11 | Privacy | Raw frames **never persisted** (60 s RAM ring buffer); event clips + skeleton JSON only | DoD §16; privacy advocate persona | Writing raw video to disk |
| A12 | Anti-hardcoding | Two hard guards as automated tests: **`card == DB` consistency** + **clean-run reproduces demo** | `IMPLEMENTATION_PLAN.md` §7 | Trust-based demos |

---

## 2. Tech Stack (pinned; re-pin after first green build per risk register §18)

| Layer | Package | Version | License | Role | Fallback |
|---|---|---|---|---|---|
| Container base | `python:3.12-slim` | — | — | app image | — |
| CV decode | `opencv-python-headless` | 4.10.0.84 | Apache-2.0 | RTSP/USB/file ingest, geometry, overlay | ffmpeg CLI |
| Inference runtime | `onnxruntime-gpu` | 1.19.2 | MIT | CUDA EP for all ONNX models | CPU EP |
| Person det + pose | `rtmlib` | latest → pin | Apache-2.0 | `YOLOX`/`RTMDet` (person, Apache) + `RTMPose-m` ONNX, auto-download | RTMO one-stage |
| Tracking | `supervision` | 0.24.0 | MIT | `sv.ByteTrack`, `sv.Detections`, annotators | reference ByteTrack |
| Numerics | `numpy` | <2.1 | BSD | geometry, buffers | — |
| API framework | `fastapi` | 0.115.x | MIT | REST + WebSocket | — |
| ASGI server | `uvicorn[standard]` | 0.34.x | BSD | serves API + built static web | — |
| Validation | `pydantic` | 2.10.x | MIT | contracts + config | — |
| ORM | `sqlmodel` | 0.0.22 | MIT | SQLite tables (SQLAlchemy core inside) | sqlite3 stdlib |
| Config | `PyYAML` | 6.0.2 | MIT | `config.yaml` thresholds | — |
| CLI | `typer` | 0.15.x | MIT | record/annotate/eval scripts | argparse |
| Tests | `pytest`, `pytest-asyncio`, `httpx` | 8.3.x / 0.26.x / 0.28.x | MIT | unit, API, integration | — |
| Web build | `node:20-alpine`, `react`, `react-dom`, `vite`, `typescript` | 20 / 18.3.1 / 18.3.1 / 5.4.x / 5.6.x | MIT | dashboard build stage | — |
| Optional (USP 1 upgrade) | `torch` + Gaze-LLE (`github.com/fkryan/gazelle`, MIT) | cu124 wheel | MIT | attention heatmaps **only if Day-1 go/no-go passes** | keypoint ray (default) |

> **Detector note (grounded):** `rtmlib` ships Apache-2.0 person-detector ONNX models (YOLOX family) and an `RTMDet` class for custom ONNX. The `Detector` Protocol defaults to rtmlib's bundled person model; an RTMDet-s ONNX can be dropped in via config. Both satisfy the Apache-first posture (`plan.md` §5.6). Verified against rtmlib docs: `YOLOX(onnx_model, model_input_size, backend, device)` → `bboxes=det(img)`; `RTMPose(onnx_model, model_input_size, to_openpose, backend, device)` → `kpts,scores=pose(img, bboxes)` with kpts `(N,17,2)`, scores `(N,17)`.

---

## 3. Repository Layout (files an implementer must create)

```
drishti-ai/
├── docker-compose.yml              # single service: app (GPU) + volumes
├── Dockerfile                      # multi-stage: web build -> app runtime
├── .env.example                    # INPUT_SOURCE, DEVICE, WEIGHTS_DIR, DB_PATH
├── pyproject.toml                  # app package "vigil" + deps (pip install -e .)
├── config/
│   ├── config.yaml                 # ALL thresholds (schema in §9)
│   └── seatmap.demo.json           # pre-saved demo seat map (fallback asset)
├── vigil/
│   ├── __init__.py
│   ├── config.py                   # pydantic-settings + YAML loader
│   ├── contracts.py                # pydantic models: PerFrameSeatState, BehaviorEvent, ... (§7)
│   ├── pipeline.py                 # Pipeline orchestrator (thread) (§8.10)
│   ├── main.py                     # FastAPI app factory + lifespan starts/stops pipeline
│   ├── ingest/
│   │   ├── source.py               # FrameSource Protocol: FileSource, USBSource, RTSPSource
│   │   └── sampler.py              # drop-to-target-FPS sampler
│   ├── perception/
│   │   ├── detector.py             # RtmlibDetector (Detector Protocol)
│   │   ├── pose.py                 # RtmlibPose (PoseEstimator Protocol)
│   │   ├── tracker.py              # ByteTracker (sv.ByteTrack wrapper)
│   │   ├── seat_anchor.py          # track->seat assignment + quarantine
│   │   └── objects.py              # phone candidate via COCO 'cell phone' class on hand crops
│   ├── signals/
│   │   ├── head.py                 # keypoint yaw L/C/R + torso yaw
│   │   ├── wrist.py                # desk/lap/pocket/neighbour zone dwell
│   │   ├── visibility.py           # visibility score + tier A/B/C (pixel math)
│   │   └── attention.py            # AttentionEstimator Protocol; KeypointRayAttention (default); GazelleAttention (optional)
│   ├── judgment/
│   │   ├── buffers.py              # per-seat ring buffers of seat-state
│   │   ├── rules.py                # event state machines (glance, torso) w/ hysteresis+cooldown
│   │   ├── baseline.py             # per-seat median/P95, drift update, cold-start prior
│   │   ├── seatgraph.py            # directed time-decayed edges + reciprocal detection
│   │   ├── fusion.py               # evidence fusion -> severity ladder; abstention gate
│   │   └── explain.py              # 14-answer card + counterfactual from event state ONLY
│   ├── store/
│   │   ├── db.py                   # engine, idempotent init
│   │   ├── models.py               # SQLModel tables (§10)
│   │   └── repository.py           # typed write/read helpers (events, alerts, feedback, metrics)
│   ├── api/
│   │   ├── routes_session.py       # session start/stop/status
│   │   ├── routes_seats.py         # seatmap CRUD
│   │   ├── routes_events.py        # events/alerts query
│   │   ├── routes_alerts.py        # accept/dismiss/notes
│   │   ├── routes_replay.py        # clip + skeleton JSON
│   │   ├── routes_metrics.py       # session metrics (computed from rows ONLY)
│   │   ├── routes_health.py        # /health
│   │   └── ws.py                   # /ws/alerts, /ws/live, /ws/seatstate
│   └── eval/
│       ├── harness.py              # metrics from DB + annotations (§13 formulas)
│       └── regression.py           # run R1-R7 clips, assert expected outcomes
├── scripts/
│   ├── record.py                   # consented recording helper (timestamped takes)
│   ├── annotate.py                 # annotations.json builder for regression/eval
│   └── make_seatmap.py             # dev CLI: click polygons on a still -> seatmap json
├── tests/
│   ├── unit/                       # geometry, rules, baseline, seatgraph, fusion, explain
│   ├── api/                        # route tests via httpx + tmp SQLite
│   ├── integration/                # clip -> events -> alert -> DB
│   └── guards/
│       ├── test_card_matches_db.py # ANTI-HARDCODE GUARD 1
│       └── test_clean_run.py       # ANTI-HARDCODE GUARD 2 (fresh DB, scripted clip)
├── web/                            # Vite + React + TS
│   ├── package.json
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── api/client.ts           # REST + WS clients
│       ├── state/store.ts          # session, seats, alerts, seatstate (reducer)
│       └── components/
│           ├── LiveFeedPanel.tsx   # frame + overlay canvas (skeleton toggle, attention lens)
│           ├── SeatMap.tsx         # polygons, state colours, tier badges, edges
│           ├── AlertQueue.tsx, AlertCard.tsx
│           ├── TimelinePanel.tsx
│           ├── ReplayModal.tsx     # skeleton-only replay + optional RGB clip
│           ├── MetricsPanel.tsx
│           └── SeatMapEditor.tsx   # draw polygons on still -> POST /seatmap
├── data/                           # recordings, annotations (gitignored, mounted)
├── clips/                          # event clips + skeleton JSON (gitignored, mounted)
└── docs/                           # hour-0/Day-1 go-no-go note, model card, limitations
```

---

## 4. Runtime Architecture (one process, two worlds)

```
┌────────────────────────────── single container: app ──────────────────────────────┐
│  Main thread (asyncio / uvicorn)                                                  │
│    FastAPI routes ──┐                                                             │
│    WS broadcasters ─┼── consume asyncio.Queue<Alert|SeatState>                    │
│                     │         ▲ loop.call_soon_threadsafe                         │
│  Pipeline thread (blocking CV)                                                    │
│    FrameSource -> sampler -> Detector -> Pose -> ByteTrack -> SeatAnchor          │
│      -> signals(head,torso,wrist,visibility,attention?)                           │
│      -> PerFrameSeatState -> ring buffers -> rules -> seatgraph -> fusion         │
│      -> abstain? -> explain -> repository.write(SQLite) -> publish(queue)         │
│      -> latest overlay JPEG -> LatestFrameHolder (for /ws/live @ ~5 FPS)          │
│  Session control: POST /session/start sets threading.Event; stop clears it        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- **Frame flow is sequential per frame** (no intra-pipeline parallelism). At 6 people this is comfortably ≥15 FPS on the 4060; measure Day 1 and lower sample rate if not (stop condition §17).
- **Latest-frame holder** (lock + newest-wins) decouples live-view FPS from pipeline FPS.
- **No raw frames leave the pipeline**; only overlay JPEG (skeleton mode default), event clips, and skeleton JSON persist.

---

## 5. Docker Design

**One multi-stage `Dockerfile`:**

```
# stage 1: web build
FROM node:20-alpine AS web
COPY web/ /web
RUN cd /web && npm ci && npm run build      # outputs /web/dist

# stage 2: app runtime
FROM python:3.12-slim AS app
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .            # installs deps + vigil package
COPY vigil/ ./vigil/
COPY config/ ./config/
COPY --from=web /web/dist ./web/dist        # served by FastAPI StaticFiles
ENV WEIGHTS_DIR=/weights DB_PATH=/db/vigil.db CLIPS_DIR=/clips
VOLUME ["/weights", "/db", "/clips", "/data"]
EXPOSE 8000
CMD ["uvicorn", "vigil.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`docker-compose.yml` (single service, GPU reserved):**

```yaml
services:
  app:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    volumes:
      - weights:/weights          # rtmlib ONNX cache (offline after first pull)
      - db:/db                    # SQLite
      - clips:/clips              # event clips + skeleton JSON
      - ./data:/data              # recordings/annotations (bind, gitignored)
      - ./config:/config:ro       # live threshold edits without rebuild
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
volumes:
  weights:
  db:
  clips:
```

- **Offline requirement (Clean-Run §19 item 14):** first run downloads ONNX weights into `/weights`; verify `docker compose run --rm app python -c "from vigil.perception import detector, pose; print('weights ok')"` with `--network none` afterwards. rtmlib cache dir must be pointed at `/weights` (confirm exact env/mechanism at integration; else pre-download in build).
- **CPU-only fallback:** compose override drops the `deploy` block and sets `DEVICE=cpu` (degraded, abstention-heavy).
- **Dev loop:** bind-mount `vigil/` + run `uvicorn --reload` via a `docker-compose.dev.yml` override. Production path stays the immutable image.

---

## 6. Core Data Contracts (`vigil/contracts.py` — pydantic, from `IMPLEMENTATION_PLAN.md` §6)

```python
from pydantic import BaseModel
from typing import Literal, Optional

Tier = Literal["A", "B", "C"]
Dir3 = Literal["L", "C", "R", "rear", "uncertain"]
Severity = Literal["silent_log", "low", "medium", "high_review", "unobservable"]
SeatState = Literal["observing", "event", "alert", "unobservable", "quarantined"]

class PerFrameSeatState(BaseModel):          # THE core integration object
    frame_ts: float
    seat_id: str
    track_uid: str
    keypoints: list[list[float]]             # 17 x [x,y,conf]  [M]
    head_dir: Dir3                           # [G]
    head_yaw_deg: Optional[float]            # Tier A only      [G]
    torso_yaw_deg: float                     # [G]
    wrist_zones: dict[str, str]              # {"left": "desk"|"lap"|"pocket"|"neighbour"|"unknown", ...} [G]
    visibility: float                        # 0..1             [G]
    tier: Tier                               # [G]
    observable: bool                         # [G]
    attention_target: Optional[str] = None   # seat_id/zone id, USP1 only [G/M]
    phone_candidate: Optional[float] = None  # confirmed conf    [M]

class BehaviorEvent(BaseModel):
    event_id: str
    seat_id: str
    track_uid: str
    type: str                                # "repeated_glance_right" | "torso_turn" | ...
    t_start: float; t_end: float
    duration: float
    repetitions: int
    durations: list[float]
    direction: Dir3
    pair_seat: Optional[str] = None
    signals: dict                            # contributing values snapshot
    confidence: float
    visibility: float
    baseline_dev: Optional[float]
    severity: Severity
    state: Literal["candidate", "alerted", "quarantined"]
    explanation: Optional[str] = None
    counterfactual: Optional[str] = None
    clip_ref: Optional[str] = None

class PairEdge(BaseModel):
    edge_id: str
    src_seat: str; dst_seat: str
    type: Literal["glance_toward", "responds", "reciprocal", "handoff_candidate"]
    weight: float                            # time-decayed
    evidence_event_ids: list[str]
    last_ts: float

class Alert(BaseModel):
    alert_id: str
    event_id: str
    severity: Severity
    state: Literal["new", "accepted", "dismissed"]
    created_at: float

class SessionMetrics(BaseModel):             # computed from rows ONLY, never typed by hand
    false_alerts_per_student_hour: Optional[float]
    event_precision: Optional[float]
    event_recall: Optional[float]
    alert_latency_s: Optional[float]
    fps: Optional[float]
    pct_unobservable: Optional[float]
    seat_attribution_rate: Optional[float]
    alerts_with_full_explanation: Optional[float]
    dismiss_rate: Optional[float]
```

*(Continued in §8 — module specs implement these contracts.)*

---

## 7. Module Specs (signatures + algorithms)

> Every model/heuristic is behind a Protocol (A8). Pseudocode is implementation-directive, not prose.

### 7.1 `ingest/` — frame sources + sampler

```python
class FrameSource(Protocol):
    def read(self) -> tuple[bool, "np.ndarray | None", float]: ...  # (ok, frame, ts)
    def release(self) -> None: ...

class FileSource:   def __init__(self, path: str): ...        # cv2.VideoCapture(path)
class USBSource:    def __init__(self, device: int = 0): ...
class RTSPSource:   def __init__(self, url: str): ...         # reconnect + degraded banner flag

class FPSSampler:
    def __init__(self, target_fps: float): ...
    def due(self, ts: float) -> bool: ...                     # drop-to-target; stable timestamps
```
Acceptance: switching source class = zero downstream change; 60 s file decodes at target FPS.

### 7.2 `perception/detector.py` + `pose.py` (rtmlib, grounded)

```python
class Detector(Protocol):
    def detect(self, frame) -> "np.ndarray": ...              # (N,4) xyxy person boxes

class RtmlibDetector:                                          # wraps rtmlib person model
    def __init__(self, weights_dir: str, device: str, input_size=(640, 640)): ...
    # rtmlib YOLOX(onnx_model=<cached>, model_input_size, backend="onnxruntime", device)

class PoseEstimator(Protocol):
    def estimate(self, frame, bboxes) -> tuple["np.ndarray", "np.ndarray"]: ...  # kpts (N,17,2), conf (N,17)

class RtmlibPose:                                              # wraps rtmlib RTMPose
    def __init__(self, weights_dir: str, device: str, input_size=(192, 256)): ...
    # rtmlib RTMPose(...); kpts, scores = pose_model(frame, bboxes=bboxes)
```
- COCO-17 keypoint indices used downstream: nose 0, eyes 1/2, ears 3/4, shoulders 5/6, elbows 7/8, wrists 9/10, hips 11/12.
- FPS lever: `max_people` cap (config) — sort boxes by area, keep top-K.

### 7.3 `perception/tracker.py` (supervision ByteTrack, grounded)

```python
class ByteTracker:
    def __init__(self, min_consecutive: int = 3): ...
    # self._t = sv.ByteTrack(minimum_consecutive_frames=min_consecutive)
    def update(self, bboxes: "np.ndarray", confs: "np.ndarray") -> list[Track]:
        # dets = sv.Detections(xyxy=bboxes, confidence=confs, class_id=zeros)
        # tracked = self._t.update_with_detections(dets)  -> tracked.tracker_id
```
`Track = {track_uid, bbox_xyxy, conf}`; `track_uid = f"{session_id}:{tracker_id}"` (unique per session).

### 7.4 `perception/seat_anchor.py` — the anonymity + anti-ID-switch layer

```python
class SeatAnchor:
    def __init__(self, seats: list[SeatConfig]): ...           # polygons + adjacency + tier
    def assign(self, track: Track, kpts, ts) -> tuple[str | None, Health]: ...

# Algorithm (per track, per frame):
#   torso_centroid = mean(kpts[5,6,11,12] with conf>0.3)       # shoulders+hips
#   hits = [s for s in seats if cv2.pointPolygonTest(s.polygon, centroid, False) >= 0]
#   if len(hits)==1: candidate = hits[0]
#   elif len(hits)==0: candidate = previous seat (memory decay T_mem)  # occlusion
#   else: candidate = nearest by centroid distance; health="uncertain"
#   sticky: seat change requires K consecutive frames in the new polygon (config)
#   if health=="uncertain" for > Q frames: quarantined=True -> judgment skips (no guessing)
```

### 7.5 `signals/head.py` — coarse direction (always) + optional Tier-A angle

```python
def head_dir_3class(kpts) -> tuple[Dir3, float | None]:
    # yaw_proxy = (nose_x - mid_ear_x) / max(ear_dist, eps)     # ~[-1,1]
    # conf gate: if ear/eye conf < c_min -> ("uncertain", None)
    # L if proxy < -theta_yaw; R if > theta_yaw; else C
    # rear: both ears occluded + shoulders visible (back of head)
def torso_yaw_deg(kpts) -> float:
    # angle of shoulder line (5->6) vs seat-row axis from seatmap homography
```
- Tier-A refinement (optional, P2): 6DRepNet on face crop ≥40 px, transient; skip if time.

### 7.6 `signals/visibility.py` — honesty gate + pixel tiers

```python
def visibility_score(kpts, bbox, occlusion_iou) -> float:
    # v = 0.5*mean(kpt_conf[core 10 kpts]) + 0.3*min(bbox_h/ref_h,1) + 0.2*(1-occlusion_iou)
def assign_tiers(seats, person_heights_px: dict[str, float]) -> None:
    # face_px ≈ person_h/7.5;  tier A: face>=40px (full), B: 20-40 (coarse), C: <20 (posture only)
```
Tier math follows `plan.md` §4 pixel arithmetic; **tiers are computed at seatmap setup from detected person heights**, stored per seat, shown as badges.

### 7.7 `signals/wrist.py`

```python
def wrist_zones(kpts, seat: SeatConfig, neighbours) -> dict[str, str]:
    # for each wrist (9,10): map point -> desk polygon | lap band | pocket band | neighbour desk | "unknown"
```
Zones derived from seat polygon at setup (desk = polygon, lap = band below, neighbour = adjacent seat polygons).

### 7.8 `signals/attention.py` — USP 1, kill-able

```python
class AttentionEstimator(Protocol):
    def target(self, state: PerFrameSeatState, seats) -> tuple[str | None, float]: ...  # (zone/seat id, conf)

class KeypointRayAttention:            # DEFAULT, deterministic, always available
    # ray from head centre along head_dir (+torso) -> first zone intersected
    # Tier-gated: returns None with conf 0 on Tier C
class GazelleAttention:                # OPTIONAL; loaded only if Day-1 go/no-go = GO
    # torch hub gazelle ViT-B; head box from pose kpts; 64x64 heatmap -> zone mass argmax
```
Foreign-attention aggregation for the desk-leakage view lives in `judgment/seatgraph.py` (shared rolling window), so it works with either estimator.

### 7.9 `judgment/` — the deterministic core

**`buffers.py`:** `RingBuf per seat` of `PerFrameSeatState` (config `window_s`, default 90 s) + event-scoped sub-buffers.

**`rules.py`** — one state machine per (seat, event-type):

```
on new seat-state s:
  sig = signal_value(s)                       # e.g. yaw beyond theta, gaze off-desk mass
  if state==IDLE and sig > theta_hi: state=IN_EVENT; t0=ts
  if state==IN_EVENT and sig < theta_lo for k consecutive frames: close event; durations.append(t-t0); state=IDLE
  events_in_window = count(durations within window_s)
  candidate fires iff: events_in_window >= n_min
                       AND max(durations) >= dur_min
                       AND (baseline cold ? population_prior : max(durations) > baseline.P95)
                       AND not whitelisted(s)        # clock/invigilator/door geometry zones
                       AND cooldown[(seat,type)] expired   # 1 alert / 3 min
```
Ship exactly **two event types Day 2** (gate): `repeated_glance_{L,R}` (head/gaze signal) + `torso_turn` (torso yaw toward occupied neighbour seat). Others (under-desk hand, reach) join only if gates stay green.

**`baseline.py`:** per-seat `RobustStats`: reservoir of glance durations; `median`, `P95`; warm after `baseline_warm_s` (default 8–10 min); drift via EMA on accepted-normal events; cold-start → `config.population_prior`.

**`seatgraph.py`:**
```python
class SeatGraph:
    def update(self, ev: BehaviorEvent, adj) -> list[BehaviorEvent]:  # may emit pair events
#   edge[(A,B)] += w  on glance_toward A->B; exponential decay half_life_s
#   responds B->A if B event within delta_t of A event
#   reciprocal if both directions within window; PAIR EVENT iff reciprocations >= n_pair
#     AND both seats observable AND adjacency contains (A,B)
#   evidence_event_ids always populated -> traceable pair evidence (DoD)
```

**`fusion.py`:** `score = Σ weights[signal]` (config); severity = ladder `s1..s4`; **abstention overrides everything**: `if visibility < tier_min[tier] or quarantined -> severity="unobservable"` (never "suspicious").

**`explain.py`:** `render(event) -> (explanation, counterfactual)` from **event fields only** via per-type templates; the 14 mandatory fields + "what would NOT have triggered this" (e.g. `"a single glance < {dur_min}s, or fewer than {n_min} repetitions, would not have generated this alert"`). **Guard:** `test_card_matches_db.py` re-renders from DB row and asserts string equality.

### 7.10 `pipeline.py` — orchestrator (the only integration point)

```python
class Pipeline(threading.Thread):
    def run(self):
        while not self._stop.is_set():
            ok, frame, ts = self.src.read()
            if not ok: self._handle_drop(); continue
            if not self.sampler.due(ts): continue
            boxes  = self.detector.detect(frame)
            kpts, confs = self.pose.estimate(frame, boxes)
            tracks = self.tracker.update(boxes, confs)
            states = []
            for tr in tracks:
                seat, health = self.anchor.assign(tr, kpts[tr], ts)
                state = build_seat_state(...)            # signals/*
                self.buffers[seat].push(state)
                for ev in self.rules.update(state):      # candidates
                    evs = self.graph.update(ev) if ev else []
                    for e in [ev, *evs]:
                        e.severity = self.fusion.score(e, state)
                        e.explanation, e.counterfactual = self.explain.render(e)
                        self.repo.write_event(e); self.publish(e)
                states.append(state)
            self.latest_frame.set(self.overlay.draw(frame, states))   # skeleton default
            self.publish_seatstate(states)
```

---

## 8. Config Schema (`config/config.yaml` — every knob in one place)

```yaml
input: { source: file, path: data/smoke.mp4, device: 0, rtsp_url: "", target_fps: 12 }
runtime: { device: cuda, max_people: 20, weights_dir: /weights }
perception: { det_input: [640,640], pose_input: [192,256], min_det_conf: 0.5, kpt_conf_min: 0.3 }
tracking: { min_consecutive: 3, seat_memory_s: 2.0, seat_switch_frames: 8, quarantine_frames: 30 }
signals:
  yaw_theta: 0.25            # head L/R proxy threshold
  torso_theta_deg: 20
  tier_min_visibility: { A: 0.55, B: 0.45, C: 0.35 }
attention: { enabled: false, estimator: keypoint_ray }   # flip to gazelle only if go/no-go GO
rules:
  window_s: 90
  glance: { n_min: 3, dur_min_s: 1.8, theta_hi: 0.30, theta_lo: 0.18, cooldown_s: 180 }
  torso:  { n_min: 1, dur_min_s: 1.5, theta_hi_deg: 25, theta_lo_deg: 15, cooldown_s: 180 }
baseline: { warm_s: 540, population_prior_p95_s: 2.5 }
seatgraph: { half_life_s: 45, delta_t_s: 6, n_pair: 2 }
fusion:
  weights: { duration: 1.0, repetition: 1.5, baseline_dev: 1.0, torso_confirm: 1.0, pair: 1.5, object: 2.0 }
  ladder: { s1: 1.0, s2: 2.0, s3: 3.0, s4: 4.0 }       # silent_log/low/medium/high_review
objects: { phone: { conf_min: 0.4, confirm_n: 3, confirm_m: 5 } }   # N-of-M temporal confirm
clips: { pre_s: 4, post_s: 8 }
whitelist_zones: { clock: [], invigilator: [], door: [] }            # polygons set at setup
```

## 9. DB Schema (`store/models.py`, SQLModel — MVP subset of `plan.md` §5.7)

| Table | Columns (types) |
|---|---|
| `sessions` | session_id TEXT PK · started_at REAL · input_source TEXT · camera_id TEXT · fps_processed REAL · status TEXT |
| `seats` | seat_id TEXT · session_id FK · polygon JSON · neighbours JSON · tier TEXT · PRIMARY KEY(seat_id, session_id) |
| `tracks` | track_uid TEXT PK · seat_id TEXT · t0 REAL · t1 REAL · avg_visibility REAL · health TEXT · quarantined BOOL |
| `events` | event_id TEXT PK · seat_id TEXT · track_uid TEXT · type TEXT · t_start REAL · t_end REAL · duration REAL · repetitions INT · durations JSON · direction TEXT · pair_seat TEXT NULL · signals JSON · confidence REAL · visibility REAL · baseline_dev REAL NULL · severity TEXT · state TEXT · explanation TEXT · counterfactual TEXT · clip_ref TEXT NULL |
| `alerts` | alert_id TEXT PK · event_id FK · severity TEXT · state TEXT · created_at REAL |
| `feedback` | feedback_id TEXT PK · alert_id FK · action TEXT · reason TEXT · note TEXT · created_at REAL |
| `assets` | asset_id TEXT PK · event_id FK · type TEXT (rgb/skeleton) · path TEXT · created_at REAL |

Idempotent init on startup; reset = delete volume + restart (documented in Clean-Run).

## 10. API + WebSocket Surface

| Endpoint | Method | Payload → Response |
|---|---|---|
| `/health` | GET | → `{models_loaded, input_ok, device, fps}` |
| `/session/start` `/session/stop` `/session` | POST/POST/GET | `{source}` → `{session_id, status}` |
| `/seatmap` | POST | `{session_id, seats:[{seat_id,polygon,neighbours,tier}]}` → persisted |
| `/seats` | GET | → seats + live state + tier badges |
| `/events?seat=&type=&from=` | GET | → `[BehaviorEvent]` |
| `/alerts` | GET | → `[Alert + joined event]` |
| `/alerts/{id}/accept` `/dismiss` `/notes` | POST | `{reason?, note?}` → feedback row |
| `/replay/{event_id}` | GET | → `{skeleton_json_url, clip_url?}` |
| `/metrics/session` | GET | → `SessionMetrics` (from rows only) |
| `/ws/alerts` | WS | server→client: `{type:"alert", alert, event, card}` |
| `/ws/seatstate` | WS | server→client @2 Hz: `{type:"seatstate", states:[...]}` |
| `/ws/live` | WS | server→client @5 FPS: binary JPEG overlay frames |

Frontend **renders state only** — zero intelligence client-side (A7 + §7 hardcoding audit).

## 11. Frontend Spec (`web/`)

- **Build:** Vite + React 18 + TS; deps limited to `react`, `react-dom` (+ dev: vite, typescript). No UI kit (scope-creep guard).
- **State:** single `useReducer` store fed by three WS channels + REST initial load; WS drop → 5 s REST poll fallback.
- **Canvas layers** (`SeatMap.tsx`, `LiveFeedPanel.tsx`): seat polygons (colour by state), tier badges, skeleton overlay, head-direction arrows (default), **Attention Lens beams as an optional toggle layer** — hidden entirely if `attention.enabled=false`.
- **AlertCard.tsx:** renders the 14 fields + counterfactual verbatim from API payload; Accept / Dismiss(reason enum) / Note buttons → POST feedback.
- **ReplayModal.tsx:** skeleton animation from pose JSON (RGB hidden by default); optional clip `<video>`.
- **SeatMapEditor.tsx:** click-to-draw polygons on a captured still → POST `/seatmap`; overlap validation client + server.
- **Prohibited by test:** any per-student aggregate score element.

---

## 12. Phase Build Order (tech checklist mapped to `IMPLEMENTATION_PLAN.md` §10 day gates)

Each phase lists: **files to write → tests to pass → verify command → day gate it satisfies.** If a phase misses its gate, apply that day's fallback in §10, not heroics.

### Phase A — Scaffold + perception spine (Day 1, 20 Jul)
- **Write:** `Dockerfile`, `docker-compose.yml`, `pyproject.toml`, `.env.example`, `vigil/config.py`, `contracts.py`, `ingest/*`, `perception/detector.py`, `pose.py`, `tracker.py`, `main.py` skeleton with `/health`, `scripts/` stubs.
- **Tests:** `test_smoke.py` (imports, config loads, weights pull, `/health` green).
- **Verify:** `docker compose build && docker compose up` → `curl localhost:8000/health`; run pipeline on `data/smoke.mp4` → skeleton overlay written; FPS logged ≥10 on the 4060.
- **USP 1 go/no-go:** label 30 frames of real footage with "where is this person looking (zone)" by hand; compare `KeypointRayAttention` (and Gaze-LLE if trialled) agreement → record decision in `docs/go-no-go-day1.md` (full / Tier-A/B only / cut).
- **Gate:** *a real frame produces detections, pose, anonymous tracks, visible backend state.*

### Phase B — Seat anchor + signals + first two events (Day 2, 21 Jul)
- **Write:** `perception/seat_anchor.py`, `signals/head.py`, `wrist.py`, `visibility.py`, `judgment/buffers.py`, `rules.py` (glance + torso only), `baseline.py`, `store/*`, `api/routes_session.py`, `routes_seats.py`, `ws.py` (seatstate + alerts channels).
- **Tests:** unit — `test_head_dir.py` (known-orientation frames), `test_seat_anchor.py` (assignment + quarantine), `test_rules.py` (synthetic buffers: single <1.8 s glance → no event; 3× >P95 → candidate; whitelist suppresses; cooldown); integration — clip → 2 events in DB.
- **Verify:** `pytest tests/unit tests/integration`; `GET /events` shows two real events on the smoke clip with correct seat IDs.
- **Gate:** *≥2 individual behaviours generate real events for the correct anonymous seat.*

### Phase C — Seat graph + fusion + counterfactual card + alert workflow (Day 3, 22 Jul)
- **Write:** `judgment/seatgraph.py`, `fusion.py`, `explain.py`, `api/routes_events.py`, `routes_alerts.py`, web scaffold (`client.ts`, `store.ts`, `AlertQueue`, `AlertCard`, minimal `SeatMap`).
- **Tests:** `test_seatgraph.py` (reciprocal pair fires; no pair when a seat unobservable; evidence IDs resolve), `test_fusion.py` (severity reproducible), **`test_card_matches_db.py` (GUARD 1)**, API tests for accept/dismiss/note → feedback row.
- **Verify:** scripted two-person clip → pair alert in queue whose evidence traces to real individual events; card answers all 14 questions.
- **Gate:** *a scripted two-person interaction creates a real pairwise alert with traceable evidence.*

### Phase D — Dashboard completion + phone candidate + attention overlay + first full run (Day 4, 23 Jul)
- **Write:** `SeatMapEditor`, `LiveFeedPanel` (skeleton toggle + attention layer), `TimelinePanel`, `ReplayModal`, `MetricsPanel`, `perception/objects.py` (phone, N-of-M), `signals/attention.py`, `api/routes_replay.py`, `routes_metrics.py`.
- **Tests:** `test_objects.py` (phone lift → confirmed candidate; absent → none), `test_abstention.py` (occluded seat → unobservable), dashboard click-through.
- **Verify:** occlusion → grey "visibility insufficient"; phone lift at 3–4 m → alert + clip; **full 3-min demo path works once end-to-end.**
- **Gate:** *primary three-minute demo path works once from beginning to end.*

### Phase E — Recording + regression clips R1–R7 + eval harness (Day 5, 24 Jul)
- **Write:** `scripts/record.py`, `annotate.py`, `eval/harness.py`, `eval/regression.py`, `tests/guards/*`.
- **Tests:** `regression.py` asserts the R1–R7 table from §12 of `IMPLEMENTATION_PLAN.md` (R2/R5 → no alert; R3 → individual; R4 → pair; R6 → abstention; R7 → phone/abstain-by-tier).
- **Verify:** harness emits `SessionMetrics` from held-out takes only; **≥1 correct non-alert AND ≥1 abstention demonstrated**; tune thresholds ONLY on tuning takes.
- **Gate:** *at least one correct non-alert and one visibility abstention.*

### Phase F — Freeze + final eval + fallback recording + clean-run proof (Day 6, 25 Jul)
- **Do:** remove unreachable UI paths; final held-out metrics; record the fallback demo by screen-capturing this exact pipeline; capture all §15 PPT assets; run **`test_clean_run.py` (GUARD 2)**: wipe `db` volume → `docker compose up` → scripted clip → demo path reproduces with zero manual DB edits.
- **Gate:** *fresh documented run reproduces the demo without touching the DB.*

### Phase G — Submission (Day 7, 26 Jul)
- Critical fixes only; final smoke; PPT; package. **No new features.**

---

## 13. Anti-Hardcoding Guards (both must pass before freeze)

| Guard | File | Asserts |
|---|---|---|
| G1 `card == DB` | `tests/guards/test_card_matches_db.py` | re-render every alert card from its DB row → string-identical to what WS pushed |
| G2 clean run | `tests/guards/test_clean_run.py` | fresh volume + scripted clip → expected events/alerts appear; no manual inserts anywhere |
| G3 metrics honesty | `eval/harness.py` | refuses to emit a metric with zero supporting rows; every metric carries n |

## 14. Verification Cheat-Sheet

```bash
docker compose build                                  # image
docker compose up -d                                  # run
curl localhost:8000/health                            # models + input ok
docker compose exec app pytest tests/unit             # geometry/rules/graph/fusion
docker compose exec app pytest tests/guards           # G1 + G2 + G3
docker compose exec app python -m vigil.eval.regression   # R1-R7 expectations
docker compose exec app python -m vigil.eval.harness --session <id> --split test
docker compose down -v && docker compose up           # clean-run proof (G2)
```

---

## Immediate next action (Phase A, first hour)

`docker compose build` the app image, pull the rtmlib person+pose ONNX weights into the `weights` volume, and run the smoke clip through `Detector → Pose → ByteTrack` with a skeleton overlay. Then run the **Day-1 USP-1 go/no-go** (head-direction ray → zone agreement on real footage) and record the decision in `docs/go-no-go-day1.md` — it decides whether the Attention Lens ships as a demo layer or is cut to head-direction arrows. Everything else in Phases B–D is identical either way.


