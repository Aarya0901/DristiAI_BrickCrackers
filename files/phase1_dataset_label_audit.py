#!/usr/bin/env python3
"""
phase1_dataset_label_audit.py
===============================
Scans the existing legacy dataset (`datasets/vigil_exam/labels/{train,val}`
by default) and:

  1. Extracts every unique class id present on disk and tallies per-class
     bounding-box counts, per split.
  2. Cross-checks those ids against `vigil_exam.yaml` (nc / names), flagging:
       - ids found in labels but absent from the yaml's names list
       - ids declared in the yaml that never appear in any label file
       - a yaml `nc` that doesn't match the number of declared names
  3. Flags orphans: images with no matching label file, and label files
     with no matching image (either direction can silently corrupt a
     later merge/split step if left unnoticed).
  4. Flags malformed label lines (via common.yolo_io, which logs + skips
     rather than crashing).

Writes both a machine-readable JSON report and a flat CSV of per-class
counts to --reports-dir, and prints a console summary table.

Usage:
    python phase1_dataset_label_audit.py --root /path/to/DristiAI_BrickCrackers
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional

from config import VigilConfig, add_common_args
from common.logging_utils import setup_logger, Counter
from common.yolo_io import read_yolo_label, find_image_for_stem, IMAGE_EXTS

LOGGER_NAME = "phase1_label_audit"


def _load_yaml_taxonomy(yaml_path: Path, logger) -> Optional[Dict]:
    if not yaml_path.exists():
        logger.warning("No dataset yaml found at %s — skipping yaml cross-check.", yaml_path)
        return None
    try:
        import yaml
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return data
    except Exception as e:  # noqa: BLE001
        logger.error("Failed to parse %s: %s", yaml_path, e)
        return None


def _discover_splits(labels_root: Path, images_root: Path, logger) -> Dict[str, Dict[str, Path]]:
    """
    Returns {split_name: {"images": Path, "labels": Path}}.
    Handles both `labels/train` + `images/train` layouts and a flat
    (no-split) layout by falling back to a single 'all' split.
    """
    splits = {}
    candidate_names = set()
    if labels_root.exists():
        candidate_names |= {p.name for p in labels_root.iterdir() if p.is_dir()}
    if images_root.exists():
        candidate_names |= {p.name for p in images_root.iterdir() if p.is_dir()}

    known_split_names = {"train", "val", "valid", "test"}
    found = candidate_names & known_split_names
    if found:
        for name in sorted(found):
            splits[name] = {"images": images_root / name, "labels": labels_root / name}
    else:
        logger.warning("No train/val subfolders detected under %s or %s — treating as a single flat split.",
                        labels_root, images_root)
        splits["all"] = {"images": images_root, "labels": labels_root}
    return splits


def audit_split(split_name: str, images_dir: Path, labels_dir: Path, logger, counters: Counter) -> Dict:
    label_files = sorted(labels_dir.rglob("*.txt")) if labels_dir.exists() else []
    image_files = sorted(p for p in images_dir.rglob("*") if p.suffix.lower() in IMAGE_EXTS) if images_dir.exists() else []

    label_stems = {p.stem for p in label_files}
    image_stems = {p.stem for p in image_files}

    images_without_labels = sorted(image_stems - label_stems)
    labels_without_images = sorted(label_stems - image_stems)

    for stem in images_without_labels:
        logger.warning("[%s] image has no matching label file: %s", split_name, stem)
        counters.inc(f"{split_name}_images_without_labels")
    for stem in labels_without_images:
        logger.warning("[%s] label file has no matching image: %s", split_name, stem)
        counters.inc(f"{split_name}_labels_without_images")

    class_box_counts: Dict[int, int] = defaultdict(int)
    images_with_class: Dict[int, set] = defaultdict(set)
    total_boxes = 0
    empty_label_files = 0

    for lf in label_files:
        boxes = read_yolo_label(lf, logger=logger)
        if not boxes:
            empty_label_files += 1
        for b in boxes:
            class_box_counts[b.class_id] += 1
            images_with_class[b.class_id].add(lf.stem)
            total_boxes += 1

    counters.inc(f"{split_name}_label_files", len(label_files))
    counters.inc(f"{split_name}_image_files", len(image_files))
    counters.inc(f"{split_name}_total_boxes", total_boxes)
    counters.inc(f"{split_name}_empty_label_files", empty_label_files)

    return {
        "split": split_name,
        "n_images": len(image_files),
        "n_label_files": len(label_files),
        "n_empty_label_files": empty_label_files,
        "images_without_labels": images_without_labels,
        "labels_without_images": labels_without_images,
        "class_box_counts": {str(k): v for k, v in sorted(class_box_counts.items())},
        "class_image_counts": {str(k): len(v) for k, v in sorted(images_with_class.items())},
        "total_boxes": total_boxes,
    }


def cross_check_yaml(all_class_ids: List[int], yaml_data: Optional[Dict], logger) -> Dict:
    if yaml_data is None:
        return {"checked": False}

    names = yaml_data.get("names")
    nc = yaml_data.get("nc")
    result = {"checked": True, "yaml_nc": nc, "yaml_names": names, "issues": []}

    if names is None:
        result["issues"].append("yaml has no 'names' field")
        logger.error("vigil_exam.yaml has no 'names' field.")
        return result

    # names may be a list or a {id: name} dict depending on ultralytics yaml style
    if isinstance(names, dict):
        yaml_ids = {int(k) for k in names.keys()}
    else:
        yaml_ids = set(range(len(names)))

    if nc is not None and isinstance(names, (list, dict)) and nc != len(names):
        msg = f"yaml nc={nc} does not match len(names)={len(names)}"
        result["issues"].append(msg)
        logger.warning(msg)

    disk_ids = set(all_class_ids)
    on_disk_not_in_yaml = sorted(disk_ids - yaml_ids)
    in_yaml_not_on_disk = sorted(yaml_ids - disk_ids)

    if on_disk_not_in_yaml:
        msg = f"class ids present in label files but NOT declared in yaml names: {on_disk_not_in_yaml}"
        result["issues"].append(msg)
        logger.warning(msg)
    if in_yaml_not_on_disk:
        msg = f"class ids declared in yaml but never used in any label file: {in_yaml_not_on_disk}"
        result["issues"].append(msg)
        logger.warning(msg)
    if not result["issues"]:
        logger.info("yaml cross-check passed: disk class ids match yaml declaration exactly.")

    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(parser)
    args = parser.parse_args()
    cfg = VigilConfig.from_args(args)

    logger = setup_logger(LOGGER_NAME, log_dir=cfg.reports_dir)
    counters = Counter()

    logger.info("=== Phase 1: Dataset Label Audit ===")
    logger.info("images dir: %s", cfg.old_images_dir)
    logger.info("labels dir: %s", cfg.old_labels_dir)
    logger.info("yaml path : %s", cfg.old_yaml_path)

    if not cfg.old_labels_dir.exists():
        logger.error("Labels directory does not exist: %s", cfg.old_labels_dir)
        raise SystemExit(1)

    splits = _discover_splits(cfg.old_labels_dir, cfg.old_images_dir, logger)
    logger.info("Discovered splits: %s", list(splits.keys()))

    split_reports = {}
    all_class_ids = set()
    for split_name, dirs in splits.items():
        logger.info("--- Auditing split: %s ---", split_name)
        rep = audit_split(split_name, dirs["images"], dirs["labels"], logger, counters)
        split_reports[split_name] = rep
        all_class_ids |= {int(k) for k in rep["class_box_counts"].keys()}

    yaml_data = _load_yaml_taxonomy(cfg.old_yaml_path, logger)
    yaml_check = cross_check_yaml(sorted(all_class_ids), yaml_data, logger)

    report = {
        "config": {"old_images_dir": str(cfg.old_images_dir), "old_labels_dir": str(cfg.old_labels_dir),
                    "old_yaml_path": str(cfg.old_yaml_path)},
        "splits": split_reports,
        "all_class_ids_on_disk": sorted(all_class_ids),
        "yaml_cross_check": yaml_check,
    }

    cfg.reports_dir.mkdir(parents=True, exist_ok=True)
    json_path = cfg.reports_dir / "phase1_label_audit_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info("JSON report written to: %s", json_path)

    csv_path = cfg.reports_dir / "phase1_class_counts.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["split", "class_id", "box_count", "image_count"])
        for split_name, rep in split_reports.items():
            for class_id, box_count in rep["class_box_counts"].items():
                img_count = rep["class_image_counts"].get(class_id, 0)
                writer.writerow([split_name, class_id, box_count, img_count])
    logger.info("CSV class-count table written to: %s", csv_path)

    logger.info("---- Console Summary ----")
    for split_name, rep in split_reports.items():
        logger.info("[%s] images=%d label_files=%d empty_labels=%d total_boxes=%d classes=%s",
                     split_name, rep["n_images"], rep["n_label_files"], rep["n_empty_label_files"],
                     rep["total_boxes"], rep["class_box_counts"])
    if yaml_check.get("issues"):
        logger.warning("yaml cross-check found %d issue(s) — see report for details.", len(yaml_check["issues"]))

    counters.log_summary(logger, title="Phase 1 counters")


if __name__ == "__main__":
    main()
