# Vigil Dataset Quality Report

> Generated: 2026-07-22

## Quality Checks Performed

All downloaded content is verified through the following checks before inclusion in the Vigil dataset:

1. **File integrity** — corrupted images/videos detected and rejected
2. **Zero-byte files** — empty files rejected
3. **Exact duplicates** — SHA-256 hash comparison removes byte-identical copies
4. **Near-duplicates** — Perceptual hash detects resized/cropped/near-identical frames
5. **Consecutive near-identical frames** — Video frame similarity threshold prevents flooding
6. **Watermark check** — Obviously watermarked/copyrighted movie footage rejected
7. **Annotation validity** — Coordinate ranges (0-1), positive width/height, valid class IDs
8. **Image-label matching** — Every annotated image has a valid label file
9. **Cross-dataset leakage** — Same images appearing in multiple sources quarantined
10. **Privacy review** — Names, student IDs, personal information flagged
11. **Resolution check** — Extremely low-resolution samples flagged
12. **Label-visible-behavior mismatch** — Spot-check labels against visible content
13. **Synthetic/staged images** — Mislabeled synthetic content quarantined

## Acceptance Criteria

| Criterion | Threshold | Action |
|---|---|---|
| File size | > 0 bytes | Zero-byte files → rejected |
| Image resolution | ≥ 64×64 px | Below threshold → quarantined |
| SHA-256 hash | No collision within Vigil | Duplicates → keep one, move rest to duplicate_review |
| Perceptual hash distance | > 5 from nearest | Below threshold → moved to duplicate_review |
| Annotation coordinates | 0.0 ≤ x,y,w,h ≤ 1.0 | Out of range → fix or reject |
| Annotation class ID | 0–12 (Vigil taxonomy) | Invalid ID → reject |
| Label-image match | Same stem, .txt ↔ .jpg | Mismatch → flag for review |
| Privacy | No visible names/IDs | Violation → quarantine |
| License | Known, compatible | Unknown → mark as research-only |

## Results Summary

| Check | Passed | Failed | Quarantined | Pending |
|---|---|---|---|---|
| File integrity | TBD | TBD | TBD | TBD |
| Exact duplicates | TBD | TBD | TBD | TBD |
| Near-duplicates | TBD | TBD | TBD | TBD |
| Annotation validity | TBD | TBD | TBD | TBD |
| Privacy review | TBD | TBD | TBD | TBD |

*Note: Exact counts will be populated after running the full verification pipeline:*

```bash
python scripts/find_duplicates.py --move-duplicates
python scripts/check_annotations.py
```

## Quarantine Directory

Questionable samples are moved to:

```text
datasets/interim/duplicate_review/
```

Each quarantined group is in its own subdirectory with a label describing why it was quarantined.

## Rejection Log

| File | Reason | Date | Resolution |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Notes

- The CCTV Exam Monitor Dataset (8,156 images) is CC0 and unlabeled. Manual labeling is required before these images can contribute to anything beyond person detection.
- OEP dataset contains video — quality checks apply to both original videos and extracted frames.
- All quality checks are deterministic and reproducible with fixed random seed.
- Run `python scripts/generate_dataset_report.py` for the full report including quality metrics.
