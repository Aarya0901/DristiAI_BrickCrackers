#!/usr/bin/env python3
"""
train_vigil_yolo.py — Fine-tune YOLO11-s on the Vigil exam-hall behavior dataset.

Trains the 6-class Vigil taxonomy (5 learned from SCB + person from pretrained
COCO weights). Rebuilt dataset: session-grouped 70/15/15 split with a real
labeled test set. See datasets/vigil_exam/README.md for the audit findings this
version addresses.

WHAT THIS VALIDATES:
  Per-class detection AP of 5 SCB behavior classes on SCB classroom imagery.

WHAT THIS DOES NOT VALIDATE:
  - exam-hall CCTV domain transfer (SCB is classroom data, unlabeled CCTV
    images in this dataset contribute nothing to training)
  - gaze/attention field, seat-graph pairwise evidence, counterfactual
    alerts, per-seat baselines, abstention (none implemented here)
  - FP-per-student-hour (VIGIL headline metric — needs tracked video pipeline)
  - phone/paper/chit/earpiece detection (0 instances; do not claim)

Usage:
  python scripts/train_vigil_yolo.py
  python scripts/train_vigil_yolo.py --epochs 100 --batch 16
  python scripts/train_vigil_yolo.py --dry-run

NOTE: ultralytics (YOLO11) is AGPL-3.0 — prototyping/research use only.
"""

import argparse
import csv
import datetime
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VIGIL_DIR = ROOT / "datasets" / "vigil_exam"


def parse_args():
    p = argparse.ArgumentParser(
        description="Fine-tune YOLO11-s on Vigil behavior dataset"
    )
    p.add_argument("--data", default=str(VIGIL_DIR / "vigil_exam.yaml"),
                   help="Path to dataset YAML config")
    p.add_argument("--epochs", type=int, default=100,
                   help="Training epochs (default: 100)")
    p.add_argument("--batch", type=int, default=16,
                   help="Batch size (default: 16; use 8 on 6GB GPUs)")
    p.add_argument("--imgsz", type=int, default=640,
                   help="Input image size (default: 640)")
    p.add_argument("--device", default="cuda",
                   help="Training device: cuda or cpu (default: cuda)")
    p.add_argument("--name", default=f"vigil_yolo_{datetime.datetime.now():%Y%m%d_%H%M%S}",
                   help="Experiment name (default: auto-timestamped)")
    p.add_argument("--weights", default="yolo11s.pt",
                   help="Pretrained weights to start from (default: yolo11s.pt)")
    p.add_argument("--workers", type=int, default=8,
                   help="Dataloader workers (default: 8)")
    p.add_argument("--dry-run", action="store_true",
                   help="Print config and exit without training")
    p.add_argument("--resume", default=None,
                   help="Resume training from a checkpoint path")
    return p.parse_args()


def log(msg: str):
    print(f"[YOLO TRAIN] {msg}")


def report_per_class_ap(run_dir: Path):
    """Extract and print per-class AP from YOLO results.csv."""
    results_csv = run_dir / "results.csv"
    if not results_csv.exists():
        log(f"WARNING: {results_csv} not found — cannot report per-class AP")
        return

    with open(results_csv) as f:
        rows = list(csv.DictReader(f))
    if not rows:
        return
    best = rows[-1]
    cols = {k.strip(): v for k, v in best.items()}

    # YOLO logs per-class metrics under names like "metrics/precision(B)" etc.
    # Per-class AP lives in the validation evaluator; if unavailable in
    # results.csv, fall back to what we can show.
    log("Final-epoch metrics from results.csv:")
    for k, v in cols.items():
        if "mAP" in k or "precision" in k or "recall" in k:
            try:
                log(f"  {k}: {float(v):.4f}")
            except ValueError:
                log(f"  {k}: {v}")


def main():
    args = parse_args()

    log(f"Data config: {args.data}")
    log(f"Epochs: {args.epochs}, Batch: {args.batch}, Image size: {args.imgsz}")
    log(f"Device: {args.device}, Experiment: {args.name}")

    data_path = Path(args.data)
    if not data_path.exists():
        log(f"ERROR: dataset config not found: {data_path}")
        log("Run scripts/build_vigil_dataset.py first.")
        sys.exit(1)

    vigil_root = data_path.parent
    for split in ("train", "val", "test"):
        img_dir = vigil_root / "images" / split
        lbl_dir = vigil_root / "labels" / split
        imgs = list(img_dir.glob("scb_*.jpg")) if img_dir.exists() else []
        lbls = list(lbl_dir.glob("scb_*.txt")) if lbl_dir.exists() else []
        log(f"  {split}: {len(imgs)} labeled images, {len(lbls)} labels")

    import yaml
    with open(data_path) as f:
        data_cfg = yaml.safe_load(f)
    log(f"Classes: {data_cfg['nc']} — {list(data_cfg['names'].values())}")

    try:
        from ultralytics import YOLO
    except ImportError:
        log("ERROR: ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    if args.dry_run:
        log("DRY RUN — config validated. Remove --dry-run to start.")
        return

    log("Loading pretrained YOLO11-s...")
    model = YOLO(args.weights)

    log("Starting training...")
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        name=args.name,
        workers=args.workers,
        pretrained=True,
        save=True,
        save_period=10,
        plots=True,
        exist_ok=True,
        resume=args.resume,
        patience=20,
        lr0=0.01,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        box=7.5,
        cls=0.5,
        dfl=1.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=0.0,
        translate=0.1,
        scale=0.5,
        shear=0.0,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.0,
        erasing=0.0,
    )

    log(f"Training complete. Best model: {results.best}")

    # Honest metric reporting: overall + per-class where available
    log("--- Final metrics (overall) ---")
    for key in ("metrics/mAP50(B)", "metrics/mAP50-95(B)",
                "metrics/precision(B)", "metrics/recall(B)"):
        val = results.results_dict.get(key)
        if val is not None:
            log(f"  {key}: {val:.4f}")

    # Per-class evaluation on the TEST set (now exists)
    log("--- Evaluating best weights on TEST split ---")
    from ultralytics import YOLO as Y
    best = Y(str(results.best))
    metrics = best.val(data=str(data_path), split="test", plots=False)

    # box.ap_class_index + box.p / box.ap50 for per-class AP
    names = data_cfg["names"]
    log("--- PER-CLASS AP (test split) ---")
    if hasattr(metrics, "box") and hasattr(metrics.box, "maps"):
        for i, cid in enumerate(metrics.box.ap_class_index):
            name = names.get(int(cid), f"class_{cid}")
            ap50 = metrics.box.maps[i] if i < len(metrics.box.maps) else None
            log(f"  {int(cid)} {name}: mAP50-95={ap50:.4f}" if ap50 is not None
                else f"  {int(cid)} {name}: CANNOT VERIFY")
    else:
        log("  CANNOT VERIFY per-class AP — ultralytics metrics object "
            "does not expose per-class maps in this version. "
            "Inspect runs/detect/<name>/results.csv and PR curves instead.")

    log("DONE. Reminder: mAP here is on SCB classroom images, not exam-hall CCTV.")
    log("Do NOT report this as VIGIL false-alert or student-hour performance.")


if __name__ == "__main__":
    main()
