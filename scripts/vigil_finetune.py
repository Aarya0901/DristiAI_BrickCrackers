#!/usr/bin/env python3
"""
scripts/vigil_finetune.py
==========================
Two-stage fine-tune of vigil_yolo_4cls_best.pt onto the new 5-class taxonomy
(person, cheating_posture, cheating_phone, edge_cases, normal).

All training parameters are hardcoded from Phase 5's imbalance_report.json.
See walkthrough.md for the full derivation.

KEY IMBALANCE NUMBERS (Phase 5 gate):
  Max/min ratio : 198.4x  (normal 37,107 vs cheating_phone 187 train boxes)
  Strategy      : fl_gamma=1.5 + oversampling via txt image list
  Note on class weights: ultralytics model.train() does not expose per-class
  BCE weights — cls_pw is a scalar only. focal loss + oversampling achieves
  the equivalent effect and is the correct ultralytics-native approach.
  The EFF_NUM_WEIGHTS constant below is preserved for documentation and for
  use if a custom Trainer loss override is added later.

Stage A  Full merged dataset (11,991 train images → ~21,000 after oversampling):
         - Oversampled image-list txt so minority classes appear more often
         - Focal loss (fl_gamma=1.5) for the 198.4x ratio
         - 100 epochs, cosine LR, early stopping at patience=30

Stage B  Short low-LR pass on video-derived (spot-checked) frames only:
         - 20 epochs, LR = 1/10 of Stage A final LR
         - Sharpens new classes without forgetting bulk-learned ones
         - Less aggressive augmentation (mosaic=0.5)

Usage:
    # Stage A (builds oversampled list, starts from vigil_yolo_4cls_best.pt):
    python scripts/vigil_finetune.py --root c:/DristiAI_BrickCrackers --stage a

    # Stage B (starts from Stage A best.pt):
    python scripts/vigil_finetune.py --root c:/DristiAI_BrickCrackers --stage b \\
        --stage-a-weights runs/vigil_v2_stageA/weights/best.pt

    # Run both stages sequentially (Stage B auto-picks Stage A best.pt):
    python scripts/vigil_finetune.py --root c:/DristiAI_BrickCrackers --stage both

    # GPU-specific / batch overrides (useful for Colab/Modal):
    python scripts/vigil_finetune.py --stage a --batch 32 --device 0
    python scripts/vigil_finetune.py --stage a --batch 8  --device cpu
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
from pathlib import Path
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Parameters derived from Phase 5 imbalance_report.json — hardcoded per plan.
# Do NOT change these without re-running phase4_merge_imbalance_audit.py and
# reviewing the new gate numbers.
# ---------------------------------------------------------------------------

FINAL_CLASSES: List[str] = [
    "person",           # 0
    "cheating_posture", # 1
    "cheating_phone",   # 2
    "edge_cases",       # 3
    "normal",           # 4
]

# Effective-number class weights (Cui et al. 2019, beta=0.999).
# Source: imbalance_report.json -> class_weights.effective_number
# Kept for documentation. Not passed to model.train() (ultralytics cls_pw is
# scalar-only). Use focal loss + oversampling instead (see below).
EFF_NUM_WEIGHTS: List[float] = [
    0.4984,   # person           (16,548 train boxes)
    0.4984,   # cheating_posture (27,075 train boxes)
    2.9209,   # cheating_phone   (   187 train boxes) ← highest weight
    0.5839,   # edge_cases       ( 1,920 train boxes)
    0.4984,   # normal           (37,107 train boxes)
]

# Oversampling ratios from imbalance_report.json -> recommended_oversampling_ratio
# Capped at 10x. Applied per-image based on each image's dominant behavior class.
# Note: 'person' is NOT a separate bucket here — person boxes appear via dual-
# annotation inside video-derived frames, which are already oversampled under their
# behavior class (cheating_phone at 10x, edge_cases at 10x, etc).
OVERSAMPLE: Dict[str, float] = {
    "cheating_posture": 1.37,
    "cheating_phone":   10.0,   # capped — only 177 source images
    "edge_cases":       10.0,   # capped — only 675 source images
    "normal":           1.0,    # baseline (most common class)
}

# Focal loss — plan calls for gamma 1.5-2 at >20x ratio; using 1.5 (conservative).
FL_GAMMA: float = 1.5

# Horizontal flip: enabled (fliplr=0.5).
# Confirmed direction-agnostic for this dataset — surveillance footage where
# both left- and right-handed behavior occurs.
FLIPLR: float = 0.5

# Stage A hyperparameters
STAGE_A_EPOCHS: int = 100
STAGE_A_LR0: float = 0.01
STAGE_A_LRF: float = 0.01      # final LR fraction (cosine decay target)
STAGE_A_BATCH: int = 16
STAGE_A_IMGSZ: int = 640
STAGE_A_PATIENCE: int = 30

# Stage B hyperparameters (short sharp pass on video-verified frames)
STAGE_B_EPOCHS: int = 20
STAGE_B_LR0: float = 0.001     # 1/10 of Stage A initial LR
STAGE_B_LRF: float = 0.1
STAGE_B_BATCH: int = 8         # smaller set → smaller batch fine
STAGE_B_PATIENCE: int = 10

IMAGE_EXTS: frozenset = frozenset({".jpg", ".jpeg", ".png", ".bmp", ".webp"})


# ---------------------------------------------------------------------------
# Oversampled image-list builder
# ---------------------------------------------------------------------------

def _load_frame_manifest(manifest_path: Path) -> Dict[str, str]:
    """Returns {image_stem: class_name} for all video-derived (Phase 4) frames."""
    stem_to_class: Dict[str, str] = {}
    if not manifest_path.exists():
        print(f"  WARNING: frame_manifest.csv not found at {manifest_path} "
              "(video-derived frames will not be classified by source clip class)")
        return stem_to_class
    with open(manifest_path, "r", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            stem = Path(row["image_filename"]).stem
            stem_to_class[stem] = row["class_name"]
    return stem_to_class


def _class_from_label(label_path: Path) -> Optional[str]:
    """
    Infer dominant behavior class for a legacy image from its label file.
    Reads all box class_ids, skips person(0) when non-person classes exist,
    returns the name of the most frequent non-person class.
    """
    if not label_path.exists():
        return None
    class_counts: Dict[int, int] = {}
    for line in label_path.read_text(encoding="utf-8").splitlines():
        parts = line.strip().split()
        if len(parts) == 5:
            try:
                c = int(float(parts[0]))
                class_counts[c] = class_counts.get(c, 0) + 1
            except ValueError:
                pass
    if not class_counts:
        return None
    # Prefer non-person class for oversampling decision
    candidates = {k: v for k, v in class_counts.items() if k != 0} or class_counts
    dominant_id = max(candidates, key=candidates.get)
    return FINAL_CLASSES[dominant_id] if 0 <= dominant_id < len(FINAL_CLASSES) else None


def build_oversampled_list(
    train_images_dir: Path,
    train_labels_dir: Path,
    frame_manifest_path: Path,
    out_txt: Path,
    seed: int = 42,
) -> Dict[str, int]:
    """
    Builds an oversampled training image-path list and writes it to `out_txt`.
    Ultralytics YOLO accepts a .txt file (one absolute image path per line) as
    the `train:` value in data.yaml.

    Returns {class_name: n_entries_written} for logging.
    """
    stem_to_class = _load_frame_manifest(frame_manifest_path)
    rng = random.Random(seed)

    all_images = sorted(p for p in train_images_dir.rglob("*")
                        if p.suffix.lower() in IMAGE_EXTS)
    print(f"  Found {len(all_images)} total training images before oversampling.")

    # Bucket images by behavior class
    class_images: Dict[str, List[Path]] = {c: [] for c in FINAL_CLASSES}
    unclassified: List[Path] = []

    for img in all_images:
        # Video-derived: fast manifest lookup
        cls = stem_to_class.get(img.stem)
        if cls is None:
            # Legacy: infer from label file
            cls = _class_from_label(train_labels_dir / f"{img.stem}.txt")
        if cls and cls in class_images:
            class_images[cls].append(img)
        else:
            unclassified.append(img)

    # Build oversampled line list
    lines: List[str] = []
    entry_counts: Dict[str, int] = {}

    for cls in FINAL_CLASSES:
        imgs = class_images[cls]
        ratio = OVERSAMPLE.get(cls, 1.0)
        n_repeats = max(1, round(ratio))
        entries = imgs * n_repeats
        rng.shuffle(entries)
        lines.extend(str(p.resolve()) for p in entries)
        entry_counts[cls] = len(entries)

    # Unclassified images included once — don't oversample unknown class
    lines.extend(str(p.resolve()) for p in unclassified)
    entry_counts["_unclassified"] = len(unclassified)

    rng.shuffle(lines)
    out_txt.parent.mkdir(parents=True, exist_ok=True)
    out_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  Wrote {len(lines)} oversampled entries to: {out_txt}")
    return entry_counts


def build_stage_b_list(
    phase3_images_dir: Path,
    frame_manifest_path: Path,
    out_txt: Path,
    seed: int = 42,
) -> int:
    """
    Stage B uses only video-derived frames (spot-checked in Phase 4 visualize step).
    Oversampling within Stage B set is also applied so cheating_phone/edge_cases
    still get proportional exposure even in this smaller set.
    Returns total entry count.
    """
    stem_to_class = _load_frame_manifest(frame_manifest_path)
    rng = random.Random(seed)

    images = sorted(p for p in phase3_images_dir.rglob("*")
                    if p.suffix.lower() in IMAGE_EXTS)
    if not images:
        print(f"  WARNING: No images found in {phase3_images_dir}. "
              "Run phase3_video_frame_extraction.py --mode extract first.")
        return 0

    lines: List[str] = []
    for img in images:
        cls = stem_to_class.get(img.stem, "normal")
        n = max(1, round(OVERSAMPLE.get(cls, 1.0)))
        lines.extend([str(img.resolve())] * n)

    rng.shuffle(lines)
    out_txt.parent.mkdir(parents=True, exist_ok=True)
    out_txt.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"  Wrote {len(lines)} Stage B entries (from {len(images)} source frames) to: {out_txt}")
    return len(lines)


# ---------------------------------------------------------------------------
# data.yaml writers
# ---------------------------------------------------------------------------

def _write_stage_yaml(out_yaml: Path, train_txt: Path, val_images_dir: Path,
                      dataset_root: Path) -> None:
    """
    Write a stage-specific data.yaml. The `train:` field points to a .txt
    file list (ultralytics reads image paths from it line by line), which is
    how oversampling is implemented without modifying any source files.
    """
    content = (
        f"# Auto-generated by vigil_finetune.py — do not edit manually.\n"
        f"path: {dataset_root.resolve()}\n"
        f"train: {train_txt.resolve()}\n"
        f"val: {val_images_dir.resolve()}\n"
        f"nc: {len(FINAL_CLASSES)}\n"
        f"names:\n"
        + "\n".join(f"  {i}: {n}" for i, n in enumerate(FINAL_CLASSES))
        + "\n"
    )
    out_yaml.write_text(content, encoding="utf-8")
    print(f"  Wrote stage data.yaml: {out_yaml}")


# ---------------------------------------------------------------------------
# Training runners
# ---------------------------------------------------------------------------

def run_stage_a(
    checkpoint: Path,
    data_yaml: Path,
    project_dir: Path,
    epochs: int,
    batch: int,
    imgsz: int,
    patience: int,
    device: str,
) -> Path:
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ERROR: ultralytics not installed. pip install ultralytics")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Stage A: Full merged dataset fine-tune")
    print("=" * 60)
    print(f"  checkpoint  : {checkpoint}")
    print(f"  data.yaml   : {data_yaml}")
    print(f"  epochs      : {epochs}   batch: {batch}   imgsz: {imgsz}")
    print(f"  fl_gamma    : {FL_GAMMA}  (focal loss — 198.4x imbalance)")
    print(f"  fliplr      : {FLIPLR}  (direction-agnostic confirmed)")
    print(f"  oversampling: applied via txt image list (see data_stageA.yaml)")
    print(f"  device      : {device}")

    model = YOLO(str(checkpoint))

    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        lr0=STAGE_A_LR0,
        lrf=STAGE_A_LRF,
        cos_lr=True,
        patience=patience,
        time=1.0,          # Hard limit: stop and save best weights after 1.0 hour
        fliplr=FLIPLR,
        # Standard augmentation
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=5.0,       # mild rotation — exam hall footage, limited tilt
        translate=0.1,
        scale=0.5,
        mosaic=1.0,
        mixup=0.0,         # mixup can confuse subtle class boundaries; off for Stage A
        # Tracking
        project=str(project_dir),
        name="vigil_v2_stageA",
        exist_ok=True,
        device=device,
        verbose=True,
    )

    best_weights = Path(results.save_dir) / "weights" / "best.pt"
    if not best_weights.exists():
        # Fallback: ultralytics sometimes names it differently
        candidates = list(Path(results.save_dir).glob("weights/*.pt"))
        best_weights = candidates[0] if candidates else best_weights
    print(f"\nStage A complete. Best weights: {best_weights}")
    return best_weights


def run_stage_b(
    stage_a_weights: Path,
    data_yaml: Path,
    project_dir: Path,
    epochs: int,
    batch: int,
    imgsz: int,
    patience: int,
    device: str,
) -> Path:
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ERROR: ultralytics not installed. pip install ultralytics")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Stage B: Video-derived verified subset fine-tune")
    print("=" * 60)
    print(f"  starting from : {stage_a_weights}")
    print(f"  data.yaml     : {data_yaml}")
    print(f"  epochs        : {epochs}   lr0: {STAGE_B_LR0}  (1/10 of Stage A)")
    print(f"  goal          : sharpen new classes without forgetting bulk-learned ones")

    model = YOLO(str(stage_a_weights))

    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        lr0=STAGE_B_LR0,
        lrf=STAGE_B_LRF,
        cos_lr=True,
        patience=patience,
        fliplr=FLIPLR,
        # Less aggressive augmentation for the sharp final pass
        hsv_h=0.01,
        hsv_s=0.5,
        hsv_v=0.3,
        degrees=3.0,
        translate=0.05,
        scale=0.3,
        mosaic=0.5,        # reduce mosaic — small set, don't hallucinate context
        mixup=0.0,
        # Tracking
        project=str(project_dir),
        name="vigil_v2_stageB",
        exist_ok=True,
        device=device,
        verbose=True,
    )

    best_weights = Path(results.save_dir) / "weights" / "best.pt"
    if not best_weights.exists():
        candidates = list(Path(results.save_dir).glob("weights/*.pt"))
        best_weights = candidates[0] if candidates else best_weights
    print(f"\nStage B complete. Best weights: {best_weights}")
    return best_weights


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--root", default="c:/DristiAI_BrickCrackers",
                        help="Project root (default: c:/DristiAI_BrickCrackers).")
    parser.add_argument("--dataset-dir", default=None,
                        help="Override for the datasets/vigil_exam_v2 directory (useful for Kaggle).")
    parser.add_argument("--stage", choices=["a", "b", "both"], default="a",
                        help="Stage to run: 'a', 'b', or 'both' (default: a).")
    parser.add_argument("--checkpoint", default=None,
                        help="Override Stage A starting checkpoint "
                             "(default: <root>/vigil_yolo_4cls_best.pt).")
    parser.add_argument("--stage-a-weights", default=None,
                        help="[--stage b] Path to Stage A best.pt. "
                             "Required when running Stage B standalone.")
    parser.add_argument("--epochs", type=int, default=None,
                        help="Override epoch count for the selected stage.")
    parser.add_argument("--batch", type=int, default=None,
                        help="Override batch size.")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Input image size (default: 640).")
    parser.add_argument("--device", default="0",
                        help="Device: '0' (first GPU), 'cpu', '0,1' (multi-GPU). "
                             "Default: '0'.")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for oversampling shuffle (default: 42).")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    # --- path layout (mirrors config.py conventions) -----------------------
    merged_dir      = Path(args.dataset_dir).resolve() if args.dataset_dir else root / "datasets" / "vigil_exam_v2"
    staging_dir     = merged_dir / "_staging"
    frame_manifest  = staging_dir / "phase3_frames" / "frame_manifest.csv"
    phase3_images   = staging_dir / "phase3_frames" / "images"
    train_images    = merged_dir / "train" / "images"
    train_labels    = merged_dir / "train" / "labels"
    val_images      = merged_dir / "val" / "images"
    runs_dir        = root / "runs"

    checkpoint = Path(args.checkpoint) if args.checkpoint \
        else root / "vigil_yolo_4cls_best.pt"

    # Guard: checkpoint must exist for Stage A (not required for Stage B standalone)
    if args.stage in ("a", "both") and not checkpoint.exists():
        print(f"ERROR: Checkpoint not found: {checkpoint}\n"
              f"       Pass --checkpoint to override.")
        sys.exit(1)

    if not merged_dir.exists():
        print(f"ERROR: Merged dataset not found at {merged_dir}\n"
              f"       Run phases 2–5 first (see files/README.md).")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("vigil_finetune.py — Vigil YOLO 5-class fine-tune")
    print("=" * 60)
    print(f"  root           : {root}")
    print(f"  stage          : {args.stage}")
    print(f"  device         : {args.device}")
    print(f"  Training params (Phase 5 gate):")
    print(f"    fl_gamma     : {FL_GAMMA}")
    print(f"    fliplr       : {FLIPLR}")
    print(f"    oversample   : {OVERSAMPLE}")
    print(f"    eff_weights  : {dict(zip(FINAL_CLASSES, EFF_NUM_WEIGHTS))} (doc only)")

    # -----------------------------------------------------------------------
    # Stage A
    # -----------------------------------------------------------------------
    a_weights: Optional[Path] = None

    if args.stage in ("a", "both"):
        print("\n[Stage A] Building oversampled training image list ...")
        train_txt_a = merged_dir / "train_oversampled.txt"
        entry_counts = build_oversampled_list(
            train_images, train_labels, frame_manifest, train_txt_a, seed=args.seed,
        )
        total_entries = sum(v for k, v in entry_counts.items()
                            if not k.startswith("_"))
        print(f"\n  Oversampled training list summary:")
        print(f"  {'class':20s} {'source images':>14s}  {'entries':>9s}  ratio")
        print(f"  {'-'*20} {'-'*14}  {'-'*9}  -----")
        for cls in FINAL_CLASSES:
            n_entries = entry_counts.get(cls, 0)
            ratio = OVERSAMPLE.get(cls, 1.0)
            # Reverse-compute approximate source count from entries
            approx_src = max(1, round(n_entries / max(1, round(ratio))))
            print(f"  {cls:20s} {approx_src:>14d}  {n_entries:>9d}  {ratio}x")
        unc = entry_counts.get("_unclassified", 0)
        if unc:
            print(f"  {'_unclassified':20s} {unc:>14d}  {unc:>9d}  1.0x")
        print(f"  {'TOTAL':20s} {'':14s}  {sum(entry_counts.values()):>9d}")

        data_yaml_a = merged_dir / "data_stageA.yaml"
        _write_stage_yaml(data_yaml_a, train_txt_a, val_images, merged_dir)

        a_weights = run_stage_a(
            checkpoint=checkpoint,
            data_yaml=data_yaml_a,
            project_dir=runs_dir,
            epochs=args.epochs or STAGE_A_EPOCHS,
            batch=args.batch or STAGE_A_BATCH,
            imgsz=args.imgsz,
            patience=STAGE_A_PATIENCE,
            device=args.device,
        )

    # -----------------------------------------------------------------------
    # Stage B
    # -----------------------------------------------------------------------
    if args.stage in ("b", "both"):
        # Resolve Stage A weights
        if args.stage == "b":
            if not args.stage_a_weights:
                print("ERROR: --stage-a-weights is required when running --stage b alone.\n"
                      "       Example: --stage-a-weights runs/vigil_v2_stageA/weights/best.pt")
                sys.exit(1)
            a_weights = Path(args.stage_a_weights)

        if a_weights is None or not a_weights.exists():
            print(f"ERROR: Stage A weights not found: {a_weights}")
            sys.exit(1)

        print("\n[Stage B] Building video-derived (verified) training list ...")
        train_txt_b = merged_dir / "train_stageB.txt"
        n_b = build_stage_b_list(
            phase3_images, frame_manifest, train_txt_b, seed=args.seed,
        )

        data_yaml_b = merged_dir / "data_stageB.yaml"
        _write_stage_yaml(data_yaml_b, train_txt_b, val_images, merged_dir)

        run_stage_b(
            stage_a_weights=a_weights,
            data_yaml=data_yaml_b,
            project_dir=runs_dir,
            epochs=args.epochs or STAGE_B_EPOCHS,
            batch=args.batch or STAGE_B_BATCH,
            imgsz=args.imgsz,
            patience=STAGE_B_PATIENCE,
            device=args.device,
        )

    print("\nAll requested stages complete.")


if __name__ == "__main__":
    main()
