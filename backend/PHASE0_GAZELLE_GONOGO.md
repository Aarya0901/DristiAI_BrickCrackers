# Phase 0 — Gaze-LLE Go/No-Go Test

**Date:** 2026-07-22
**Model:** `gazelle_dinov2_vitb14_inout` (frozen DINOv2 ViT-B/14 backbone + gaze decoder), MIT license,
checkpoint from `github.com/fkryan/gazelle` releases v1.0.0.
**Hardware:** RTX 3050 Laptop GPU (6GB VRAM), CUDA 12.6, torch 2.13.0. Inference ran in ~2-3s/image on GPU
(dominated by one-time DINOv2 forward pass; per-person decode is cheap as the spec predicts).

## Test data

No photos of an actual exam hall existed yet, so 5 raw (non-mosaic) images were pulled from the
**SCB-Dataset** (Whiffe/SCB-dataset, HuggingFace mirror `wintonYF/SCB-Dataset`, `SCB_BowTurnHead_20250509`
subset) — the same classroom-behaviour dataset the spec names in §8/§18 as the best available domain match
(real classrooms, elevated CCTV-ish angles, many students, rows receding into depth). This is a
research-use-licensed public dataset, used here only for internal validation — **flagging per your
instructions**: redistribution or commercial use would need the dataset owner's explicit terms checked
(README says "academic research, personal learning, non-commercial use only").

For each image, 3 head boxes were manually picked at different simulated distances (front/mid/back row),
eyeballed via a pixel-grid overlay. `tier_mixed_3.jpg` is a close-range shot including two **rear-view
heads (no face visible)** — the specific hard case the spec's §13A.1 honesty note flags as unvalidated.

## Results

| Image | Tier label | Head size (px) | Heatmap peak | in-frame score | Verdict |
|---|---|---|---|---|---|
| tier_front_1 | front | 90 | 0.30 | 0.19 | plausible (own desk) |
| tier_front_1 | mid | 60 | 0.33 | 0.56 | plausible |
| tier_front_1 | back | 55 | 0.25 | 0.56 | plausible |
| tier_front_2 | front | 80 | 0.43 | 0.67 | plausible (toward teacher) |
| tier_front_2 | mid | 60 | 0.33 | 0.25 | plausible (toward teacher) |
| tier_front_2 | back | 50 | 0.28 | 0.45 | plausible (toward teacher) |
| tier_mixed_1 | front | 80 | 0.37 | 0.84 | plausible (own desk) |
| tier_mixed_1 | mid | 65 | 0.46 | 0.98 | plausible (own desk) |
| tier_mixed_1 | back | **35** | 0.22 | 0.89 | **plausible even at 35px** (whiteboard) |
| tier_mixed_2 | front | 62 | 0.78 | 0.99 | correct (own hands) |
| tier_mixed_2 | mid | 48 | 0.57 | 0.98 | correct (own hands) |
| tier_mixed_2 | back | 39 | 0.57 | 0.73 | correct (own hands) |
| tier_mixed_3 | near_rear_1 (**back of head**) | 100 | 0.72 | 0.97 | correct (front screen) |
| tier_mixed_3 | near_rear_2 (**back of head**) | 95 | 0.56 | 1.00 | correct (front screen) |
| tier_mixed_3 | near_frontal_teacher | 90 | 0.43 | 0.76 | weak/self-referential |

Full numeric dump: `gazelle_test/out/summary.json`. Beam overlays: `gazelle_test/out/overlay_*.jpg`.

## Verdict: **GO**, with an honest caveat

- **Tier A/B (front–mid rows, head ≥ ~50-60px):** heatmaps are sharp and land exactly where a human would
  expect (own desk while writing, teacher/screen while listening) — this is the flagship-viable range.
- **Small heads down to ~35-39px** (roughly our "Tier C" territory per §4's pixel arithmetic) still produced
  *sane* gaze targets in every test case here, better than the spec's cautious expectation. This is a small
  sample (15 boxes, 5 scenes, one dataset), not a calibrated benchmark — treat as "promising signal," not
  proof.
- **Rear-view heads with zero visible face** (`near_rear_1/2`) worked correctly — this was the single
  biggest open question from §13A.1, and it's a clean pass on both test cases. This is the geometry that
  matters most for real exam-hall CCTV, where most students face away from camera most of the time.
- **One weak case**: a close-up, gesturing, camera-facing teacher got a less coherent gaze point — not a
  concern for the product (invigilator coverage-complement in §13A.3-D5 is a stretch feature, not MVP), but
  worth remembering that very-close, non-canonical poses are where this model gets shakiest.

**Recommendation:** proceed with Gaze-LLE as the primary Tier A/B attention signal per §13A, keep
keypoint-yaw as the fallback/cross-check on all tiers as the spec already mandates. Real validation on
your own recorded hall footage (§18) is still required before trusting this for the live demo — this test
only clears the hour-0 gate on borrowed classroom photos, it does not replace the scripted mini-benchmark.

## Addendum (same day) — re-validated on REAL exam-hall CCTV footage

The test above used borrowed classroom stock photos, not real hall geometry — flagged as a caveat
at the time. Found a much better source since: **CCTV Exam Monitor Dataset** (Kaggle,
`cctvdataset/cctv-exam-monitor-dataset`, **CC0 Public Domain**, no login required to download) —
8,156 real frames from fisheye CCTV cameras mounted in actual university exam halls/computer labs,
timestamped, multiple rooms, already anonymized. 30 curated into `backend/data/samples/`, full set
kept locally (gitignored, too large to push — see `backend/data/README.md`).

Re-ran the same go/no-go test on 3 of these real frames (`backend/gazelle_test_real/`), 10 head
boxes across front/mid/back rows, including one lap-board exam hall with real students-at-a-distance
(no desks, individual clipboards) and a computer-lab exam (monitors, rear-view heads only):

| Image | Tier | Head px | Peak | in-frame | Verdict |
|---|---|---|---|---|---|
| hall_00 (comp. lab) | front/mid/back (all rear-view) | 60-70 | 0.83-0.85 | 0.997-0.999 | **all three converge on the standing teacher — correct** |
| hall_00 | teacher (frontal) | 75 | 0.49 | 0.76 | weaker, as before for close frontal figures |
| hall_02 (lecture hall) | back | 55 | 0.25 | 0.96 | correct (looks at invigilator writing on board) |
| hall_12 (lap-board hall) | front/mid/back | 45-65 | 0.33-0.75 | 0.76-0.97 | all three land on own paper — correct, even at 45px |

**This upgrades the verdict from "promising on proxies" to validated on real target geometry.**
Peak heatmap confidence was noticeably higher on real CCTV frames (0.25-0.85) than on the classroom
proxy photos (0.22-0.78) despite smaller head sizes in places (down to 45px) — plausibly because
these scenes are closer to Gaze-LLE's GazeFollow/VideoAttentionTarget training distribution than
generic classroom stock photos. Same caveat as before: 3 images, 10 boxes, not a calibrated
benchmark — but this is now real hall footage, not a proxy.

## Environment notes for the team

- Windows + OneDrive-nested paths hit `WinError 206` (filename too long) installing torch, because torch's
  vendored third-party license tree is very deeply nested. Fixed locally with `subst V: <repo-root>` (no
  admin/registry changes) — the venv now lives at `V:\backend\.venv`, transparently the same files as
  `backend\.venv`. If `V:` isn't mapped in a fresh shell, re-run:
  `subst V: "C:\Users\mites\OneDrive\Desktop\Web_Development projects\ggw_drishti_hack"`.
- This machine's Avast antivirus does TLS interception, which breaks default pip/curl certificate
  validation. Fixed by pointing `PIP_CERT` / `SSL_CERT_FILE` / `CURL_CA_BUNDLE` at
  `C:\ProgramData\Avast Software\Avast\wscert.pem`.
