# Vigil Dataset Sources

> Generated: 2026-07-22
> Project: VIGIL — Vision-based Invigilation with Graph Intelligence and expLainability

## Summary

| Dataset | Platform | License | Status |
|---|---|---|---|
| MSU Online Exam Proctoring (OEP) | Kaggle | Pending verification | Pending download |
| CCTV Exam Monitor Dataset | Kaggle | CC0 — Public Domain | Downloaded |
| Cheating Scenario Dataset | Mendeley | CC BY 4.0 | Pending manual download |
| Online Exam Cheating Detection | Roboflow | Pending verification | Pending export |
| SCB-Dataset5 | GitHub / HuggingFace | Research/Academic only | Pending review |

---

## Dataset A: MSU Online Exam Proctoring (OEP)

- **Name:** MSU Online Exam Proctoring Dataset
- **Source Platform:** Kaggle
- **Identifier:** `raajanwankhade/oep-dataset`
- **Download Date:** TBD
- **Version:** Latest (as of 2026-07-22)
- **Archive Size:** TBD
- **Extracted Size:** TBD
- **File Count:** TBD
- **Image Count:** TBD
- **Video Count:** TBD
- **Annotation Format:** TBD (check after download)
- **Original Classes:** TBD (check after download)
- **License:** Pending verification — treat as research-only until confirmed
- **Required Citation:** Raajan Wankhade et al., "Online Exam Proctoring Dataset", Michigan State University CVLab.
- **Commercial-Use Restrictions:** Unknown — verify before commercial use
- **Redistribution Restrictions:** Unknown — verify before redistribution
- **Known Privacy Concerns:** Contains webcam footage of individual examinees; faces may be visible
- **SHA-256:** TBD
- **Accepted for Vigil:** Pending license verification
- **Purpose:** Temporal video analysis, head movement, gaze, hand activity, suspicious action sequences

---

## Dataset B: CCTV Exam Monitor Dataset

- **Name:** CCTV Exam Monitor Dataset
- **Source Platform:** Kaggle
- **Identifier:** `cctvdataset/cctv-exam-monitor-dataset`
- **Download Date:** 2026-07-21
- **Version:** Latest (as of 2026-07-21)
- **Archive Size:** ~625 MB (8,156 images)
- **Extracted Size:** TBD
- **File Count:** 8,156 images
- **Image Count:** 8,156
- **Video Count:** 0
- **Annotation Format:** None (unlabeled images)
- **Original Classes:** N/A (person detection only)
- **License:** **CC0 — Public Domain**
- **Required Citation:** Jonathan Michael Campbell, "CCTV Exam Monitor Dataset", Kaggle.
- **Commercial-Use Restrictions:** None (Public Domain)
- **Redistribution Restrictions:** None (Public Domain)
- **Known Privacy Concerns:** Author claims anonymized. Real exam-hall CCTV. Verify that no names/IDs are visible.
- **SHA-256:** TBD
- **Accepted for Vigil:** YES
- **Purpose:** Primary dataset for exam-hall camera angles and YOLO person detection. Real fisheye/wide-angle CCTV from university exam halls. 30 samples committed to repo; full archive kept locally.

---

## Dataset C: Cheating Scenario Dataset in Online Exam

- **Name:** Cheating Scenario Dataset in Online Exam
- **Source Platform:** Mendeley Data
- **Identifier/DOI:** `10.17632/mjrfmvsh7d.1`
- **Download Date:** TBD
- **Version:** 1
- **Archive Size:** TBD
- **Extracted Size:** TBD
- **File Count:** TBD
- **Image Count:** TBD
- **Video Count:** TBD
- **Annotation Format:** TBD (check after download)
- **Original Classes:** TBD (check after download)
- **License:** **CC BY 4.0** — Creative Commons Attribution 4.0 International
- **Required Citation:** Dataset authors, "Cheating Scenario Dataset in Online Exam", Mendeley Data, doi:10.17632/mjrfmvsh7d.1. CC BY 4.0.
- **Commercial-Use Restrictions:** Allowed with attribution
- **Redistribution Restrictions:** Allowed with attribution
- **Known Privacy Concerns:** Staged cheating scenarios. Verify no real student identities exposed.
- **SHA-256:** TBD
- **Accepted for Vigil:** YES
- **Purpose:** Cheating behavior scenarios in online exam context. Provides labeled suspicious action sequences.

---

## Dataset D: Online Exam Cheating Detection (Roboflow)

- **Name:** Online Exam Cheating Detection
- **Source Platform:** Roboflow Universe
- **Identifier:** `fraud-detection-using-cnn/online-exam-cheating-detection`
- **Download Date:** TBD
- **Version:** TBD (export latest YOLO-compatible version)
- **Archive Size:** TBD
- **Extracted Size:** TBD
- **File Count:** TBD
- **Image Count:** TBD
- **Video Count:** TBD
- **Annotation Format:** TBD (prefer YOLO format if bounding boxes available; else keep as classification only)
- **Original Classes:** TBD (check after export)
- **License:** Pending verification
- **Required Citation:** Roboflow Universe: fraud-detection-using-cnn/online-exam-cheating-detection.
- **Commercial-Use Restrictions:** Unknown — verify before use
- **Redistribution Restrictions:** Unknown — verify before use
- **Known Privacy Concerns:** May be classification-only. Check if bounding boxes available. Verify license.
- **SHA-256:** TBD
- **Accepted for Vigil:** Pending license verification and format check
- **Purpose:** Supplementary exam cheating detection data. May provide phone-visible and looking-around labels.

---

## Dataset E: SCB-Dataset5

- **Name:** SCB-Dataset5 (Student Classroom Behavior Dataset)
- **Source Platform:** GitHub / HuggingFace
- **Identifier:** `Whiffe/SCB-dataset`
- **Download Date:** TBD
- **Version:** SCB-Dataset5 (7,428 images, 106,830 labels, 20 classes)
- **Archive Size:** TBD
- **Extracted Size:** TBD
- **File Count:** TBD
- **Image Count:** 7,428
- **Video Count:** 0
- **Annotation Format:** YOLO-compatible (classroom behavior bounding boxes)
- **Original Classes:** 20 classes including: using-phone, turn-head, lean-on-desk, stand, talk, discuss, sleep, hand-raise, read, write, etc.
- **License:** Research / Academic Use Only. Non-commercial unless written permission obtained.
- **Required Citation:** Whiffe et al., "SCB-Dataset: Student Classroom Behavior Dataset", GitHub: Whiffe/SCB-dataset.
- **Commercial-Use Restrictions:** **Yes — research/academic only.** Written permission required for commercial use.
- **Redistribution Restrictions:** **Yes — do not redistribute without permission.**
- **Known Privacy Concerns:** Real classroom images. Check for student faces/identities.
- **SHA-256:** TBD
- **Accepted for Vigil:** Conditional — accepted for academic/hackathon use; NOT for commercial deployment without permission
- **Purpose:** Classroom behavior detection. Provides phone use, head turning, leaning, standing, and talking labels — closest public dataset to exam-hall behavior detection.

---

## Rejected / Quarantined Sources

- **OEP "cheating_attempt" labels** — Rejected as class names. Only observable event labels used. Direct "cheating" labels are not in Vigil taxonomy.
- **Roboflow "cheating" labels** — Same reason as above.
- **Any samples with visible names, student IDs, or personal information** — Quarantined for privacy.

---

## License Summary

| Dataset | License | Commercial Use | Attribution Required | Redistribution |
|---|---|---|---|---|
| CCTV Exam Monitor | CC0 | Yes | No | Yes |
| OEP (MSU) | Pending | Unknown | Unknown | Unknown |
| Cheating Scenarios | CC BY 4.0 | Yes | Yes | Yes (with attribution) |
| Roboflow Exam | Pending | Unknown | Unknown | Unknown |
| SCB-Dataset5 | Research-only | No | Yes | Without permission |

**Note:** Datasets marked "Pending" must have their licenses confirmed before any redistribution or commercial use. For the hackathon context, they may be used for research/prototyping with appropriate attribution.
