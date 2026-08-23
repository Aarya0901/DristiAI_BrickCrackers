# Vigil Exam-Behavior YOLO Pipeline — Phase 0-4

Diagnostic + data pipeline for retargeting `vigil_yolo_4cls_best.pt` onto the
new 5-class taxonomy (`person, cheating_posture, cheating_phone, edge_cases,
normal`), stopping **at the imbalance-audit gate** — no fine-tuning code is
included here on purpose (see "Why Phase 5-7 aren't here" below).

## Install

```bash
pip install ultralytics opencv-python pillow pyyaml
```

`ultralytics` pulls in `torch` — if you're on a machine with a GPU, install
the matching CUDA build of torch *before* `pip install ultralytics` so it
doesn't grab a CPU-only wheel by default.

## Files

```
config.py                          # every path/threshold, nothing hardcoded elsewhere
common/
  logging_utils.py                 # shared logger + Counter (event tally) helper
  yolo_io.py                       # YOLO label read/write, box clipping, ahash dedup
phase0_model_sanity_check.py       # diagnose the person-detection failure
phase1_dataset_label_audit.py      # tally + validate the legacy dataset on disk
phase2_label_schema_remap.py       # 4-class -> 5-class id remap, before/after report
phase3_video_frame_extraction.py   # video -> labeled frames (3 sub-modes, see below)
phase4_merge_imbalance_audit.py    # merge everything, THE GATE report
```

## Assumptions I made (check these against your actual repo before running)

- Legacy dataset layout: `datasets/vigil_exam/{images,labels}/{train,val}/`,
  taxonomy declared in `datasets/vigil_exam/vigil_exam.yaml` (`nc` + `names`).
  If your legacy split folders are named differently, either rename them or
  pass `--old-images-dir` / `--old-labels-dir` explicitly.
- Legacy class *names* on disk are exactly `person`, `leaning_forward`,
  `hand_signal`, `normal_exam_activity` — this is what gets matched against
  `config.OLD_TO_NEW_CLASS_MAP`. If the real names differ, edit that dict
  (matching is by name, resolved through the yaml, specifically so it's
  immune to old/new integer ids colliding by coincidence).
- Raw video folders: `datasets/new_data/{cheating_phone,cheating_posture,
  edge_cases,normal_baseline}/`, containing `.mp4/.mkv/.avi/.mov/.webm` clips.
- **Phase 3's box-labeling design decision**: since you don't have per-frame
  behavior annotations, only per-*clip* labels, I built a manifest workflow
  (`--mode generate-manifest`) that gives you one row per video to optionally
  narrow to the verified action interval (`start_sec`/`end_sec`) before
  extraction. By default (`dual_annotation=True`) every detected person box
  is written TWICE per frame — once as `person`, once as the clip's
  behavior class, at identical coordinates — because the final schema keeps
  `person` as its own class alongside the behavior classes. Pass
  `--no-dual-annotation` if you instead want only the behavior-class box.
- Phase 3/4 group video-derived frames by **clip_id** (source video), never
  splitting one clip's frames across train and val — mixing near-identical
  frames from the same clip across the split is a classic way to quietly
  inflate validation mAP.
- Legacy data's *existing* train/val split is respected as-is in Phase 4,
  not reshuffled (it's presumably already curated).

Every one of these is a `config.py` field or CLI flag — nothing is buried
inline in the phase scripts.

## Run order

```bash
# 0. Figure out why `person` isn't detecting.
python phase0_model_sanity_check.py --root /path/to/DristiAI_BrickCrackers

# 1. Audit the legacy dataset as it exists on disk right now.
python phase1_dataset_label_audit.py --root /path/to/DristiAI_BrickCrackers

# 2. Remap leaning_forward/hand_signal/normal_exam_activity/person -> new schema.
python phase2_label_schema_remap.py --root /path/to/DristiAI_BrickCrackers

# 3a. Build the video manifest, then (optionally) hand-edit start/end seconds.
python phase3_video_frame_extraction.py --mode generate-manifest --root /path/to/DristiAI_BrickCrackers
#     ... edit datasets/new_data/video_manifest.csv if a behavior only
#     covers part of a clip ...

# 3b. Extract labeled frames from the (possibly-edited) manifest.
python phase3_video_frame_extraction.py --mode extract --root /path/to/DristiAI_BrickCrackers

# 3c. Spot-check alignment before trusting any of it.
python phase3_video_frame_extraction.py --mode visualize --root /path/to/DristiAI_BrickCrackers --sample-n 40
#     -> open datasets/vigil_exam_v2/_staging/phase3_debug_viz/*.jpg and eyeball them

# 4. Merge + THE GATE.
python phase4_merge_imbalance_audit.py --root /path/to/DristiAI_BrickCrackers
```

Every script also accepts `--root` as the only flag you usually need — all
other paths derive from it — plus individual `--old-images-dir`,
`--person-detector-ckpt`, etc. overrides. Run any script with `--help` for
the full flag list.

## Reading `reports/imbalance_report.json` before Phase 5

Phase 4 prints a "WHAT TO CHECK BEFORE PHASE 5" section at the end of its
run and writes three files to `datasets/vigil_exam_v2/reports/`:

- **`imbalance_report.json` / `.csv`** — per-class train/val box + image
  counts, two class-weighting schemes (`inverse_frequency` and
  `effective_number` — the latter, from Cui et al. 2019's "Class-Balanced
  Loss", degrades more gracefully than raw inverse-frequency when a class
  has very few boxes), and a capped recommended oversampling ratio per class.
- **`cooccurrence_matrix.csv`** — how often each class pair appears in the
  same image, per split.

Concretely, before writing/running Phase 5:

1. **Any class at 0 train boxes?** Fine-tuning as-is will just never learn
   to predict it — fix data collection first, don't proceed.
2. **Max/min box-count ratio.** >20x is severe (oversample toward the
   capped ratios in the report, consider focal loss, don't let further
   background/`normal` injection widen the gap further). 5-20x is
   moderate (class weighting from the report is likely enough). <5x is mild.
3. **Any class under ~100 total train boxes?** Expect high metric variance
   on that class no matter what weighting you use — that's a data problem,
   not a training-hyperparameter problem.
4. **`cooccurrence_matrix.csv`** — classes that *always* co-occur may be a
   remap/annotation artifact (e.g. every `cheating_phone` box always
   dragging along the same mislabeled `edge_cases` box) rather than a real
   pattern; investigate outliers before trusting the split.
5. **`n_images_with_zero_boxes`** (in both `train` and `val` blocks of the
   JSON) — background-only frames are fine in moderation but a high
   fraction can bias the model toward predicting nothing.

Once you've picked final class weights / oversampling parameters from that
report, that's the signal to move on to Phase 5 (fine-tuning) — deliberately
not included here per the plan's imbalance-mitigation gate.

## Why Phase 5-7 aren't in this deliverable

Per the brief: fine-tuning (Phase 5), the two-track validation suite
(Phase 6), and pipeline wiring (Phase 7) are held back until the Phase 4
imbalance numbers above are reviewed and mitigation parameters (class
weights, oversampling ratios, whether to inject more background frames)
are actually decided — not guessed at generation time. Once you've reviewed
`imbalance_report.json` and settled on those parameters, ask and I'll write
Phase 5-7 against them directly (e.g. wiring the class weights straight into
the `ultralytics` training call rather than leaving them as another
unused config knob).
