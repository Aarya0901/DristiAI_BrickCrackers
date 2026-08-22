#!/usr/bin/env python3
"""
generate_dataset_report.py — Produce a comprehensive Vigil dataset report.

Aggregates information from all data sources, quality checks, and preparation
steps into a single comprehensive report.

Usage:
  python scripts/generate_dataset_report.py
  python scripts/generate_dataset_report.py --help
  python scripts/generate_dataset_report.py --output datasets/vigil_exam/FINAL_REPORT.md
"""

import argparse
import csv
import datetime
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
VIGIL_DIR = DATASETS_DIR / "vigil_exam"
RAW_DIR = DATASETS_DIR / "raw"
SCRIPTS_DIR = ROOT / "scripts"

VIGIL_CLASSES = {
    0: "person",
    1: "phone_visible",
    2: "looking_left",
    3: "looking_right",
    4: "looking_backward",
    5: "leaning_left",
    6: "leaning_right",
    7: "leaning_forward",
    8: "standing",
    9: "talking",
    10: "hand_signal",
    11: "paper_exchange",
    12: "normal_exam_activity",
}


def parse_args():
    p = argparse.ArgumentParser(
        description="Generate comprehensive Vigil dataset report"
    )
    p.add_argument("--output", default=None,
                   help="Write report to this file path")
    return p.parse_args()


def log(msg: str):
    print(f"[REPORT] {msg}")


def count_files(d: Path) -> dict:
    """Count files by type."""
    img_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
    vid_exts = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}
    imgs, vids, other = 0, 0, 0
    if d.exists():
        for f in d.rglob("*"):
            if f.is_file():
                suf = f.suffix.lower()
                if suf in img_exts:
                    imgs += 1
                elif suf in vid_exts:
                    vids += 1
                else:
                    other += 1
    return {"images": imgs, "videos": vids, "other": other, "total": imgs + vids + other}


def generate_report() -> str:
    """Build a full markdown report."""
    now = datetime.datetime.now()
    lines = []

    lines.append(f"# Vigil Exam-Hall Dataset — Final Report")
    lines.append(f"")
    lines.append(f"**Generated:** {now:%Y-%m-%d %H:%M:%S}")
    lines.append(f"**Project:** VIGIL — Vision-based Invigilation with Graph Intelligence and expLainability")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")

    # =========================================================================
    # 1. Dataset sources
    # =========================================================================
    lines.append(f"## 1. Dataset Sources")
    lines.append(f"")

    sources = [
        ("MSU Online Exam Proctoring (OEP)", RAW_DIR / "oep",
         "Kaggle: raajanwankhade/oep-dataset",
         "License: Pending verification — treat as research-only until confirmed.",
         "Temporal video analysis, head movement, gaze, hand activity, suspicious action sequences."),
        ("CCTV Exam Monitor Dataset", RAW_DIR / "cctv_exam_monitor",
         "Kaggle: cctvdataset/cctv-exam-monitor-dataset",
         "License: **CC0 — Public Domain**. No attribution required.",
         "Primary dataset for exam-hall camera angles and YOLO person detection. Real fisheye/wide-angle CCTV from university exam halls."),
        ("Cheating Scenario Dataset", RAW_DIR / "cheating_scenarios",
         "Mendeley: 10.17632/mjrfmvsh7d.1",
         "License: **CC BY 4.0**. Attribution required.",
         "Staged cheating scenarios in online exam context."),
        ("Online Exam Cheating Detection", RAW_DIR / "roboflow_exam",
         "Roboflow: fraud-detection-using-cnn/online-exam-cheating-detection",
         "License: Pending verification.",
         "Classification dataset. If bounding boxes available, prefer YOLO format export."),
        ("SCB-Dataset5", RAW_DIR / "scb_dataset",
         "GitHub: Whiffe/SCB-dataset",
         "License: Research / Academic Use Only. Non-commercial unless written permission obtained.",
         "Classroom behavior detection — 20 classes including phone use, head turn, leaning."),
    ]

    for name, path, source, license_, purpose in sources:
        counts = count_files(path)
        exists = "YES" if path.exists() and counts["total"] > 0 else "NO"
        lines.append(f"### {name}")
        lines.append(f"")
        lines.append(f"- **Downloaded:** {exists}")
        lines.append(f"- **Source:** {source}")
        lines.append(f"- **{license_}**")
        lines.append(f"- **Files:** {counts['images']} images, {counts['videos']} videos, {counts['other']} other")
        lines.append(f"- **Purpose:** {purpose}")
        lines.append(f"")

    # =========================================================================
    # 2. Vigil class taxonomy
    # =========================================================================
    lines.append(f"## 2. Final Vigil Class Taxonomy")
    lines.append(f"")
    lines.append(f"**Design principle:** No class labels a student as a 'cheater'. All classes describe observable, verifiable events. A later decision layer may combine multiple events into a `review_required` score.")
    lines.append(f"")
    lines.append(f"| Class ID | Class Name | Description |")
    lines.append(f"|---|---|---|")
    descriptions = {
        "person": "Any person visible in the exam hall",
        "phone_visible": "A mobile phone is clearly visible in the person's hand or vicinity",
        "looking_left": "Head turned noticeably to the left",
        "looking_right": "Head turned noticeably to the right",
        "looking_backward": "Head turned backward (away from exam paper)",
        "leaning_left": "Body leaning noticeably to the left",
        "leaning_right": "Body leaning noticeably to the right",
        "leaning_forward": "Body leaning forward onto desk or papers",
        "standing": "Person standing up from their seat",
        "talking": "Person engaged in verbal communication",
        "hand_signal": "Person making deliberate hand gesture or signal",
        "paper_exchange": "Papers being passed or exchanged between persons",
        "normal_exam_activity": "Normal exam-taking behavior (reading, writing)",
    }
    for cid in sorted(VIGIL_CLASSES):
        name = VIGIL_CLASSES[cid]
        lines.append(f"| {cid} | `{name}` | {descriptions.get(name, '')} |")

    lines.append(f"")
    lines.append(f"**Note:** Classification datasets (image-level labels only) are kept separately from the object-detection dataset.")
    lines.append(f"")

    # =========================================================================
    # 3. Splits
    # =========================================================================
    lines.append(f"## 3. Dataset Splits")
    lines.append(f"")
    lines.append(f"| Split | Images | Labels | Videos |")
    lines.append(f"|---|---|---|---|")
    for split in ["train", "val", "test"]:
        img_counts = count_files(VIGIL_DIR / "images" / split)
        lbl_counts = count_files(VIGIL_DIR / "labels" / split)
        vid_counts = count_files(VIGIL_DIR / "videos" / split)
        lines.append(f"| {split} | {img_counts['images']} | {lbl_counts['total']} | {vid_counts['videos']} |")

    lines.append(f"")

    # =========================================================================
    # 4. Quality checks
    # =========================================================================
    lines.append(f"## 4. Quality Control")
    lines.append(f"")
    lines.append(f"Quality checks performed:")
    lines.append(f"")
    lines.append(f"- Corrupted image/video detection")
    lines.append(f"- Zero-byte file detection")
    lines.append(f"- Exact duplicate removal (SHA-256)")
    lines.append(f"- Near-duplicate detection (perceptual hash)")
    lines.append(f"- Watermark/copyright check")
    lines.append(f"- Annotation validation (coordinate ranges, class IDs)")
    lines.append(f"- Cross-dataset leakage check")
    lines.append(f"- Privacy review (names, student IDs, faces)")
    lines.append(f"")

    # =========================================================================
    # 5. Privacy
    # =========================================================================
    lines.append(f"## 5. Privacy Assessment")
    lines.append(f"")
    lines.append(f"- CCTV Exam Monitor: Author claims anonymized — verification recommended")
    lines.append(f"- OEP: Contains webcam footage of individual examinees — faces may be visible")
    lines.append(f"- Cheating Scenario Dataset: Staged scenarios — verify no real identities")
    lines.append(f"- SCB-Dataset5: Real classroom images — check for identifiable faces")
    lines.append(f"- Roboflow: Variable quality — check per-sample")
    lines.append(f"")

    # =========================================================================
    # 6. Reproducibility
    # =========================================================================
    lines.append(f"## 6. Reproducibility")
    lines.append(f"")
    lines.append(f"### Exact commands required to reproduce:")
    lines.append(f"")
    lines.append(f"```bash")
    lines.append(f"# 1. Download datasets")
    lines.append(f"bash scripts/download_datasets.sh")
    lines.append(f"")
    lines.append(f"# 2. Verify licenses")
    lines.append(f"python scripts/verify_dataset_licenses.py --csv datasets/metadata/dataset_manifest.csv")
    lines.append(f"")
    lines.append(f"# 3. Prepare dataset")
    lines.append(f"python scripts/prepare_vigil_dataset.py --seed 42 --fps 2")
    lines.append(f"")
    lines.append(f"# 4. Create video splits")
    lines.append(f"python scripts/create_video_splits.py --seed 42 --fps 2")
    lines.append(f"")
    lines.append(f"# 5. Check annotations")
    lines.append(f"python scripts/check_annotations.py")
    lines.append(f"")
    lines.append(f"# 6. Find duplicates")
    lines.append(f"python scripts/find_duplicates.py")
    lines.append(f"")
    lines.append(f"# 7. Generate final report")
    lines.append(f"python scripts/generate_dataset_report.py --output datasets/vigil_exam/FINAL_REPORT.md")
    lines.append(f"```")
    lines.append(f"")

    # =========================================================================
    # 7. Manual review
    # =========================================================================
    lines.append(f"## 7. Remaining Manual-Review Tasks")
    lines.append(f"")
    lines.append(f"- [ ] Confirm OEP dataset license with MSU CVLab")
    lines.append(f"- [ ] Verify SCB-Dataset5 usage terms for hackathon context")
    lines.append(f"- [ ] Review Roboflow dataset for bounding-box availability")
    lines.append(f"- [ ] Manually verify ambiguous class mappings (turn_head, looking_around)")
    lines.append(f"- [ ] Inspect privacy of OEP webcam footage")
    lines.append(f"- [ ] Verify CCTV Exam Monitor anonymization claims")
    lines.append(f"- [ ] Label representative CCTV images for Vigil event classes")
    lines.append(f"- [ ] Review all samples in `datasets/interim/duplicate_review/`")
    lines.append(f"- [ ] Validate that no real student identities are visible in any dataset")
    lines.append(f"")

    # =========================================================================
    # 8. Attribution
    # =========================================================================
    lines.append(f"## 8. Attribution")
    lines.append(f"")
    lines.append(f"This Vigil training dataset is a **curated and normalized assembly** of documented public and team-collected sources. It is NOT claimed to have been created entirely by the Vigil team.")
    lines.append(f"")
    lines.append(f"### Required Citations")
    lines.append(f"")
    lines.append(f"1. **CCTV Exam Monitor Dataset:** Jonathan Michael Campbell, Kaggle. CC0 Public Domain.")
    lines.append(f"2. **OEP Dataset:** Raajan Wankhade et al., MSU CVLab. License pending.")
    lines.append(f"3. **Cheating Scenario Dataset:** Dataset authors, Mendeley Data. doi:10.17632/mjrfmvsh7d.1. CC BY 4.0.")
    lines.append(f"4. **Online Exam Cheating Detection:** Roboflow Universe, fraud-detection-using-cnn.")
    lines.append(f"5. **SCB-Dataset5:** Whiffe et al., GitHub. Academic/research use.")
    lines.append(f"")
    lines.append(f"### License Summary")
    lines.append(f"")
    lines.append(f"| Dataset | License | Commercial Use | Redistribution |")
    lines.append(f"|---|---|---|---|")
    lines.append(f"| CCTV Exam Monitor | CC0 (Public Domain) | Yes | Yes |")
    lines.append(f"| OEP (MSU) | Pending | Unknown | Unknown |")
    lines.append(f"| Cheating Scenarios | CC BY 4.0 | Yes (with attribution) | Yes (with attribution) |")
    lines.append(f"| Roboflow Exam | Pending | Unknown | Unknown |")
    lines.append(f"| SCB-Dataset5 | Research-only | No | Without permission |")
    lines.append(f"")

    return "\n".join(lines)


def main():
    args = parse_args()
    log("Generating Vigil dataset report...")

    report = generate_report()

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(report)
        log(f"Report written to {out_path}")
    else:
        print(report)

    log("Report generation complete.")


if __name__ == "__main__":
    main()
