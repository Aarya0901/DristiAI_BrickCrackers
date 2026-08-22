#!/usr/bin/env python3
"""
check_annotations.py — Validate YOLO-format annotations for the Vigil dataset.

Checks:
  - Every image has a matching annotation file where required
  - Coordinates are between 0 and 1
  - Bounding boxes have positive width and height
  - Class IDs exist in the expected taxonomy
  - Labels reference valid classes
  - Images and labels use matching base filenames

Usage:
  python scripts/check_annotations.py
  python scripts/check_annotations.py --help
  python scripts/check_annotations.py --split train
  python scripts/check_annotations.py --label-dir datasets/vigil_exam/labels/train
  python scripts/check_annotations.py --dry-run
"""

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
VIGIL_DIR = DATASETS_DIR / "vigil_exam"

# Vigil class taxonomy
VALID_CLASS_IDS = set(range(13))  # 0–12

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}


def parse_args():
    p = argparse.ArgumentParser(
        description="Validate Vigil YOLO annotations"
    )
    p.add_argument("--split", choices=["train", "val", "test"], default=None,
                   help="Check only one split")
    p.add_argument("--label-dir", default=None,
                   help="Check a specific label directory")
    p.add_argument("--image-dir", default=None,
                   help="Corresponding image directory (inferred if omitted)")
    p.add_argument("--output", default=None,
                   help="Path for JSON validation report")
    p.add_argument("--dry-run", action="store_true",
                   help="Print checks without writing anything")
    return p.parse_args()


def log(msg: str):
    print(f"[ANNOTATION CHECK] {msg}")


def fail(msg: str):
    print(f"[ANNOTATION CHECK] ERROR: {msg}", file=sys.stderr)


def parse_yolo_label(label_path: Path) -> list[dict]:
    """
    Parse one YOLO label file.
    Each line: class_id x_center y_center width height
    Returns list of {'class_id': int, 'x': float, 'y': float, 'w': float, 'h': float}
    """
    annotations = []
    with open(label_path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) != 5:
                fail(f"{label_path}:{line_no} — expected 5 values, got {len(parts)}: {line!r}")
                continue

            try:
                class_id = int(parts[0])
                x, y, w, h = float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
            except ValueError as e:
                fail(f"{label_path}:{line_no} — parse error: {e}")
                continue

            annotations.append({
                "class_id": class_id,
                "x_center": x,
                "y_center": y,
                "width": w,
                "height": h,
                "line": line_no,
            })

    return annotations


def validate_annotation(ann: dict, label_path: Path, img_size: tuple | None) -> list[str]:
    """Validate one annotation. Returns list of error messages."""
    errors = []

    if ann["class_id"] not in VALID_CLASS_IDS:
        errors.append(f"Invalid class_id {ann['class_id']} (valid: {sorted(VALID_CLASS_IDS)})")

    if not (0 <= ann["x_center"] <= 1):
        errors.append(f"x_center out of range: {ann['x_center']}")

    if not (0 <= ann["y_center"] <= 1):
        errors.append(f"y_center out of range: {ann['y_center']}")

    if ann["width"] <= 0:
        errors.append(f"Non-positive width: {ann['width']}")

    if ann["height"] <= 0:
        errors.append(f"Non-positive height: {ann['height']}")

    if not (0 <= ann["x_center"] - ann["width"] / 2 <= 1):
        errors.append(f"Box extends past left edge: x_left={ann['x_center'] - ann['width']/2:.4f}")

    if not (0 <= ann["x_center"] + ann["width"] / 2 <= 1):
        errors.append(f"Box extends past right edge: x_right={ann['x_center'] + ann['width']/2:.4f}")

    if not (0 <= ann["y_center"] - ann["height"] / 2 <= 1):
        errors.append(f"Box extends past top edge: y_top={ann['y_center'] - ann['height']/2:.4f}")

    if not (0 <= ann["y_center"] + ann["height"] / 2 <= 1):
        errors.append(f"Box extends past bottom edge: y_bottom={ann['y_center'] + ann['height']/2:.4f}")

    return errors


def run_checks(label_dir: Path, image_dir: Path) -> dict:
    """Run all annotation checks and return report."""
    report = {
        "label_dir": str(label_dir),
        "image_dir": str(image_dir),
        "checked": 0,
        "valid": 0,
        "errors": [],
        "warnings": [],
        "missing_labels": [],
        "missing_images": [],
        "empty_labels": [],
        "class_distribution": {cid: 0 for cid in VALID_CLASS_IDS},
    }

    if not label_dir.exists():
        report["errors"].append(f"Label directory not found: {label_dir}")
        return report

    label_files = sorted(label_dir.glob("*.txt"))
    if not label_files:
        report["warnings"].append(f"No .txt label files found in {label_dir}")
        return report

    for lf in label_files:
        report["checked"] += 1
        base_name = lf.stem

        # Check: matching image exists
        image_found = False
        for ext in IMAGE_EXTENSIONS:
            img_path = image_dir / f"{base_name}{ext}"
            if img_path.exists():
                image_found = True
                break

        if not image_found:
            report["warnings"].append(f"Label {lf.name} has no matching image in {image_dir}")
            continue

        # Parse and validate
        annotations = parse_yolo_label(lf)
        if not annotations:
            report["empty_labels"].append(str(lf.relative_to(label_dir.parent)))

        for ann in annotations:
            report["class_distribution"][ann["class_id"]] = \
                report["class_distribution"].get(ann["class_id"], 0) + 1

            ann_errors = validate_annotation(ann, lf, None)
            if ann_errors:
                for e in ann_errors:
                    report["errors"].append(f"{lf.name}:{ann['line']} — {e}")
            else:
                report["valid"] += 1

    # Check: images without labels
    for ext in IMAGE_EXTENSIONS:
        for img in image_dir.glob(f"*{ext}"):
            label_path = label_dir / f"{img.stem}.txt"
            if not label_path.exists():
                report["missing_labels"].append(str(img.name))

    return report


def main():
    args = parse_args()

    if args.label_dir:
        label_dirs = [Path(args.label_dir)]
        if args.image_dir:
            image_dirs = [Path(args.image_dir)]
        else:
            image_dirs = [Path(str(label_dirs[0]).replace("labels", "images"))]
    elif args.split:
        label_dirs = [VIGIL_DIR / "labels" / args.split]
        image_dirs = [VIGIL_DIR / "images" / args.split]
    else:
        label_dirs = [
            VIGIL_DIR / "labels" / "train",
            VIGIL_DIR / "labels" / "val",
            VIGIL_DIR / "labels" / "test",
        ]
        image_dirs = [
            VIGIL_DIR / "images" / "train",
            VIGIL_DIR / "images" / "val",
            VIGIL_DIR / "images" / "test",
        ]

    full_report = {"splits": {}, "total_errors": 0, "total_warnings": 0}

    for ld, imd in zip(label_dirs, image_dirs):
        log(f"Checking {ld} -> {imd}")
        report = run_checks(ld, imd)
        split_name = ld.parent.name + "/" + ld.name if ld.parent.name != "labels" else ld.name
        full_report["splits"][split_name] = report
        full_report["total_errors"] += len(report["errors"])
        full_report["total_warnings"] += len(report["warnings"])

        log(f"  Labels checked: {report['checked']}")
        log(f"  Valid annotations: {report['valid']}")
        log(f"  Errors: {len(report['errors'])}")
        log(f"  Warnings: {len(report['warnings'])}")
        log(f"  Missing labels: {len(report['missing_labels'])}")
        log(f"  Empty labels: {len(report['empty_labels'])}")

    log(f"\nTotal errors: {full_report['total_errors']}")
    log(f"Total warnings: {full_report['total_warnings']}")
    log(f"Total missing labels (images without annotations): "
        f"{sum(len(s['missing_labels']) for s in full_report['splits'].values())}")

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(full_report, f, indent=2)
        log(f"Report written to {out_path}")

    # Exit with error if real issues found
    if full_report["total_errors"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
