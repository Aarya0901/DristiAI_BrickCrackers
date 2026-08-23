#!/usr/bin/env python3
"""
phase4_merge_imbalance_audit.py
==================================
Merges Phase 2 output (remapped legacy data, already split train/val) with
Phase 3 output (video-derived frames, NOT yet split) into the final YOLO
dataset layout, auto-generates data.yaml, and produces the mandatory
class-imbalance / sampling-analysis report.

THIS SCRIPT IS THE GATE. It does not fine-tune anything. Read the printed
"WHAT TO CHECK BEFORE PHASE 5" section (and the imbalance_report.json /
.csv it writes) before writing/running any training code.

Merge logic
-----------
- Legacy (Phase 2) data already has a train/val split from the original
  dataset curators — that split is RESPECTED AS-IS, not reshuffled
  (reshuffling already-curated splits is a common source of silent data
  leakage between train/val).
- Phase 3 frames have NO split yet. They are split by *clip_id* (source
  video), not by individual frame — putting frames from the same clip in
  both train and val leaks near-duplicate content across the split and
  inflates validation metrics. Clips are greedily bucketed to hit
  --val-split-ratio as closely as possible while keeping every frame from
  one clip on one side.

Output layout
-------------
    <merged_dataset_dir>/
        train/{images,labels}/
        val/{images,labels}/
        data.yaml
        reports/
            imbalance_report.json
            imbalance_report.csv
            cooccurrence_matrix.csv

Usage:
    python phase4_merge_imbalance_audit.py --root /path/to/DristiAI_BrickCrackers
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
from collections import defaultdict
from itertools import combinations
from pathlib import Path
from typing import Dict, List, Tuple

from config import VigilConfig, add_common_args
from common.logging_utils import setup_logger, Counter
from common.yolo_io import read_yolo_label, IMAGE_EXTS

LOGGER_NAME = "phase4_merge_imbalance_audit"


def _link_or_copy(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    try:
        os.symlink(src.resolve(), dst)
    except (OSError, NotImplementedError):
        import shutil
        shutil.copy2(src, dst)


# --------------------------------------------------------------------------- #
# Merge legacy (Phase 2) data — split respected as-is
# --------------------------------------------------------------------------- #
def merge_legacy_data(cfg: VigilConfig, out_root: Path, logger, counters: Counter):
    staging = cfg.phase2_staging_dir
    if not staging.exists():
        logger.warning("No Phase 2 staging directory found at %s — skipping legacy merge. "
                        "(Run phase2_label_schema_remap.py first if you have legacy data.)", staging)
        return

    split_map = {"train": "train", "val": "val", "valid": "val", "test": "val"}
    for split_dir in sorted(p for p in staging.iterdir() if p.is_dir()):
        target_split = split_map.get(split_dir.name)
        if target_split is None:
            logger.warning("Unrecognized legacy split folder name '%s' — treating as 'val'.", split_dir.name)
            target_split = "val"

        labels_dir = split_dir / "labels"
        images_dir = split_dir / "images"
        label_files = sorted(labels_dir.glob("*.txt")) if labels_dir.exists() else []
        logger.info("Merging legacy split '%s' -> '%s' (%d label files)",
                     split_dir.name, target_split, len(label_files))

        for lf in label_files:
            dst_label = out_root / target_split / "labels" / lf.name
            _link_or_copy(lf, dst_label)
            img_path = None
            for ext in IMAGE_EXTS:
                cand = images_dir / f"{lf.stem}{ext}"
                if cand.exists():
                    img_path = cand
                    break
            if img_path is None:
                logger.warning("Legacy label %s has no matching image in %s — label copied without image.",
                                lf.name, images_dir)
                counters.inc("legacy_labels_missing_image")
                continue
            _link_or_copy(img_path, out_root / target_split / "images" / img_path.name)
            counters.inc(f"legacy_{target_split}_merged")


# --------------------------------------------------------------------------- #
# Merge Phase 3 video-derived frames — split by clip_id to avoid leakage
# --------------------------------------------------------------------------- #
def _assign_clips_to_splits(clip_frame_counts: Dict[str, int], val_ratio: float, seed: int) -> Dict[str, str]:
    """Greedy bucketing of clips into train/val, grouped by clip so a clip's
    frames never straddle the split, targeting val_ratio by FRAME count."""
    clip_ids = list(clip_frame_counts.keys())
    rng = random.Random(seed)
    rng.shuffle(clip_ids)

    total_frames = sum(clip_frame_counts.values())
    target_val_frames = total_frames * val_ratio

    assignment = {}
    val_frames_so_far = 0
    for cid in clip_ids:
        n = clip_frame_counts[cid]
        # Assign to val while doing so doesn't overshoot target; once at/over target, fill train.
        if val_frames_so_far + n <= target_val_frames or val_frames_so_far == 0:
            assignment[cid] = "val"
            val_frames_so_far += n
        else:
            assignment[cid] = "train"
    return assignment


def merge_video_data(cfg: VigilConfig, out_root: Path, logger, counters: Counter):
    staging = cfg.phase3_staging_dir
    frame_manifest_path = staging / "frame_manifest.csv"
    if not frame_manifest_path.exists():
        logger.warning("No Phase 3 frame_manifest.csv found at %s — skipping video-derived merge. "
                        "(Run phase3_video_frame_extraction.py --mode extract first.)", frame_manifest_path)
        return

    rows = []
    with open(frame_manifest_path, "r", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    logger.info("Loaded %d frame_manifest rows from Phase 3.", len(rows))

    clip_frame_counts: Dict[str, int] = defaultdict(int)
    for row in rows:
        clip_frame_counts[row["clip_id"]] += 1

    assignment = _assign_clips_to_splits(clip_frame_counts, cfg.val_split_ratio, cfg.random_seed)
    n_train_clips = sum(1 for v in assignment.values() if v == "train")
    n_val_clips = sum(1 for v in assignment.values() if v == "val")
    logger.info("Clip-level split: %d train clips, %d val clips (target val_ratio=%.2f)",
                 n_train_clips, n_val_clips, cfg.val_split_ratio)

    images_dir = staging / "images"
    labels_dir = staging / "labels"
    for row in rows:
        stem = Path(row["image_filename"]).stem
        split = assignment[row["clip_id"]]
        img_src = images_dir / row["image_filename"]
        label_src = labels_dir / f"{stem}.txt"
        if not img_src.exists() or not label_src.exists():
            logger.warning("Frame manifest references missing file(s) for %s — skipping.", stem)
            counters.inc("video_frames_missing_files")
            continue
        _link_or_copy(img_src, out_root / split / "images" / img_src.name)
        _link_or_copy(label_src, out_root / split / "labels" / label_src.name)
        counters.inc(f"video_{split}_merged")


# --------------------------------------------------------------------------- #
# data.yaml generation
# --------------------------------------------------------------------------- #
def write_data_yaml(cfg: VigilConfig, out_root: Path, logger):
    yaml_path = out_root / "data.yaml"
    names_block = "\n".join(f"  {i}: {name}" for i, name in enumerate(cfg.final_classes))
    content = (
        f"path: {out_root.resolve()}\n"
        f"train: train/images\n"
        f"val: val/images\n"
        f"nc: {len(cfg.final_classes)}\n"
        f"names:\n{names_block}\n"
    )
    yaml_path.write_text(content, encoding="utf-8")
    logger.info("Wrote data.yaml to: %s", yaml_path)
    return yaml_path


# --------------------------------------------------------------------------- #
# Imbalance analysis
# --------------------------------------------------------------------------- #
def analyze_split(split_dir: Path, class_names: List[str], logger) -> Dict:
    labels_dir = split_dir / "labels"
    label_files = sorted(labels_dir.glob("*.txt")) if labels_dir.exists() else []

    box_counts: Dict[int, int] = defaultdict(int)
    image_counts: Dict[int, int] = defaultdict(int)
    cooccurrence: Dict[Tuple[int, int], int] = defaultdict(int)
    n_images_with_zero_boxes = 0

    for lf in label_files:
        boxes = read_yolo_label(lf, logger=logger)
        classes_in_image = sorted({b.class_id for b in boxes})
        if not classes_in_image:
            n_images_with_zero_boxes += 1
        for c in classes_in_image:
            image_counts[c] += 1
        for c in boxes:
            box_counts[c.class_id] += 1
        for a, b in combinations(classes_in_image, 2):
            cooccurrence[(a, b)] += 1

    return {
        "n_images": len(label_files),
        "n_images_with_zero_boxes": n_images_with_zero_boxes,
        "box_counts": {class_names[c] if 0 <= c < len(class_names) else str(c): v
                        for c, v in sorted(box_counts.items())},
        "image_counts": {class_names[c] if 0 <= c < len(class_names) else str(c): v
                          for c, v in sorted(image_counts.items())},
        "cooccurrence": {f"{class_names[a]}+{class_names[b]}": v for (a, b), v in cooccurrence.items()},
        "_raw_box_counts": dict(box_counts),  # kept for weight computation below
    }


def compute_class_weights(box_counts: Dict[int, int], n_classes: int, beta: float) -> Dict:
    """Two weighting schemes, both normalized to mean 1.0 across classes:
       - inverse_frequency: classic 1/count weighting
       - effective_number:  Cui et al. 2019 'Class-Balanced Loss' weighting,
         which handles near-empty classes more gracefully than raw 1/count.
    """
    counts = [max(1, box_counts.get(c, 0)) for c in range(n_classes)]  # avoid div-by-zero

    inv_freq = [1.0 / c for c in counts]
    mean_inv = sum(inv_freq) / len(inv_freq)
    inv_freq_norm = [w / mean_inv for w in inv_freq]

    eff_num = [(1 - beta ** c) / (1 - beta) for c in counts]
    eff_weights = [1.0 / e for e in eff_num]
    mean_eff = sum(eff_weights) / len(eff_weights)
    eff_weights_norm = [w / mean_eff for w in eff_weights]

    return {
        "raw_counts_used": counts,
        "inverse_frequency_weights": inv_freq_norm,
        "effective_number_weights": eff_weights_norm,
    }


def compute_oversampling_ratios(box_counts: Dict[int, int], n_classes: int, max_ratio: float = 10.0) -> List[float]:
    counts = [max(1, box_counts.get(c, 0)) for c in range(n_classes)]
    target = max(counts)
    ratios = [min(max_ratio, target / c) for c in counts]
    return ratios


def print_gate_guidance(train_stats: Dict, class_names: List[str], logger):
    raw = train_stats["_raw_box_counts"]
    counts = [raw.get(i, 0) for i in range(len(class_names))]
    nonzero = [c for c in counts if c > 0]

    logger.info("==================== WHAT TO CHECK BEFORE PHASE 5 ====================")
    if 0 in counts:
        missing = [class_names[i] for i, c in enumerate(counts) if c == 0]
        logger.warning("Class(es) with ZERO training boxes: %s. Fine-tuning on these as-is will just learn "
                        "to never predict them. Fix data collection for these classes before Phase 5.", missing)
    if nonzero:
        ratio = max(nonzero) / min(nonzero)
        logger.info("Max/min class box-count ratio in train: %.1fx", ratio)
        if ratio > 20:
            logger.warning("Ratio > 20x — severe imbalance. Recommend: oversample minority classes toward the "
                            "capped ratios in the report, inject extra background/'normal' frames only up to a "
                            "point (don't let 'normal' dominate further), consider focal loss (gamma ~1.5-2) "
                            "instead of default BCE, and disable aggressive flips only where handedness matters.")
        elif ratio > 5:
            logger.warning("Ratio 5x-20x — moderate imbalance. Class weighting (see "
                            "effective_number_weights in the report) is likely sufficient; oversampling optional.")
        else:
            logger.info("Ratio < 5x — mild imbalance, standard training should be fine with light class weighting.")
    for i, c in enumerate(counts):
        if 0 < c < 100:
            logger.warning("Class '%s' has only %d boxes total in train — very low sample count, expect high "
                            "variance in that class's metrics regardless of weighting.", class_names[i], c)
    logger.info("Also check: cooccurrence_matrix.csv for classes that ALWAYS appear together (may indicate "
                "an annotation/remap artifact rather than genuine co-occurrence), and "
                "n_images_with_zero_boxes for both splits (background-only frames are fine in moderation, "
                "but a high fraction can quietly bias the model toward predicting nothing).")
    logger.info("========================================================================")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(parser)
    parser.add_argument("--max-oversample-ratio", type=float, default=10.0,
                         help="Cap on recommended per-class oversampling multiplier (default 10x).")
    args = parser.parse_args()
    cfg = VigilConfig.from_args(args)

    logger = setup_logger(LOGGER_NAME, log_dir=cfg.reports_dir)
    counters = Counter()

    logger.info("=== Phase 4: Dataset Merge & Comprehensive Imbalance Audit ===")
    out_root = cfg.merged_dataset_dir
    (out_root / "train" / "images").mkdir(parents=True, exist_ok=True)
    (out_root / "train" / "labels").mkdir(parents=True, exist_ok=True)
    (out_root / "val" / "images").mkdir(parents=True, exist_ok=True)
    (out_root / "val" / "labels").mkdir(parents=True, exist_ok=True)

    merge_legacy_data(cfg, out_root, logger, counters)
    merge_video_data(cfg, out_root, logger, counters)
    write_data_yaml(cfg, out_root, logger)

    logger.info("Analyzing merged train/val distributions ...")
    train_stats = analyze_split(out_root / "train", cfg.final_classes, logger)
    val_stats = analyze_split(out_root / "val", cfg.final_classes, logger)

    weights = compute_class_weights(train_stats["_raw_box_counts"], len(cfg.final_classes), cfg.class_balance_beta)
    oversample_ratios = compute_oversampling_ratios(train_stats["_raw_box_counts"], len(cfg.final_classes),
                                                      max_ratio=args.max_oversample_ratio)

    report = {
        "final_classes": cfg.final_classes,
        "train": {k: v for k, v in train_stats.items() if not k.startswith("_")},
        "val": {k: v for k, v in val_stats.items() if not k.startswith("_")},
        "class_weights": {
            "inverse_frequency": dict(zip(cfg.final_classes, weights["inverse_frequency_weights"])),
            "effective_number": dict(zip(cfg.final_classes, weights["effective_number_weights"])),
        },
        "recommended_oversampling_ratio": dict(zip(cfg.final_classes, oversample_ratios)),
        "max_oversample_ratio_cap": args.max_oversample_ratio,
    }

    cfg.reports_dir.mkdir(parents=True, exist_ok=True)
    json_path = cfg.reports_dir / "imbalance_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info("Imbalance report (JSON) written to: %s", json_path)

    csv_path = cfg.reports_dir / "imbalance_report.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["class_name", "train_box_count", "val_box_count", "train_image_count", "val_image_count",
                          "inv_freq_weight", "eff_num_weight", "recommended_oversample_ratio"])
        for i, name in enumerate(cfg.final_classes):
            writer.writerow([
                name,
                train_stats["_raw_box_counts"].get(i, 0),
                val_stats["_raw_box_counts"].get(i, 0),
                train_stats["image_counts"].get(name, 0),
                val_stats["image_counts"].get(name, 0),
                round(weights["inverse_frequency_weights"][i], 4),
                round(weights["effective_number_weights"][i], 4),
                round(oversample_ratios[i], 2),
            ])
    logger.info("Imbalance report (CSV) written to: %s", csv_path)

    cooc_path = cfg.reports_dir / "cooccurrence_matrix.csv"
    with open(cooc_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["split", "class_pair", "co_occurring_images"])
        for split_name, stats in (("train", train_stats), ("val", val_stats)):
            for pair, count in stats["cooccurrence"].items():
                writer.writerow([split_name, pair, count])
    logger.info("Co-occurrence matrix written to: %s", cooc_path)

    logger.info("---- Console Summary ----")
    logger.info("train: %d images, box_counts=%s", train_stats["n_images"], train_stats["box_counts"])
    logger.info("val  : %d images, box_counts=%s", val_stats["n_images"], val_stats["box_counts"])

    print_gate_guidance(train_stats, cfg.final_classes, logger)
    counters.log_summary(logger, title="Phase 4 counters")

    logger.info("Phase 4 complete. DO NOT proceed to fine-tuning (Phase 5) until you've reviewed "
                 "%s and decided on final class weights / oversampling parameters.", json_path)


if __name__ == "__main__":
    main()
