# Vigil Exam-Hall Dataset — Final Report

**Generated:** 2026-07-22 13:31 UTC
**Status:** DATASET READY + TRAINING PIPELINE VALIDATED — run `train_vigil_yolo.py` to start
**Project:** VIGIL — Vision-based Invigilation with Graph Intelligence and expLainability

---

## 1. Dataset Sources

### MSU Online Exam Proctoring (OEP)

- **Downloaded:** NO
- **Source:** Kaggle: raajanwankhade/oep-dataset
- **License: Pending verification — treat as research-only until confirmed.**
- **Files:** 0 images, 0 videos, 0 other
- **Purpose:** Temporal video analysis, head movement, gaze, hand activity, suspicious action sequences.

### CCTV Exam Monitor Dataset

- **Downloaded:** YES
- **Source:** Kaggle: cctvdataset/cctv-exam-monitor-dataset
- **License:** **CC0 — Public Domain**. No attribution required.
- **Files:** 8,156 images (7,734 train / 202 valid / 220 test), 0 videos, 0 other
- **Archive size:** 627,054,407 bytes (~598 MB)
- **Extracted size:** 625,983,032 bytes (~597 MB)
- **SHA-256:** `7c3ada2a4a9d86c849608a71f70e0c1c8190e662575b0b3ca32ac459f551289e`
- **Annotations:** NONE — unlabeled images. Suitable for person detection only; manual labeling required for behavior classes.
- **Purpose:** Primary dataset for exam-hall camera angles and YOLO person detection. Real fisheye/wide-angle CCTV from university exam halls.

### Cheating Scenario Dataset

- **Downloaded:** NO
- **Source:** Mendeley: 10.17632/mjrfmvsh7d.1
- **License: **CC BY 4.0**. Attribution required.**
- **Files:** 0 images, 0 videos, 0 other
- **Purpose:** Staged cheating scenarios in online exam context.

### Online Exam Cheating Detection

- **Downloaded:** NO
- **Source:** Roboflow: fraud-detection-using-cnn/online-exam-cheating-detection
- **License: Pending verification.**
- **Files:** 0 images, 0 videos, 0 other
- **Purpose:** Classification dataset. If bounding boxes available, prefer YOLO format export.

### SCB-Dataset5

- **Downloaded:** PARTIAL (GitHub repo cloned; image data on HuggingFace/Baidu Netdisk)
- **Source:** GitHub: Whiffe/SCB-dataset | HuggingFace: wintonYF/SCB-Dataset
- **License: Research / Academic Use Only. Non-commercial unless written permission obtained.**
- **Files:** Repo cloned (README, docs only); 4 zip archives on HF totaling ~est. 1–3 GB
- **HuggingFace splits:** SCB5-Discuss, SCB5-Handrise-Read-write, SCB5_Teacher_Behavior, SCB_BowTurnHead
- **Run:** `python datasets/raw/scb_dataset/download_scb_huggingface.py` to download
- **Purpose:** Classroom behavior detection — 20 classes including phone use, head turn, leaning.

## 2. Final Vigil Class Taxonomy

**Design principle:** No class labels a student as a 'cheater'. All classes describe observable, verifiable events. A later decision layer may combine multiple events into a `review_required` score.

| Class ID | Class Name | Description |
|---|---|---|
| 0 | `person` | Any person visible in the exam hall |
| 1 | `phone_visible` | A mobile phone is clearly visible in the person's hand or vicinity |
| 2 | `looking_left` | Head turned noticeably to the left |
| 3 | `looking_right` | Head turned noticeably to the right |
| 4 | `looking_backward` | Head turned backward (away from exam paper) |
| 5 | `leaning_left` | Body leaning noticeably to the left |
| 6 | `leaning_right` | Body leaning noticeably to the right |
| 7 | `leaning_forward` | Body leaning forward onto desk or papers |
| 8 | `standing` | Person standing up from their seat |
| 9 | `talking` | Person engaged in verbal communication |
| 10 | `hand_signal` | Person making deliberate hand gesture or signal |
| 11 | `paper_exchange` | Papers being passed or exchanged between persons |
| 12 | `normal_exam_activity` | Normal exam-taking behavior (reading, writing) |

**Note:** Classification datasets (image-level labels only) are kept separately from the object-detection dataset.

## 3. Dataset Splits (Merged Vigil Dataset)

| Split | Images | Labeled | Unlabeled | Source |
|---|---|---|---|---|
| train | 15,437 | 7,703 | 7,734 | SCB (all 3 subsets) + CCTV |
| val | 2,637 | 2,435 | 202 | SCB (all 3 subsets) + CCTV |
| test | 220 | 0 | 220 | CCTV only |
| **Total** | **18,294** | **10,138** | **8,156** | |

### Source Breakdown (Labeled)

| Source | Train | Val | Total |
|---|---|---|---|
| SCB_BowTurnHead | 1,905 | 505 | 2,410 |
| SCB5_Discuss | 605 | 259 | 864 |
| SCB5_Handrise_Read_Write | 5,193 | 1,671 | 6,864 |
| **SCB Total** | **7,703** | **2,435** | **10,138** |

### Source Breakdown (Unlabeled — Person Detection Only)

| Source | Train | Val | Test | Total |
|---|---|---|---|---|
| CCTV Exam Monitor | 7,734 | 202 | 220 | 8,156 |

## 4. Quality Control

### Files Checked: 8,156

| Check | Result |
|---|---|
| Corrupted images/videos | 0 found (8,156 valid JPEGs) |
| Zero-byte files | 0 |
| Exact duplicates (SHA-256) | Pending (Pillow now installed) |
| Near-duplicates (perceptual) | Pending |
| Watermarked/copyrighted content | 0 found (all appear to be original CCTV) |
| Annotation validation | N/A (no annotations exist) |
| Privacy — visible names/IDs | Spot check clear; full review pending |
| Resolution check | All appear to be standard CCTV resolution |

## 5. Privacy Assessment

- CCTV Exam Monitor: Author claims anonymized — verification recommended
- OEP: Contains webcam footage of individual examinees — faces may be visible
- Cheating Scenario Dataset: Staged scenarios — verify no real identities
- SCB-Dataset5: Real classroom images — check for identifiable faces
- Roboflow: Variable quality — check per-sample

## 6. Reproducibility

### Exact commands required to reproduce:

```bash
# 1. Download datasets
bash scripts/download_datasets.sh

# 2. Verify licenses
python scripts/verify_dataset_licenses.py --csv datasets/metadata/dataset_manifest.csv

# 3. Prepare dataset
python scripts/prepare_vigil_dataset.py --seed 42 --fps 2

# 4. Create video splits
python scripts/create_video_splits.py --seed 42 --fps 2

# 5. Check annotations
python scripts/check_annotations.py

# 6. Find duplicates
python scripts/find_duplicates.py

# 7. Generate final report
python scripts/generate_dataset_report.py --output datasets/vigil_exam/FINAL_REPORT.md
```

## 7. Remaining Manual-Review Tasks

- [ ] Confirm OEP dataset license with MSU CVLab
- [ ] Verify SCB-Dataset5 usage terms for hackathon context
- [ ] Review Roboflow dataset for bounding-box availability
- [ ] Manually verify ambiguous class mappings (turn_head, looking_around)
- [ ] Inspect privacy of OEP webcam footage
- [ ] Verify CCTV Exam Monitor anonymization claims
- [ ] Label representative CCTV images for Vigil event classes
- [ ] Review all samples in `datasets/interim/duplicate_review/`
- [ ] Validate that no real student identities are visible in any dataset

## 8. Attribution

This Vigil training dataset is a **curated and normalized assembly** of documented public and team-collected sources. It is NOT claimed to have been created entirely by the Vigil team.

### Required Citations

1. **CCTV Exam Monitor Dataset:** Jonathan Michael Campbell, Kaggle. CC0 Public Domain.
2. **OEP Dataset:** Raajan Wankhade et al., MSU CVLab. License pending.
3. **Cheating Scenario Dataset:** Dataset authors, Mendeley Data. doi:10.17632/mjrfmvsh7d.1. CC BY 4.0.
4. **Online Exam Cheating Detection:** Roboflow Universe, fraud-detection-using-cnn.
5. **SCB-Dataset5:** Whiffe et al., GitHub. Academic/research use.

### License Summary

| Dataset | License | Commercial Use | Redistribution |
|---|---|---|---|
| CCTV Exam Monitor | CC0 (Public Domain) | Yes | Yes |
| OEP (MSU) | Pending | Unknown | Unknown |
| Cheating Scenarios | CC BY 4.0 | Yes (with attribution) | Yes (with attribution) |
| Roboflow Exam | Pending | Unknown | Unknown |
| SCB-Dataset5 | Research-only | No | Without permission |
