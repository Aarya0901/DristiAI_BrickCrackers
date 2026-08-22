# Vigil Dataset Split Report

> Generated: 2026-07-22

## Split Configuration

- **Random seed:** 42
- **Train ratio:** 0.70
- **Validation ratio:** 0.15
- **Test ratio:** 0.15
- **Frame extraction FPS:** 2
- **Split method:** Per-source (participant/video), preventing frame-level leakage

## Leakage Prevention

The following measures prevent data leakage:

- Splits are at the **source participant / video level**, NOT individual frames
- Consecutive frames from the same video stay in the same split
- No frame appears in multiple splits
- Adjacent frames from the same sequence are never split across train/val/test
- The same participant does not appear in both training and test sets
- Images duplicated across multiple public datasets are detected and moved to quarantine

## Split Statistics

| Split | Images | Labels | Videos |
|---|---|---|---|
| train | TBD | TBD | TBD |
| val | TBD | TBD | TBD |
| test | TBD | TBD | TBD |

*Note: Exact counts will be populated after the full dataset preparation pipeline runs. The CCTV Exam Monitor Dataset (8,156 unlabeled images) is assigned to `train/` for manual labeling.*

## Dataset Sources by Split

Source videos/participants are assigned to splits as follows:

### Train
- CCTV Exam Monitor: all images (unlabeled, for person detection and manual labeling)
- OEP: ~70% of participant videos
- Cheating Scenarios: ~70% of scenario videos
- SCB-Dataset5: ~70% of source splits (if original splits available)
- Roboflow: ~70% (if exported)

### Validation
- OEP: ~15% of participant videos
- Cheating Scenarios: ~15% of scenario videos
- Remaining sources: ~15% each

### Test
- Remaining ~15% from each source

## Sequential Data Handling

For temporal modeling, consecutive frame sequences are preserved:

| Split | 16-frame seqs | 32-frame seqs | 64-frame seqs |
|---|---|---|---|
| train | TBD | TBD | TBD |
| val | TBD | TBD | TBD |
| test | TBD | TBD | TBD |

Sequences use 50% overlap between windows. No sequence spans multiple splits.

## Notes

- The CCTV Exam Monitor Dataset contains images only (no videos), so it is used solely for person detection and static behavior labeling.
- OEP videos are split at the participant level — all frames from a given participant's video go to a single split.
- All splits are deterministic (fixed seed = 42). Re-running with the same seed produces identical splits.
- Run `python scripts/create_video_splits.py --seed 42` to regenerate splits.
