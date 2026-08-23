#!/usr/bin/env python3
"""
phase0_model_sanity_check.py
=============================
Diagnose why `person` detections are failing on `vigil_yolo_4cls_best.pt`.

What this script does, in order:
  1. Loads the checkpoint directly via `ultralytics.YOLO` (bypassing any
     wrapper pipeline) and dumps `model.names` — the #1 cause of "class X
     never detects" bugs is a label/index mismatch between training and
     inference, and this makes it visible immediately.
  2. Runs `model.predict()` on a folder of known-positive images at a very
     low confidence floor (default 0.001) and high IoU (near-disables NMS)
     so you see *every* candidate box the model produced, not just what
     survived the default 0.25 conf / 0.45 IoU thresholds. This tells you
     whether the model is finding person-shaped boxes at all but scoring
     them low, vs. never proposing them.
  3. Aggregates, per class id, the max/mean confidence seen across the
     sample set — if class 0 (or whatever `person`'s id is) is
     systematically near-zero while other classes score normally, that's
     strong evidence of a training-data or label-remap problem rather than
     an inference-pipeline bug.
  4. Runs a stock COCO-pretrained checkpoint (`yolov8n.pt` by default, or
     whatever you pass via --stock-yolo-ckpt) on the *same* images. COCO's
     `person` class is id 0. If the stock model finds people fine but the
     custom checkpoint doesn't, the bug is in the custom model/training,
     not in image loading / preprocessing / the calling pipeline.
  5. (Optional) If you point --pipeline-module at your wrapper's module
     path (e.g. `backend.track_pipeline`) and --pipeline-func at the
     function name that runs inference, this script will also call it and
     print its raw output next to the direct-model output for side-by-side
     comparison. This step is best-effort and will not crash the rest of
     the script if your pipeline has other required setup (DB, etc.) —
     it just logs the failure and moves on.

Usage:
    python phase0_model_sanity_check.py --root /path/to/DristiAI_BrickCrackers
    python phase0_model_sanity_check.py --sanity-images-dir path/to/known_positive_imgs
"""

from __future__ import annotations

import argparse
import importlib
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

from config import VigilConfig, add_common_args, IMAGE_EXTS
from common.logging_utils import setup_logger, Counter
from common.yolo_io import get_image_size

LOGGER_NAME = "phase0_sanity_check"


def _load_yolo(ckpt_path_or_name: str, logger):
    try:
        from ultralytics import YOLO
    except ImportError as e:
        logger.error("ultralytics is not installed. `pip install ultralytics`.")
        raise SystemExit(1) from e

    try:
        model = YOLO(ckpt_path_or_name)
    except Exception as e:  # noqa: BLE001 - want to surface any load failure, then keep going
        logger.error("Failed to load model '%s': %s", ckpt_path_or_name, e)
        raise
    return model


def _collect_sample_images(images_dir: Path, logger, limit: Optional[int] = None) -> List[Path]:
    if not images_dir.exists():
        logger.error("Sanity-check images dir does not exist: %s", images_dir)
        return []
    imgs = sorted(p for p in images_dir.rglob("*") if p.suffix.lower() in IMAGE_EXTS)
    if limit:
        imgs = imgs[:limit]
    logger.info("Found %d candidate sanity-check images in %s", len(imgs), images_dir)
    return imgs


def _run_raw_predict(model, images: List[Path], conf: float, iou: float, logger, counters: Counter) -> Dict:
    """
    Returns a report dict:
        {
          "per_image": [ {image, boxes: [{class_id, conf, xyxy}]} ... ],
          "per_class": { class_id: {"n_boxes": int, "max_conf": float, "mean_conf": float} }
        }
    """
    per_image = []
    per_class_conf: Dict[int, List[float]] = {}

    for img_path in images:
        dims = get_image_size(img_path, logger=logger)
        if dims is None:
            counters.inc("skipped_corrupt_image")
            continue

        try:
            results = model.predict(source=str(img_path), conf=conf, iou=iou, verbose=False)
        except Exception as e:  # noqa: BLE001
            logger.error("predict() failed on %s: %s", img_path, e)
            counters.inc("predict_failures")
            continue

        r = results[0]
        boxes_out = []
        if r.boxes is not None and len(r.boxes) > 0:
            cls_arr = r.boxes.cls.tolist()
            conf_arr = r.boxes.conf.tolist()
            xyxy_arr = r.boxes.xyxy.tolist()
            for c, cf, xy in zip(cls_arr, conf_arr, xyxy_arr):
                c = int(c)
                boxes_out.append({"class_id": c, "conf": round(float(cf), 4), "xyxy": [round(v, 1) for v in xy]})
                per_class_conf.setdefault(c, []).append(float(cf))
        else:
            counters.inc("images_with_zero_raw_boxes")

        per_image.append({"image": str(img_path), "image_size": dims, "boxes": boxes_out})
        counters.inc("images_processed")

    per_class_summary = {}
    for c, confs in per_class_conf.items():
        per_class_summary[c] = {
            "n_boxes": len(confs),
            "max_conf": round(max(confs), 4),
            "mean_conf": round(sum(confs) / len(confs), 4),
            "min_conf": round(min(confs), 4),
        }

    return {"per_image": per_image, "per_class": per_class_summary}


def _try_pipeline_comparison(pipeline_module: str, pipeline_func: str, images: List[Path], logger):
    logger.info("Attempting wrapped-pipeline comparison via %s.%s ...", pipeline_module, pipeline_func)
    try:
        mod = importlib.import_module(pipeline_module)
        func = getattr(mod, pipeline_func)
    except Exception as e:  # noqa: BLE001
        logger.warning("Could not import pipeline function (%s.%s): %s. Skipping pipeline comparison.",
                        pipeline_module, pipeline_func, e)
        return None

    outputs = []
    for img_path in images[:5]:  # keep this cheap; it's a spot-check, not a benchmark
        try:
            out = func(str(img_path))
            outputs.append({"image": str(img_path), "pipeline_output": repr(out)[:2000]})
        except Exception as e:  # noqa: BLE001
            logger.warning("Pipeline function raised on %s: %s", img_path, e)
            outputs.append({"image": str(img_path), "error": str(e)})
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(parser)
    parser.add_argument("--conf", type=float, default=0.001,
                         help="Confidence floor for the raw diagnostic pass (default: 0.001 = near-disabled).")
    parser.add_argument("--iou", type=float, default=0.99,
                         help="IoU threshold for NMS in the raw diagnostic pass (default: 0.99 = near-disabled NMS).")
    parser.add_argument("--limit", type=int, default=50, help="Max number of sanity images to run.")
    parser.add_argument("--person-class-id", type=int, default=0,
                         help="Expected class id for 'person' in the custom checkpoint (default 0).")
    parser.add_argument("--skip-stock-comparison", action="store_true")
    parser.add_argument("--pipeline-module", type=str, default=None,
                         help="Optional dotted module path of your wrapper pipeline, e.g. backend.track_pipeline")
    parser.add_argument("--pipeline-func", type=str, default=None,
                         help="Function name inside --pipeline-module that takes an image path and runs inference.")
    args = parser.parse_args()
    cfg = VigilConfig.from_args(args)

    logger = setup_logger(LOGGER_NAME, log_dir=cfg.reports_dir)
    counters = Counter()

    logger.info("=== Phase 0: Model Sanity Check ===")
    logger.info("Custom checkpoint : %s", cfg.person_detector_ckpt)
    logger.info("Sanity images dir : %s", cfg.sanity_images_dir)

    if not Path(cfg.person_detector_ckpt).exists():
        logger.error("Checkpoint file not found: %s. Pass --person-detector-ckpt to override.",
                      cfg.person_detector_ckpt)
        sys.exit(1)

    images = _collect_sample_images(cfg.sanity_images_dir, logger, limit=args.limit)
    if not images:
        logger.error("No sanity-check images found — nothing to diagnose. "
                      "Point --sanity-images-dir at a folder with known-positive person images.")
        sys.exit(1)

    # --- Step 1: load custom model, dump names -----------------------------
    custom_model = _load_yolo(str(cfg.person_detector_ckpt), logger)
    names = custom_model.names
    logger.info("Custom model.names: %s", json.dumps(names, indent=2))
    if args.person_class_id not in names:
        logger.warning("Expected person-class-id %d not present in model.names keys %s",
                        args.person_class_id, list(names.keys()))
    else:
        logger.info("model.names[%d] = %r (expected 'person')", args.person_class_id, names[args.person_class_id])

    try:
        logger.info("Checkpoint task=%s, stride=%s, imgsz(model.args)=%s",
                     getattr(custom_model, "task", "?"),
                     getattr(custom_model.model, "stride", "?"),
                     getattr(custom_model, "overrides", {}).get("imgsz", "?"))
    except Exception as e:  # noqa: BLE001
        logger.debug("Could not read extended checkpoint metadata: %s", e)

    # --- Step 2 + 3: raw low-threshold predict + per-class confidence ------
    logger.info("Running raw diagnostic predict (conf=%.4f, iou=%.4f) on %d images ...",
                 args.conf, args.iou, len(images))
    custom_report = _run_raw_predict(custom_model, images, args.conf, args.iou, logger, counters)

    logger.info("---- Per-class raw confidence summary (custom checkpoint) ----")
    if not custom_report["per_class"]:
        logger.warning("ZERO boxes of ANY class were produced across all %d images, even at conf=%.4f. "
                        "This points to a global inference problem (wrong input size/normalization, "
                        "corrupted weights, or wrong task head) rather than a person-specific issue.",
                        len(images), args.conf)
    for c, stats in sorted(custom_report["per_class"].items()):
        cname = names.get(c, "?")
        flag = "  <-- PERSON CLASS" if c == args.person_class_id else ""
        logger.info("class %d (%s): n=%d max_conf=%.4f mean_conf=%.4f min_conf=%.4f%s",
                     c, cname, stats["n_boxes"], stats["max_conf"], stats["mean_conf"], stats["min_conf"], flag)

    person_stats = custom_report["per_class"].get(args.person_class_id)
    other_classes_present = any(c != args.person_class_id for c in custom_report["per_class"])
    if person_stats is None and other_classes_present:
        logger.warning("Person-specific bug indicated: OTHER classes produced boxes at low threshold, "
                        "but class %d (person) produced NONE. Check label/index shift in training data, "
                        "or whether 'person' boxes were systematically dropped during dataset prep.",
                        args.person_class_id)
    elif person_stats is None and not other_classes_present:
        logger.warning("No class produced boxes — likely a global issue, not person-specific. See note above.")
    elif person_stats is not None and person_stats["max_conf"] < 0.15:
        logger.warning("Person class IS being proposed but with very low confidence (max=%.4f). "
                        "This smells like a training/convergence issue for that class rather than a "
                        "pure indexing bug — check per-class loss curves and training label counts.",
                        person_stats["max_conf"])
    elif person_stats is not None:
        logger.info("Person class produced boxes with reasonable confidence at low threshold "
                     "(max=%.4f). If default-threshold inference still shows no person detections, "
                     "the bug is likely downstream: default conf/iou too aggressive, or the wrapper "
                     "pipeline is filtering/relabeling class %d incorrectly.", person_stats["max_conf"],
                     args.person_class_id)

    # --- Step 4: stock model comparison -------------------------------------
    if not args.skip_stock_comparison:
        logger.info("Running stock checkpoint '%s' on the same images for comparison "
                     "(COCO person class id = 0)...", cfg.stock_yolo_ckpt)
        try:
            stock_model = _load_yolo(cfg.stock_yolo_ckpt, logger)
            stock_report = _run_raw_predict(stock_model, images, conf=0.25, iou=0.45, logger=logger, counters=counters)
            stock_person = stock_report["per_class"].get(0)
            if stock_person:
                logger.info("Stock model found %d person boxes (max_conf=%.4f) across %d images.",
                             stock_person["n_boxes"], stock_person["max_conf"], len(images))
                if person_stats is None or person_stats.get("n_boxes", 0) == 0:
                    logger.warning("CONCLUSION: stock model detects people fine on these exact images but the "
                                    "custom checkpoint does not -> bug is in the custom model/training/labels, "
                                    "NOT in image loading, preprocessing, or environment.")
            else:
                logger.warning("Stock model found ZERO people on these 'known-positive' images. "
                                "Reconsider whether these images actually contain clearly visible people, "
                                "or whether there's an environment-level image loading problem "
                                "(check counters below for skipped_corrupt_image).")
        except Exception as e:  # noqa: BLE001
            logger.error("Stock model comparison failed: %s", e)

    # --- Step 5: optional wrapped-pipeline comparison -----------------------
    if args.pipeline_module and args.pipeline_func:
        pipeline_out = _try_pipeline_comparison(args.pipeline_module, args.pipeline_func, images, logger)
        if pipeline_out:
            logger.info("Pipeline comparison output (first 5 images):\n%s", json.dumps(pipeline_out, indent=2))

    # --- Dump full report ----------------------------------------------------
    cfg.reports_dir.mkdir(parents=True, exist_ok=True)
    out_path = cfg.reports_dir / "phase0_sanity_check_report.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"model_names": names, "custom_model_report": custom_report}, f, indent=2)
    logger.info("Full raw report written to: %s", out_path)

    counters.log_summary(logger, title="Phase 0 counters")


if __name__ == "__main__":
    main()
