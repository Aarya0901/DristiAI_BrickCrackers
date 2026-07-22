# Test data

## `samples/` (committed)

30 real exam-hall CCTV frames, curated from the **CCTV Exam Monitor Dataset**
(Kaggle, `cctvdataset/cctv-exam-monitor-dataset`, by Jonathan Michael Campbell).

- **License: CC0 — Public Domain.** No attribution required, free to use/redistribute/modify.
- Real fisheye/wide-angle CCTV cameras mounted in actual university exam halls and computer
  labs, timestamped, multiple rooms. Students seated in rows at real distance tiers (front row
  close, back rows far) — this is the closest thing to our actual target deployment geometry
  we've tested against so far, much closer than the classroom stock photos/video used in Phase 0-2.
- Already anonymized by the dataset author (no identifiable faces claimed).
- Images only, no bounding-box labels included in this export, no video (single frames, not
  continuous footage — so it doesn't help with motion/tracking-continuity testing, only
  detection/pose/gaze-target testing at realistic hall geometry).

## `cctv_exam_monitor_dataset.zip` (gitignored, local only)

The full 8,156-image dataset (~625MB), kept locally for deeper testing. Not committed —
too large for a normal git push. Re-download with:
```
curl -L "https://www.kaggle.com/api/v1/datasets/download/cctvdataset/cctv-exam-monitor-dataset" \
  -o backend/data/cctv_exam_monitor_dataset.zip
```
(No Kaggle login/API key needed — the dataset owner made it fully public.)
