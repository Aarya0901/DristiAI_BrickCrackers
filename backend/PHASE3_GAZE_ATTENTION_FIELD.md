# Phase 3 — Gaze-LLE wired onto the tracked pipeline (Drishti Attention Field, first cut)

**Date:** 2026-07-22
**Deliverables:** `out_phase3_gaze.mp4` (skeleton + seat zones + track/seat IDs + gaze beams),
`out_phase3_events.json` (per-frame events extended with per-seat gaze-mass).
**Script:** `gaze_track_pipeline.py`.

## What this adds on top of Phase 2

For every tracked person, each keyframe:
1. **Head bbox from RTMPose keypoints** (nose/eyes/ears, COCO idx 0-4) — free, per §13A.1. Falls
   back to a top-of-bbox estimate when no facial keypoint is confident (fully rear-view heads,
   which is most of this test video and most of real exam-hall footage).
2. **Gaze-LLE inference** at a 5-frame stride (~5Hz on this 25fps video — the spec's recommended
   4-6Hz keyframe cadence; scene encode is the expensive part, not worth doing every frame).
3. **Per-seat gaze-mass** (§13A.2): each person's 64x64 heatmap is normalized to sum to 1, then
   summed inside each seat polygon's rasterized mask → a continuous 0-1 attention-mass value per
   seat, per person, per keyframe — this is the number B1-B3/C1/C3 rule gates would threshold on.
4. **Desk-leakage aggregate** (§13A.3-D1, proof-of-concept only): sums every person's gaze-mass on
   seats *other than their own* over the whole clip — a first cut at "which desk received the most
   foreign attention."

Between keyframes, the last computed gaze result carries forward for the video overlay (marked
`is_keyframe: false` in the JSON) rather than faking new inference.

## Result

**8.06 fps measured** — actually slightly faster than Phase 2's 6.9fps despite the added model,
because gaze only runs 1-in-5 frames and its cost is amortized. Still below the ≥10fps MVP target;
same unaddressed optimizations noted in the Phase 1-2 report (persistent YOLO stream, half-precision).

**Visual result is the first real demonstration of reciprocal-gaze evidence** (§13, the flagship
seat-graph mechanism): at frame 180, students at seats A1-A3 all show gaze beams converging on the
student walking near seat B1, and *her* beam points back toward them — a genuine reciprocal-attention
pattern, computed from the model, not scripted. This is exactly the raw signal the seat-graph
correlator (C1: reciprocal glances) would threshold and turn into a pair-evidence alert.

Desk-leakage totals over the 9.3s clip (all seats show nonzero foreign attention, as expected — this
stock video has kids reacting to each other and one student walking/jumping through the room, not a
calm exam session):

| Seat | Cumulative foreign gaze-mass |
|---|---|
| B2 | 62.5 |
| B1 | 52.0 |
| A2 | 48.5 |
| A1 | 42.2 |
| A3 | 12.6 |

These numbers have no calibrated meaning yet (no baseline, no session normalization) — they're a
mechanism check, not a metric. E8 in the spec's experiment matrix (leak-desk top-K hit-rate on
*scripted* copy events) is the real test, and needs your own recorded scripted sessions.

## What's still missing before this is the real flagship feature

- **Real exam-hall video**, not a stock clip — everything above still runs on the Pexels classroom
  video for continuity of motion; the CC0 CCTV dataset added this session is images-only, so it
  validated Gaze-LLE's *accuracy* on real hall geometry (see PHASE0 addendum) but not the
  *tracking+gaze-over-time* mechanism, which still needs real video.
- Gaze-mass gating thresholds (θ_mass ≈ 0.15 per §13A.2) — not tuned, no rule engine yet (by design,
  still not building that per your original instruction).
- D1 leakage is a raw cumulative sum here, not the rolling-window/baseline-normalized version §13A.3
  specifies.
- No whitelist zones yet (board/clock/invigilator/door) — this test's seatmap only has student seats.

## Explicitly not built yet

No rule engine, no FastAPI backend, no severity/fusion logic, no counterfactual cards. Still pure
perception-layer plumbing per your original phasing.
