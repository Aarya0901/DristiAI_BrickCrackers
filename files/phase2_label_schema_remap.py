#!/usr/bin/env python3
"""
phase2_label_schema_remap.py
==============================
Remaps the legacy 4-class taxonomy onto the new 5-class target taxonomy:

    leaning_forward      -> cheating_posture
    hand_signal          -> cheating_posture
    normal_exam_activity -> normal
    person                -> person

(edit config.OLD_TO_NEW_CLASS_MAP if your legacy class *names* differ —
this script maps by NAME, resolved through vigil_exam.yaml's id->name
table, specifically so it's immune to the old and new schemas happening
to share/collide on integer ids.)

For every label file:
  - old class id -> old class name (via yaml)
  - old class name -> new class name (via OLD_TO_NEW_CLASS_MAP)
  - new class name -> new class id (via config.FINAL_CLASSES order)
  - box coordinates are copied through unchanged (remap is id-only)

Old class names with NO entry in OLD_TO_NEW_CLASS_MAP are, by default,
DROPPED from the output with a loud per-file warning and a tally in the
before/after report — remapping should never silently invent a taxonomy
decision. Pass --keep-unmapped to instead keep them under a synthetic
"unmapped_<old_name>" bucket appended past the final class list, purely
so you can inspect what's being lost before deciding.

Remapped labels + copied (symlinked) images are written to:
    <merged_dataset_dir>/_staging/phase2_remapped/{split}/{images,labels}

Usage:
    python phase2_label_schema_remap.py --root /path/to/DristiAI_BrickCrackers
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Dict, Optional

from config import VigilConfig, add_common_args
from common.logging_utils import setup_logger, Counter
from common.yolo_io import read_yolo_label, write_yolo_label, YoloBox, find_image_for_stem

LOGGER_NAME = "phase2_remap"


def _load_old_id_to_name(yaml_path: Path, logger) -> Dict[int, str]:
    if not yaml_path.exists():
        logger.error("Cannot remap without the legacy yaml (need old id->name mapping): %s", yaml_path)
        raise SystemExit(1)
    import yaml
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    names = data.get("names")
    if names is None:
        logger.error("%s has no 'names' field — cannot determine old id->name mapping.", yaml_path)
        raise SystemExit(1)
    if isinstance(names, dict):
        return {int(k): v for k, v in names.items()}
    return {i: n for i, n in enumerate(names)}


def _discover_splits(labels_root: Path, images_root: Path, logger):
    splits = {}
    candidate_names = set()
    if labels_root.exists():
        candidate_names |= {p.name for p in labels_root.iterdir() if p.is_dir()}
    known = {"train", "val", "valid", "test"}
    found = candidate_names & known
    if found:
        for name in sorted(found):
            splits[name] = {"images": images_root / name, "labels": labels_root / name}
    else:
        splits["all"] = {"images": images_root, "labels": labels_root}
    return splits


def _link_or_copy(src: Path, dst: Path, logger):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    try:
        os.symlink(src.resolve(), dst)
    except (OSError, NotImplementedError):
        import shutil
        shutil.copy2(src, dst)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(parser)
    parser.add_argument("--keep-unmapped", action="store_true",
                         help="Keep boxes whose old class has no entry in OLD_TO_NEW_CLASS_MAP, "
                              "under a synthetic 'unmapped_<name>' id instead of dropping them.")
    args = parser.parse_args()
    cfg = VigilConfig.from_args(args)

    logger = setup_logger(LOGGER_NAME, log_dir=cfg.reports_dir)
    counters = Counter()

    logger.info("=== Phase 2: Label Schema Remapping ===")
    old_id_to_name = _load_old_id_to_name(cfg.old_yaml_path, logger)
    logger.info("Old taxonomy (from yaml): %s", old_id_to_name)

    new_name_to_id = {name: i for i, name in enumerate(cfg.final_classes)}
    logger.info("New taxonomy target: %s", new_name_to_id)

    unmapped_names = sorted(set(old_id_to_name.values()) - set(cfg.old_to_new_class_map.keys()))
    if unmapped_names:
        logger.warning("Old class names with NO remap entry (will be %s): %s",
                        "kept under synthetic ids" if args.keep_unmapped else "DROPPED", unmapped_names)

    synthetic_id_start = len(cfg.final_classes)
    synthetic_ids: Dict[str, int] = {}

    def resolve_new_id(old_name: str) -> Optional[int]:
        if old_name in cfg.old_to_new_class_map:
            new_name = cfg.old_to_new_class_map[old_name]
            if new_name not in new_name_to_id:
                logger.error("OLD_TO_NEW_CLASS_MAP points '%s' -> '%s', which is not in FINAL_CLASSES %s",
                              old_name, new_name, cfg.final_classes)
                return None
            return new_name_to_id[new_name]
        if args.keep_unmapped:
            if old_name not in synthetic_ids:
                synthetic_ids[old_name] = synthetic_id_start + len(synthetic_ids)
            return synthetic_ids[old_name]
        return None

    splits = _discover_splits(cfg.old_labels_dir, cfg.old_images_dir, logger)
    before_counts: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
    after_counts: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))

    out_root = cfg.phase2_staging_dir
    logger.info("Writing remapped dataset to: %s", out_root)

    for split_name, dirs in splits.items():
        labels_dir, images_dir = dirs["labels"], dirs["images"]
        if not labels_dir.exists():
            continue
        label_files = sorted(labels_dir.rglob("*.txt"))
        logger.info("--- Remapping split '%s' (%d label files) ---", split_name, len(label_files))

        out_labels_dir = out_root / split_name / "labels"
        out_images_dir = out_root / split_name / "images"

        for lf in label_files:
            boxes = read_yolo_label(lf, logger=logger)
            new_boxes = []
            for b in boxes:
                old_name = old_id_to_name.get(b.class_id)
                before_counts[split_name][b.class_id] += 1
                if old_name is None:
                    logger.warning("%s: class_id %d not in old yaml names — dropping box.", lf, b.class_id)
                    counters.inc("boxes_dropped_unknown_old_id")
                    continue
                new_id = resolve_new_id(old_name)
                if new_id is None:
                    counters.inc(f"boxes_dropped_unmapped_{old_name}")
                    continue
                new_boxes.append(YoloBox(new_id, b.xc, b.yc, b.w, b.h))
                after_counts[split_name][new_id] += 1

            write_yolo_label(out_labels_dir / lf.name, new_boxes)
            counters.inc(f"{split_name}_label_files_written")

            img_path = find_image_for_stem(images_dir, lf.stem)
            if img_path is None:
                logger.warning("No source image found for label %s (stem=%s) — label written without image.",
                                lf, lf.stem)
                counters.inc("labels_missing_source_image")
            else:
                _link_or_copy(img_path, out_images_dir / img_path.name, logger)

    # --- before/after validation report ------------------------------------
    all_new_names = {v: k for k, v in new_name_to_id.items()}
    all_new_names.update({v: k for k, v in synthetic_ids.items()})

    report_rows = []
    for split_name in splits:
        b = before_counts.get(split_name, {})
        a = after_counts.get(split_name, {})
        b_total = sum(b.values())
        a_total = sum(a.values())
        report_rows.append({
            "split": split_name,
            "before_total_boxes": b_total,
            "after_total_boxes": a_total,
            "before_by_old_id": {old_id_to_name.get(k, k): v for k, v in sorted(b.items())},
            "after_by_new_class": {all_new_names.get(k, f"id_{k}"): v for k, v in sorted(a.items())},
        })
        diff = b_total - a_total
        if diff > 0:
            logger.info("[%s] %d box(es) intentionally dropped (unmapped classes: %s)",
                         split_name, diff, unmapped_names)
        logger.info("[%s] before=%d boxes across %d old classes -> after=%d boxes across %d new classes",
                     split_name, b_total, len(b), a_total, len(a))

    cfg.reports_dir.mkdir(parents=True, exist_ok=True)
    json_path = cfg.reports_dir / "phase2_remap_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "old_id_to_name": old_id_to_name,
            "old_to_new_class_map": cfg.old_to_new_class_map,
            "new_name_to_id": new_name_to_id,
            "synthetic_unmapped_ids": synthetic_ids,
            "per_split": report_rows,
        }, f, indent=2)
    logger.info("Before/after validation report written to: %s", json_path)

    csv_path = cfg.reports_dir / "phase2_before_after_counts.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["split", "stage", "class_name", "box_count"])
        for split_name in splits:
            for name, cnt in report_rows[[r["split"] for r in report_rows].index(split_name)]["before_by_old_id"].items():
                writer.writerow([split_name, "before", name, cnt])
            for name, cnt in report_rows[[r["split"] for r in report_rows].index(split_name)]["after_by_new_class"].items():
                writer.writerow([split_name, "after", name, cnt])
    logger.info("CSV before/after table written to: %s", csv_path)

    counters.log_summary(logger, title="Phase 2 counters")


if __name__ == "__main__":
    main()
