# Phase 1-2 — Detection, Pose, Tracking, Seat-Anchor

**Date:** 2026-07-22
**Deliverables:** `out_phase2_tracked.mp4` (skeleton + seat + track overlay video),
`out_phase2_events.json` (per-frame `{seat_id, track_id, keypoints, timestamp}` stream).
`out_phase1_*` are the pre-tracking intermediate (detection+pose only) kept for comparison.

## Stack used (matches spec §16)

| Stage | Model | License | Notes |
|---|---|---|---|
| Person detection | **YOLO11-s** (`ultralytics`, person class only) | **AGPL-3.0** | See license flag below |
| Pose | **RTMPose-m** via `rtmlib`, ONNX, CUDA execution provider | Apache-2.0 | |
| Tracking | **ByteTrack** via `supervision` | MIT | `supervision` flags it deprecated as of v0.28 (removal in v0.30) but functional; fine for prototype, revisit before v0.30 lands |
| Seat-anchor | custom, `shapely` polygon-overlap | — | snaps each track to the seat polygon with greatest bbox-overlap fraction (≥15% of person bbox area required, else "unassigned") |

## ⚠️ License flag: YOLO11 / ultralytics is AGPL-3.0

Per your instruction to flag rather than silently work around this: **ultralytics' YOLO11 weights and
code are AGPL-3.0**. That's fine for this prototyping phase, but AGPL is a strong copyleft license —
if VIGIL is ever shipped as a network-accessible service using YOLO11, AGPL's terms could require
releasing the full backend source. Two paths before any real deployment:
1. Buy an Ultralytics Enterprise license (their commercial-use exception), or
2. Swap the detector for a permissively-licensed alternative — the spec's own backup, **RT-DETR-R18
   (Apache-2.0)**, is the natural substitute and was already scored as a viable backup in §16.

Not blocking for the hackathon prototype; blocking before any commercialization or public deployment.

## Test video

No exam-hall footage exists yet, and (per your call) I didn't record from this machine's webcam either
— instead I sourced a free-license Pexels stock clip ("Students Sitting in the Classroom," Yan Krukau,
Pexels License — free for commercial/personal use, no attribution required): 1920x1080, 25fps, 9.3s,
233 frames, 4-10 people in frame. **This is a ground-level stock-video classroom, not an elevated
CCTV exam-hall angle** — it validates pipeline mechanics (detection, pose, tracking, seat-snap, JSON
schema), not real hall geometry or distance tiers. That validation still needs your own §18 recordings.

## Detection + Pose (Phase 1)

Clean results — YOLO11-s correctly boxes every visible person including a mid-air jump pose; RTMPose-m
traces full-body skeletons accurately even through fast motion. See `out_phase1_skeleton.mp4`.

## Tracking + seat-anchor quality (Phase 2) — the thing you actually asked to review

**Measured pipeline throughput: 6.9 fps** on this machine's RTX 3050 (1080p, GPU pose + GPU detection).
Below the spec's ≥10fps MVP target (§2). Two knobs not yet pulled: YOLO is called frame-by-frame via
`.predict()` with per-call overhead rather than a persistent stream call, and no half-precision. Worth
optimizing before the next phase, not done here since you asked to review tracking quality first.

**Raw ByteTrack ID churn is real and worth seeing plainly:** 21 unique track IDs were assigned over 233
frames for a scene with 4-10 people. Breakdown by seat:

| Seat | Unique track IDs that occupied it |
|---|---|
| A1 | 2 (stable — mostly-still seated student) |
| A2 | 2 (stable) |
| A3 | 3 |
| B1 | **7** (1, 8, 12, 13, 15, 16, 17 — most short-lived) |
| B2 | 3 |

The long-lived, low-churn tracks (2, 3, 4, 6 — each alive for 160-233 of 233 frames) all belong to
students who stay seated and roughly still. **All the churn concentrates on the one subject who jumps,
walks around, and re-enters frame** (seat B1) — exactly the fast/non-rigid motion ByteTrack (a
motion+IOU tracker, no appearance ReID) is weakest at, and exactly the kind of movement real exam-hall
footage should rarely contain (seated students, mostly small motions).

**The seat-anchor layer does what §12/USP-E claims it should do**: even as B1's raw track ID churned
through 7 different IDs, every one of those IDs correctly snapped to seat B1 whenever that student was
near her desk — the *seat* identity stayed correct and continuous even though the *tracker* identity
didn't. That's the mechanism the spec is betting on to make raw MOT ID-switches a non-problem for
downstream seat-timeline logic, and this test is a real (if small) demonstration that it works, not
just a design claim.

**Caveat:** this is one 9-second clip with one adversarial (jumping) subject, not a benchmark. Real
validation needs your own recorded sessions with the scripted occlusion/stretch/pass-object scenarios
from §18, and the formal metrics from §17 (HOTA/IDF1/IDSW, seat-attribution accuracy with/without
the anchor layer — ablation E2 in the Final Decision Tables).

## Seat-anchor config format

`seatmap.json` — N hand-defined polygons per camera, each mapping to a `seat_id`:
```json
{"seats": [{"seat_id": "A1", "polygon": [[x,y], [x,y], [x,y], [x,y]]}, ...]}
```
Snapping rule: for each tracked person, compute bbox∩polygon overlap area for every seat, assign the
seat with the largest overlap fraction (of the person's own bbox area), require ≥15% or leave
`seat_id: null` ("unassigned" — shown grey/unlabeled in the overlay, matching the spec's
"unobservable, never guess" posture rather than force-assigning a wrong seat).

## JSON event schema (as requested)

Flat list, one record per person per frame:
```json
{
  "frame_idx": 180, "timestamp_s": 7.2,
  "track_id": 17, "seat_id": "B1", "seat_overlap_frac": 0.62,
  "bbox_xyxy": [968.0, 5.0, 1367.0, 1080.0], "det_confidence": 0.91,
  "keypoints": [[x,y], ...  17 COCO keypoints],
  "keypoint_scores": [0.0-1.0, ... 17]
}
```

## Explicitly not built yet (per your instruction)

No rule engine, no FastAPI backend, no gaze-mass fusion. This is tracking-quality review only.
