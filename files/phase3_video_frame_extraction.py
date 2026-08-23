#!/usr/bin/env python3
"""
phase3_video_frame_extraction.py
===================================
Turns the raw behavior-clip videos in datasets/new_data/{cheating_phone,
cheating_posture,edge_cases,normal_baseline}/ into labeled YOLO frames.

Three modes (--mode):

  generate-manifest
      Walks new_data_root, finds every video under each class folder, reads
      its duration via OpenCV, and writes a template CSV manifest at
      <new_data_root>/video_manifest.csv with columns:
          video_path, class_name, clip_id, start_sec, end_sec
      start_sec/end_sec default to the FULL video duration (0 -> duration).
      EDIT THIS FILE before running --mode extract if a clip's labeled
      behavior only happens in part of the video — narrow start_sec/end_sec
      to the verified action interval per the plan's requirement. Rows are
      grouped by clip_id (defaults to the video's filename stem) so Phase 4
      can keep all frames from one source clip on the same side of the
      train/val split (no leakage).

  extract
      Reads the manifest, and for every row: opens the video, steps through
      it at --frame-stride-sec, and for every sampled frame inside
      [start_sec, end_sec]:
        - runs the verified person detector (config.person_detector_ckpt)
        - for every person box found (conf >= --person-conf-thresh):
            * writes a `person` box (class id from FINAL_CLASSES)
            * ALSO writes the row's behavior-class box at the same
              coordinates, unless --no-dual-annotation is passed, in which
              case only the behavior-class box is written.
        - frames where the detector finds zero people are skipped and
          counted (not silently ignored).
        - near-duplicate consecutive frames are skipped via a cheap
          average-hash comparison (disable with --no-dedup).
        - per-video extraction is capped at --max-frames-per-video.
      Output goes to <merged_dataset_dir>/_staging/phase3_frames/
      {images,labels}/, plus frame_manifest.csv mapping every extracted
      frame back to its source clip_id (needed by Phase 4 for leakage-safe
      splitting) and its assigned behavior class.

  visualize
      Spot-checker: draws the written boxes (color-coded by class) onto a
      random sample of extracted frames and saves them as debug images, so
      you can eyeball alignment BEFORE merging into the final dataset.

Usage:
    python phase3_video_frame_extraction.py --mode generate-manifest --root /path/to/project
    # ... edit datasets/new_data/video_manifest.csv if needed ...
    python phase3_video_frame_extraction.py --mode extract --root /path/to/project
    python phase3_video_frame_extraction.py --mode visualize --root /path/to/project --sample-n 30
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from config import VigilConfig, add_common_args, VIDEO_EXTS
from common.logging_utils import setup_logger, Counter
from common.yolo_io import (
    YoloBox, write_yolo_label, read_yolo_label, clip_box, average_hash, hamming_distance,
)

LOGGER_NAME = "phase3_video_extraction"


# --------------------------------------------------------------------------- #
# Mode: generate-manifest
# --------------------------------------------------------------------------- #
def cmd_generate_manifest(cfg: VigilConfig, logger, counters: Counter):
    import cv2  # local import so `--mode visualize` etc. don't require it unnecessarily

    rows = []
    for folder_name, class_name in cfg.new_data_class_dirs.items():
        folder = cfg.new_data_root / folder_name
        if not folder.exists():
            logger.warning("Expected raw-video folder does not exist, skipping: %s", folder)
            continue
        videos = sorted(p for p in folder.rglob("*") if p.suffix.lower() in VIDEO_EXTS)
        logger.info("Found %d video(s) under %s (class=%s)", len(videos), folder, class_name)
        for vid in videos:
            cap = cv2.VideoCapture(str(vid))
            if not cap.isOpened():
                logger.error("Could not open video (skipping): %s", vid)
                counters.inc("manifest_videos_unreadable")
                continue
            fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
            duration = (frame_count / fps) if fps > 0 else 0.0
            cap.release()
            if duration <= 0:
                logger.warning("Video reports zero/invalid duration (fps=%s, frames=%s): %s", fps, frame_count, vid)
                counters.inc("manifest_videos_zero_duration")
            rows.append({
                "video_path": str(vid),
                "class_name": class_name,
                "clip_id": vid.stem,
                "start_sec": 0.0,
                "end_sec": round(duration, 2),
            })
            counters.inc("manifest_videos_listed")

    cfg.new_data_root.mkdir(parents=True, exist_ok=True)
    manifest_path = cfg.phase3_manifest_path
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["video_path", "class_name", "clip_id", "start_sec", "end_sec"])
        writer.writeheader()
        writer.writerows(rows)
    logger.info("Wrote template manifest with %d rows to: %s", len(rows), manifest_path)
    logger.info("EDIT start_sec/end_sec per row now if a behavior only occurs in part of its clip, "
                "then re-run with --mode extract.")


# --------------------------------------------------------------------------- #
# Mode: extract
# --------------------------------------------------------------------------- #
def _load_manifest(manifest_path: Path, logger) -> List[Dict]:
    if not manifest_path.exists():
        logger.error("Manifest not found at %s. Run --mode generate-manifest first.", manifest_path)
        raise SystemExit(1)
    rows = []
    with open(manifest_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            try:
                row["start_sec"] = float(row["start_sec"])
                row["end_sec"] = float(row["end_sec"])
            except (ValueError, KeyError) as e:
                logger.warning("Manifest row %d malformed (%s), skipping: %r", i, e, row)
                continue
            if not row.get("video_path") or not row.get("class_name"):
                logger.warning("Manifest row %d missing video_path/class_name, skipping: %r", i, row)
                continue
            rows.append(row)
    return rows


def _resolve_person_class_id(model_names: Dict[int, str], fallback: int, logger) -> int:
    for cid, name in model_names.items():
        if str(name).lower() == "person":
            return int(cid)
    logger.warning("No class literally named 'person' in model.names=%s — falling back to id %d.",
                    model_names, fallback)
    return fallback


def cmd_extract(cfg: VigilConfig, logger, counters: Counter, person_class_id_fallback: int):
    import cv2
    from ultralytics import YOLO
    from PIL import Image
    import numpy as np

    if not cfg.person_detector_ckpt.exists():
        logger.error("Person detector checkpoint not found: %s", cfg.person_detector_ckpt)
        raise SystemExit(1)

    detector = YOLO(str(cfg.person_detector_ckpt))
    det_person_id = _resolve_person_class_id(detector.names, person_class_id_fallback, logger)
    logger.info("Using detector class id %d as 'person' for box generation.", det_person_id)

    if "person" not in cfg.final_classes:
        logger.error("'person' is not in config.final_classes=%s — cannot proceed.", cfg.final_classes)
        raise SystemExit(1)
    final_person_id = cfg.final_classes.index("person")
    class_name_to_final_id = {name: i for i, name in enumerate(cfg.final_classes)}

    rows = _load_manifest(cfg.phase3_manifest_path, logger)
    logger.info("Loaded %d manifest row(s) from %s", len(rows), cfg.phase3_manifest_path)

    out_images_dir = cfg.phase3_staging_dir / "images"
    out_labels_dir = cfg.phase3_staging_dir / "labels"
    out_images_dir.mkdir(parents=True, exist_ok=True)
    out_labels_dir.mkdir(parents=True, exist_ok=True)

    frame_manifest_rows = []

    for row in rows:
        video_path = Path(row["video_path"])
        class_name = row["class_name"]
        clip_id = row.get("clip_id") or video_path.stem
        start_sec, end_sec = row["start_sec"], row["end_sec"]

        if class_name not in class_name_to_final_id:
            logger.error("Manifest class_name '%s' (clip %s) is not in final_classes %s — skipping clip.",
                          class_name, clip_id, cfg.final_classes)
            counters.inc("clips_skipped_bad_class_name")
            continue
        behavior_class_id = class_name_to_final_id[class_name]

        if not video_path.exists():
            logger.error("Video referenced in manifest does not exist, skipping: %s", video_path)
            counters.inc("clips_skipped_missing_video")
            continue

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            logger.error("Could not open video, skipping: %s", video_path)
            counters.inc("clips_skipped_unreadable")
            continue

        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        if fps <= 0:
            logger.error("Video reports invalid fps=%s, skipping: %s", fps, video_path)
            counters.inc("clips_skipped_bad_fps")
            cap.release()
            continue

        frame_step = max(1, round(fps * cfg.frame_stride_sec))
        start_frame = max(0, int(start_sec * fps))
        end_frame = int(end_sec * fps) if end_sec > 0 else int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        logger.info("[%s] class=%s fps=%.2f frame_step=%d range=[%d, %d]",
                     clip_id, class_name, fps, frame_step, start_frame, end_frame)

        extracted_this_video = 0
        last_kept_hash: Optional[int] = None
        frame_idx = start_frame

        while frame_idx < end_frame:
            if extracted_this_video >= cfg.max_frames_per_video:
                logger.info("[%s] hit max_frames_per_video=%d, stopping early.", clip_id, cfg.max_frames_per_video)
                counters.inc("clips_hit_max_frames_cap")
                break

            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                logger.warning("[%s] failed to read frame %d, skipping.", clip_id, frame_idx)
                counters.inc("frames_skipped_unreadable")
                frame_idx += frame_step
                continue

            h, w = frame.shape[:2]
            if h == 0 or w == 0:
                logger.warning("[%s] frame %d has invalid dimensions, skipping.", clip_id, frame_idx)
                counters.inc("frames_skipped_bad_dims")
                frame_idx += frame_step
                continue

            if cfg.dedup_ahash_threshold is not None:
                pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                h_now = average_hash(pil_frame)
                if last_kept_hash is not None and hamming_distance(h_now, last_kept_hash) < cfg.dedup_ahash_threshold:
                    counters.inc("frames_skipped_near_duplicate")
                    frame_idx += frame_step
                    continue
                last_kept_hash = h_now

            try:
                results = detector.predict(source=frame, conf=cfg.person_conf_thresh, verbose=False)
            except Exception as e:  # noqa: BLE001
                logger.error("[%s] detector.predict failed on frame %d: %s", clip_id, frame_idx, e)
                counters.inc("frames_skipped_predict_error")
                frame_idx += frame_step
                continue

            r = results[0]
            person_boxes_xyxy = []
            if r.boxes is not None and len(r.boxes) > 0:
                for c, xy in zip(r.boxes.cls.tolist(), r.boxes.xyxy.tolist()):
                    if int(c) == det_person_id:
                        person_boxes_xyxy.append(xy)

            if not person_boxes_xyxy:
                counters.inc("frames_skipped_zero_persons")
                frame_idx += frame_step
                continue

            out_boxes: List[YoloBox] = []
            for (x1, y1, x2, y2) in person_boxes_xyxy:
                xc, yc = (x1 + x2) / 2.0 / w, (y1 + y2) / 2.0 / h
                bw, bh = (x2 - x1) / w, (y2 - y1) / h
                xc, yc, bw, bh, changed = clip_box(xc, yc, bw, bh)
                if bw <= 0 or bh <= 0:
                    counters.inc("boxes_dropped_degenerate")
                    continue
                if changed:
                    counters.inc("boxes_clipped_to_frame")

                if cfg.dual_annotation:
                    out_boxes.append(YoloBox(final_person_id, xc, yc, bw, bh))
                out_boxes.append(YoloBox(behavior_class_id, xc, yc, bw, bh))

            if not out_boxes:
                counters.inc("frames_skipped_all_boxes_degenerate")
                frame_idx += frame_step
                continue

            frame_name = f"{clip_id}_{frame_idx:06d}"
            img_out_path = out_images_dir / f"{frame_name}.jpg"
            label_out_path = out_labels_dir / f"{frame_name}.txt"

            ok = cv2.imwrite(str(img_out_path), frame)
            if not ok:
                logger.error("[%s] failed to write frame image %s", clip_id, img_out_path)
                counters.inc("frames_write_failed")
                frame_idx += frame_step
                continue
            write_yolo_label(label_out_path, out_boxes)

            frame_manifest_rows.append({
                "image_filename": img_out_path.name,
                "clip_id": clip_id,
                "class_name": class_name,
                "video_path": str(video_path),
                "frame_idx": frame_idx,
                "n_boxes": len(out_boxes),
            })
            extracted_this_video += 1
            counters.inc("frames_extracted")
            frame_idx += frame_step

        cap.release()
        logger.info("[%s] extracted %d frame(s).", clip_id, extracted_this_video)
        counters.inc("clips_processed")

    manifest_out = cfg.phase3_staging_dir / "frame_manifest.csv"
    with open(manifest_out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["image_filename", "clip_id", "class_name", "video_path",
                                                 "frame_idx", "n_boxes"])
        writer.writeheader()
        writer.writerows(frame_manifest_rows)
    logger.info("frame_manifest.csv written with %d rows to: %s", len(frame_manifest_rows), manifest_out)


# --------------------------------------------------------------------------- #
# Mode: visualize
# --------------------------------------------------------------------------- #
_DEBUG_COLORS = [
    (230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48),
    (145, 30, 180), (70, 240, 240), (240, 50, 230), (210, 245, 60), (250, 190, 212),
]


def cmd_visualize(cfg: VigilConfig, logger, counters: Counter, sample_n: int, seed: int):
    from PIL import Image, ImageDraw, ImageFont

    images_dir = cfg.phase3_staging_dir / "images"
    labels_dir = cfg.phase3_staging_dir / "labels"
    out_dir = cfg.phase3_debug_viz_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    image_files = sorted(images_dir.glob("*.jpg"))
    if not image_files:
        logger.error("No extracted frames found in %s — run --mode extract first.", images_dir)
        return

    rng = random.Random(seed)
    sample = rng.sample(image_files, k=min(sample_n, len(image_files)))
    logger.info("Rendering %d spot-check images to %s", len(sample), out_dir)

    try:
        font = ImageFont.load_default()
    except Exception:  # noqa: BLE001
        font = None

    for img_path in sample:
        label_path = labels_dir / f"{img_path.stem}.txt"
        boxes = read_yolo_label(label_path, logger=logger)

        with Image.open(img_path) as im:
            im = im.convert("RGB")
            w, h = im.size
            draw = ImageDraw.Draw(im)
            for b in boxes:
                x1, y1, x2, y2 = b.to_xyxy()
                x1, y1, x2, y2 = x1 * w, y1 * h, x2 * w, y2 * h
                color = _DEBUG_COLORS[b.class_id % len(_DEBUG_COLORS)]
                draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
                label_text = (cfg.final_classes[b.class_id]
                              if 0 <= b.class_id < len(cfg.final_classes) else str(b.class_id))
                draw.text((x1 + 2, max(0, y1 - 12)), label_text, fill=color, font=font)
            im.save(out_dir / img_path.name)
        counters.inc("visualized_frames")

    logger.info("Spot-check images written to: %s", out_dir)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(parser)
    parser.add_argument("--mode", choices=["generate-manifest", "extract", "visualize"], required=True)
    parser.add_argument("--person-class-id-fallback", type=int, default=0,
                         help="Used only if the detector checkpoint has no class literally named 'person'.")
    parser.add_argument("--sample-n", type=int, default=30, help="[visualize] number of frames to spot-check.")
    args = parser.parse_args()
    cfg = VigilConfig.from_args(args)

    logger = setup_logger(LOGGER_NAME, log_dir=cfg.reports_dir)
    counters = Counter()

    logger.info("=== Phase 3: mode=%s ===", args.mode)

    if args.mode == "generate-manifest":
        cmd_generate_manifest(cfg, logger, counters)
    elif args.mode == "extract":
        cmd_extract(cfg, logger, counters, args.person_class_id_fallback)
    elif args.mode == "visualize":
        cmd_visualize(cfg, logger, counters, args.sample_n, cfg.random_seed)

    counters.log_summary(logger, title=f"Phase 3 [{args.mode}] counters")


if __name__ == "__main__":
    main()
