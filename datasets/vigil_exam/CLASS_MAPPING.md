# Vigil Class Mapping

> Generated: 2026-07-22
> Source class labels mapped to Vigil observable-event taxonomy.

## Vigil Event Classes (Observable Only — No Cheating Labels)

| ID | Class Name | Source Classes |
|---|---|---|
| 0 | `person` | (pretrained COCO — all datasets) |
| 1 | `phone_visible` | scb3_using_phone, oep_phone, rf_phone, csd_phone |
| 2 | `looking_left` | oep_looking_left |
| 3 | `looking_right` | oep_looking_right |
| 4 | `looking_backward` | — |
| 5 | `leaning_left` | — |
| 6 | `leaning_right` | — |
| 7 | `leaning_forward` | scb3_bow_head, scb3_lean_on_desk |
| 8 | `standing` | scb5_stand |
| 9 | `talking` | oep_talking, scb5_talk, scb5_discuss, csd_talking |
| 10 | `hand_signal` | scb3_hand_raise, csd_hand_gesture |
| 11 | `paper_exchange` | csd_paper_pass |
| 12 | `normal_exam_activity` | scb3_read, scb3_write, oep_normal, rf_normal, csd_normal, scb5_sleep (review) |

## Source-to-Vigil Mapping Table

### SCB-Dataset3 (6 classes)

| Source Class | Vigil Class | Notes |
|---|---|---|
| `hand_raise` | `hand_signal` | |
| `read` | `normal_exam_activity` | |
| `write` | `normal_exam_activity` | |
| `using_phone` | `phone_visible` | |
| `bow_head` | `leaning_forward` | |
| `lean_on_desk` | `leaning_forward` | |

### SCB-Dataset5 (additional classes from 20-class set)

| Source Class | Vigil Class | Notes |
|---|---|---|
| `turn_head` | `looking_left` | **AMBIGUOUS** — direction unspecified. Mark for manual review. |
| `sleep` | `normal_exam_activity` | **REVIEW** — sleeping is not normal exam activity; map to review-required signal. |
| `stand` | `standing` | |
| `talk` | `talking` | |
| `discuss` | `talking` | Merged into talking class. |

### OEP (MSU Online Exam Proctoring)

| Source Class | Vigil Class | Notes |
|---|---|---|
| `normal` | `normal_exam_activity` | |
| `looking_left` | `looking_left` | |
| `looking_right` | `looking_right` | |
| `talking` | `talking` | |
| `phone` | `phone_visible` | |
| `cheating_attempt` | **REJECTED** | Direct cheating label — do not use. |

### Cheating Scenario Dataset (Mendeley)

| Source Class | Vigil Class | Notes |
|---|---|---|
| `looking` | `looking_left` | **AMBIGUOUS** — direction unspecified. |
| `talking` | `talking` | |
| `phone` | `phone_visible` | |
| `paper_pass` | `paper_exchange` | |
| `hand_gesture` | `hand_signal` | |
| `normal` | `normal_exam_activity` | |

### Roboflow Exam Cheating Detection

| Source Class | Vigil Class | Notes |
|---|---|---|
| `cheating` | **REJECTED** | Direct cheating label — do not use. |
| `normal` | `normal_exam_activity` | |
| `looking_around` | `looking_left` | **AMBIGUOUS** — direction unspecified. |
| `phone` | `phone_visible` | |

## Design Principles

- **No class labels a student as a "cheater"** — all classes describe observable, verifiable events
- A later Vigil decision layer may combine multiple events into a `review_required` score
- Classification datasets (image-level labels only) are kept separately from the object-detection dataset
- Classes with insufficient reliable samples may be dropped from the final taxonomy
- Ambiguous mappings are marked for manual review before model training

## Ambiguous Mappings (Manual Review Required)

| Source Class | Tentative Mapping | Issue |
|---|---|---|
| `scb5_turn_head` | `looking_left` | Direction not specified — could be left/right/backward |
| `rf_looking_around` | `looking_left` | "Looking around" is non-specific |
| `csd_looking` | `looking_left` | Direction not specified |
| `scb5_sleep` | `normal_exam_activity` | Sleeping is suspicious — needs review-required flag |
| `oep_cheating_attempt` | REJECTED | Direct cheating label — do not use |
| `rf_cheating` | REJECTED | Direct cheating label — do not use |
