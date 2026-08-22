# Vigil Exam-Hall Behavior Dataset (v2 — post-audit)

## What changed after the audit

| Audit finding | Fix applied |
|---|---|
| 9 of 13 classes were ghosts (0 instances) | Taxonomy reduced to **6 classes**: 5 learned + `person` (pretrained) |
| Test split had 0 labeled images | Rebuilt split now has **1,553 labeled test images** |
| SCB's own train/val folders overlapped numerically | All samples re-split at **session-group level** (455 groups, 0 spanning splits) |
| Misleading "13-class" claims | YAML is now `nc: 6`; class IDs remapped in every label file |

## Current taxonomy (`vigil_exam.yaml`, nc=6)

| ID | Class | Instances | Source |
|---|---|---|---|
| 0 | `person` | 0 from SCB | **COCO-pretrained YOLO11-s only** — stated honestly, not learned here |
| 1 | `looking_left` | 11,156 | SCB BowTurnHead (turn_head) |
| 2 | `leaning_forward` | 4,962 | SCB BowTurnHead (bow_head) |
| 3 | `talking` | 5,392 | SCB5 Discuss |
| 4 | `hand_signal` | 13,453 | SCB5 hand_raise |
| 5 | `normal_exam_activity` | 33,919 | SCB5 read/write |

## Splits (session-grouped, seed=42, deterministic)

| Split | Labeled images | Notes |
|---|---|---|
| train | 7,006 | + 7,734 unlabeled CCTV images (person-detection inference only) |
| val | 1,579 | + 202 unlabeled CCTV |
| test | 1,553 | + 220 unlabeled CCTV |

Verification (run after build): 0 cross-split stem overlap, 0 of 455 session
groups span splits, 0 orphaned images/labels, 0 out-of-range class IDs.

Known imbalance: `talking` lands mostly in test (1,475 test vs 137 val) because
the Discuss subset has few sessions — the honest cost of session-level splitting.

## What this dataset validates vs does NOT validate

**Validates:** per-class detection AP of the 5 SCB behavior classes on SCB
classroom imagery.

**Does NOT validate:**
- Exam-hall CCTV transfer — SCB is classroom data; CCTV images here are unlabeled
- `phone_visible`, `looking_right`, `looking_backward`, `leaning_left/right`,
  `standing`, `paper_exchange`, chit/earpiece detection — 0 instances, not in taxonomy
- Gaze/attention field, seat-graph pairwise evidence, counterfactual alerts,
  per-seat baselines, abstention — not part of detection training
- FP-per-student-hour — requires the tracked video pipeline, not this dataset

## Rebuild

```bash
python scripts/build_vigil_dataset.py --seed 42   # rebuild splits + YAML
python scripts/train_vigil_yolo.py                # train + per-class AP on test
```

## Licensing

SCB-Dataset5 is **research/academic use only** (see `datasets/licenses/`).
CCTV Exam Monitor is CC0. Attribution details: `../DATASET_SOURCES.md`.
