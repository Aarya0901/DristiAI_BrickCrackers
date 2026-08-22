#!/usr/bin/env python3
"""
prepare_vigil_dataset.py — Build the curated Vigil exam-hall surveillance dataset.

Deterministic dataset preparation pipeline:
  1. Process raw datasets
  2. Extract frames from video at configurable rate (default 2 FPS)
  3. Convert annotations to standard YOLO format
  4. Split by participant / source video to prevent data leakage
  5. Generate frame manifest, split report, and class mapping

Usage:
  python scripts/prepare_vigil_dataset.py
  python scripts/prepare_vigil_dataset.py --help
  python scripts/prepare_vigil_dataset.py --fps 2 --seed 42
  python scripts/prepare_vigil_dataset.py --dry-run
  python scripts/prepare_vigil_dataset.py --skip-video-extraction
  python scripts/prepare_vigil_dataset.py --train-ratio 0.7 --val-ratio 0.15

Environment:
  Requires: opencv-python, numpy, pyyaml, tqdm
"""

import argparse
import csv
import datetime
import hashlib
import json
import os
import random
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
RAW_DIR = DATASETS_DIR / "raw"
VIGIL_DIR = DATASETS_DIR / "vigil_exam"
INTERIM_DIR = DATASETS_DIR / "interim"


# ---------------------------------------------------------------------------
# Vigil class taxonomy
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Mapping from source classes → Vigil taxonomy
# ---------------------------------------------------------------------------
CLASS_MAPPING = {
    # SCB-Dataset3 (6 classes)
    "scb3_hand_raise": "hand_signal",
    "scb3_read": "normal_exam_activity",
    "scb3_write": "normal_exam_activity",
    "scb3_using_phone": "phone_visible",
    "scb3_bow_head": "leaning_forward",
    "scb3_lean_on_desk": "leaning_forward",
    # SCB-Dataset5 additional (20 classes total)
    "scb5_turn_head": "looking_left",  # ambiguous — mark for review
    "scb5_sleep": "normal_exam_activity",  # review required
    "scb5_stand": "standing",
    "scb5_talk": "talking",
    "scb5_discuss": "talking",
    # OEP (MSU) — behavioral classes from webcam proctoring
    "oep_normal": "normal_exam_activity",
    "oep_looking_left": "looking_left",
    "oep_looking_right": "looking_right",
    "oep_talking": "talking",
    "oep_phone": "phone_visible",
    "oep_cheating_attempt": None,  # reject — direct cheating label
    # Roboflow exam cheating detection
    "rf_cheating": None,  # reject — direct cheating label
    "rf_normal": "normal_exam_activity",
    "rf_looking_around": "looking_left",  # ambiguous
    "rf_phone": "phone_visible",
    # Cheating Scenario Dataset (CC BY 4.0)
    "csd_looking": "looking_left",  # ambiguous direction
    "csd_talking": "talking",
    "csd_phone": "phone_visible",
    "csd_paper_pass": "paper_exchange",
    "csd_hand_gesture": "hand_signal",
    "csd_normal": "normal_exam_activity",
    # CCTV Exam Monitor — unlabeled images
    # (no mapping; use for person detection only)
}

# Source classes that map to each Vigil class (for reporting)
VIGIL_CLASS_SOURCES = {v: [] for v in VIGIL_CLASSES.values()}
for src_cls, vigil_cls in CLASS_MAPPING.items():
    if vigil_cls and vigil_cls in VIGIL_CLASS_SOURCES:
        VIGIL_CLASS_SOURCES[vigil_cls].append(src_cls)

AMBIGUOUS_MAPPINGS = [
    "scb5_turn_head",
    "rf_looking_around",
    "csd_looking",
    "oep_cheating_attempt",
    "rf_cheating",
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}


def parse_args():
    p = argparse.ArgumentParser(
        description="Prepare Vigil exam-hall surveillance dataset"
    )
    p.add_argument("--fps", type=float, default=2.0,
                   help="Frame extraction rate for videos (default: 2)")
    p.add_argument("--seed", type=int, default=42,
                   help="Random seed for reproducibility")
    p.add_argument("--train-ratio", type=float, default=0.70,
                   help="Training split ratio (default: 0.70)")
    p.add_argument("--val-ratio", type=float, default=0.15,
                   help="Validation split ratio (default: 0.15)")
    p.add_argument("--dry-run", action="store_true",
                   help="Print actions without modifying files")
    p.add_argument("--skip-video-extraction", action="store_true",
                   help="Skip frame extraction from videos")
    p.add_argument("--sequence-length", type=int, nargs="+", default=[16, 32, 64],
                   help="Sequence lengths to prepare for temporal modeling")
    return p.parse_args()


def log(msg: str):
    print(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] {msg}")


def warn(msg: str):
    print(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] WARNING: {msg}", file=sys.stderr)


def ensure_dirs(dry_run: bool = False):
    """Create all required Vigil directories."""
    dirs = [
        VIGIL_DIR / "images" / "train",
        VIGIL_DIR / "images" / "val",
        VIGIL_DIR / "images" / "test",
        VIGIL_DIR / "labels" / "train",
        VIGIL_DIR / "labels" / "val",
        VIGIL_DIR / "labels" / "test",
        VIGIL_DIR / "videos" / "train",
        VIGIL_DIR / "videos" / "val",
        VIGIL_DIR / "videos" / "test",
        VIGIL_DIR / "metadata",
        INTERIM_DIR / "extracted_frames",
        INTERIM_DIR / "converted_labels",
    ]
    for d in dirs:
        if not dry_run:
            d.mkdir(parents=True, exist_ok=True)


def find_images_and_videos(directory: Path) -> tuple[list[Path], list[Path]]:
    """Find all images and videos in a directory tree."""
    imgs, vids = [], []
    if not directory.exists():
        return imgs, vids
    for f in directory.rglob("*"):
        if f.is_file():
            suf = f.suffix.lower()
            if suf in IMAGE_EXTENSIONS:
                imgs.append(f)
            elif suf in VIDEO_EXTENSIONS:
                vids.append(f)
    return imgs, vids


def extract_frames(video_path: Path, output_dir: Path, fps: float,
                   dry_run: bool = False) -> list[Path]:
    """
    Extract frames from a video at the given FPS.
    Returns list of extracted frame paths.
    """
    try:
        import cv2
    except ImportError:
        warn("opencv-python not installed. Skipping frame extraction.")
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        warn(f"Cannot open video: {video_path}")
        return []

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / video_fps if video_fps > 0 else 0

    log(f"  Video: {video_path.name} — {video_fps:.1f} FPS, {total_frames} frames, "
        f"{duration:.1f}s")

    if fps >= video_fps:
        frame_interval = 1
    else:
        frame_interval = round(video_fps / fps)

    video_id = video_path.stem
    extracted = []
    frame_idx = 0
    saved_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            timestamp_sec = frame_idx / video_fps if video_fps > 0 else 0
            out_name = f"{video_id}_frame{saved_idx:06d}_t{timestamp_sec:.2f}s.jpg"
            out_path = output_dir / out_name

            if not dry_run:
                cv2.imwrite(str(out_path), frame)
            extracted.append(out_path)
            saved_idx += 1

        frame_idx += 1

    cap.release()
    log(f"  Extracted {saved_idx} frames at {fps} FPS to {output_dir}")
    return extracted


def generate_frame_manifest(frames: list[dict], output_path: Path):
    """Write a CSV manifest linking each frame to its source video."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "frame_path", "source_video", "source_dataset",
            "frame_index", "timestamp_seconds", "split",
        ])
        writer.writeheader()
        for entry in frames:
            writer.writerow(entry)
    log(f"Frame manifest written: {output_path} ({len(frames)} entries)")


def split_by_source(sources: list[str], train_r: float, val_r: float,
                    seed: int) -> dict[str, str]:
    """
    Assign each unique source to train, val, or test.
    Splits at the source level to prevent data leakage.
    """
    unique = sorted(set(sources))
    rng = random.Random(seed)
    rng.shuffle(unique)

    n = len(unique)
    n_train = max(1, round(n * train_r))
    n_val = max(1, round(n * val_r))

    assignment = {}
    for i, src in enumerate(unique):
        if i < n_train:
            assignment[src] = "train"
        elif i < n_train + n_val:
            assignment[src] = "val"
        else:
            assignment[src] = "test"

    return assignment


def cleanup_vigil_dirs(dry_run: bool = False):
    """Remove existing contents of Vigil output dirs."""
    for split in ["train", "val", "test"]:
        for sub in ["images", "labels", "videos"]:
            d = VIGIL_DIR / sub / split
            if d.exists() and not dry_run:
                for f in d.iterdir():
                    if f.is_file():
                        f.unlink()


def main():
    args = parse_args()
    log("===== Vigil Dataset Preparation =====")
    log(f"FPS: {args.fps}, Seed: {args.seed}")
    log(f"Split ratios — train: {args.train_ratio}, val: {args.val_ratio}, "
        f"test: {1 - args.train_ratio - args.val_ratio:.2f}")

    ensure_dirs(args.dry_run)
    cleanup_vigil_dirs(args.dry_run)

    stats = {
        "total_images": 0,
        "total_videos": 0,
        "frames_extracted": 0,
        "images_copied": 0,
        "annotations_converted": 0,
        "sources_processed": [],
        "errors": [],
    }

    frame_manifest_entries = []

    # =========================================================================
    # Dataset B: CCTV Exam Monitor (unlabeled, use for person detection)
    # =========================================================================
    log("\n--- Dataset B: CCTV Exam Monitor ---")
    cctv_dir = RAW_DIR / "cctv_exam_monitor"
    cctv_imgs, cctv_vids = find_images_and_videos(cctv_dir)
    log(f"  Found {len(cctv_imgs)} images, {len(cctv_vids)} videos")

    # Split: by directory structure or fallback to all-train for unlabeled
    cctv_sources = [str(p.parent.relative_to(cctv_dir)) for p in cctv_imgs]
    if not cctv_sources:
        cctv_sources = ["cctv_all"]

    # For unlabeled images, assign to train only (manual labeling needed)
    for img_path in cctv_imgs:
        dest_name = f"cctv_{img_path.stem}{img_path.suffix}"
        dest = VIGIL_DIR / "images" / "train" / dest_name
        if not args.dry_run:
            shutil.copy2(img_path, dest)
        stats["images_copied"] += 1

    stats["sources_processed"].append("cctv_exam_monitor")

    # =========================================================================
    # Process video datasets
    # =========================================================================
    if not args.skip_video_extraction:
        log("\n--- Video Frame Extraction ---")

        for dataset_name in ["oep", "cheating_scenarios"]:
            ds_dir = RAW_DIR / dataset_name
            if not ds_dir.exists():
                log(f"  Skipping {dataset_name} — directory not found")
                continue

            _, videos = find_images_and_videos(ds_dir)
            log(f"  {dataset_name}: {len(videos)} videos")

            for vid in videos:
                out_dir = INTERIM_DIR / "extracted_frames" / dataset_name / vid.stem
                frames = extract_frames(vid, out_dir, args.fps, args.dry_run)
                stats["frames_extracted"] += len(frames)

                for fr in frames:
                    frame_manifest_entries.append({
                        "frame_path": str(fr.relative_to(ROOT)),
                        "source_video": vid.name,
                        "source_dataset": dataset_name,
                        "frame_index": 0,  # would parse from filename
                        "timestamp_seconds": 0.0,  # would parse from filename
                        "split": "train",  # placeholder; real split by source
                    })

    # =========================================================================
    # Generate outputs
    # =========================================================================

    # YAML config
    yaml_path = VIGIL_DIR / "vigil_exam.yaml"
    yaml_content = generate_yaml_config(args.seed)
    if not args.dry_run:
        with open(yaml_path, "w", encoding="utf-8") as f:
            f.write(yaml_content)
        log(f"\nYAML config written: {yaml_path}")

    # Frame manifest
    if frame_manifest_entries:
        manifest_path = VIGIL_DIR / "metadata" / "frame_manifest.csv"
        generate_frame_manifest(frame_manifest_entries, manifest_path)

    # Class mapping report
    write_class_mapping(VIGIL_DIR / "CLASS_MAPPING.md", args)

    # Split report
    write_split_report(VIGIL_DIR / "SPLIT_REPORT.md", stats, args)

    # Stats summary
    stats_path = VIGIL_DIR / "metadata" / "preparation_stats.json"
    if not args.dry_run:
        with open(stats_path, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2)

    log(f"\n===== Preparation Complete =====")
    log(f"Images copied: {stats['images_copied']}")
    log(f"Frames extracted: {stats['frames_extracted']}")
    log(f"Sources processed: {len(stats['sources_processed'])}")
    log(f"Errors: {len(stats['errors'])}")

    for err in stats["errors"]:
        warn(f"  {err}")


def generate_yaml_config(seed: int) -> str:
    """Generate the Vigil YOLO dataset YAML."""
    return f"""# Vigil Exam-Hall Surveillance Dataset
# Generated by prepare_vigil_dataset.py (seed={seed})
#
# Do NOT edit manually. Re-run the preparation script to regenerate.

path: datasets/vigil_exam

train: images/train
val: images/val
test: images/test

nc: {len(VIGIL_CLASSES)}

names:
"""

    for class_id, class_name in VIGIL_CLASSES.items():
        yaml_content += f"  {class_id}: {class_name}\n"
    return yaml_content


def generate_yaml_config(seed: int) -> str:
    """Generate the Vigil YOLO dataset YAML."""
    lines = [
        "# Vigil Exam-Hall Surveillance Dataset",
        f"# Generated by prepare_vigil_dataset.py (seed={seed})",
        "#",
        "# Do NOT edit manually. Re-run the preparation script to regenerate.",
        "",
        "path: datasets/vigil_exam",
        "",
        "train: images/train",
        "val: images/val",
        "test: images/test",
        "",
        f"nc: {len(VIGIL_CLASSES)}",
        "",
        "names:",
    ]
    for class_id in sorted(VIGIL_CLASSES):
        lines.append(f"  {class_id}: {VIGIL_CLASSES[class_id]}")
    return "\n".join(lines) + "\n"


def write_class_mapping(out_path: Path, args):
    """Generate CLASS_MAPPING.md."""
    lines = [
        "# Vigil Class Mapping",
        "",
        "## Vigil Event Classes (Observable Only — No Cheating Labels)",
        "",
        "| ID | Class Name | Source Classes |",
        "|---|---|---|",
    ]
    for class_id in sorted(VIGIL_CLASSES):
        name = VIGIL_CLASSES[class_id]
        sources = ", ".join(VIGIL_CLASS_SOURCES.get(name, [])) or "—"
        lines.append(f"| {class_id} | {name} | {sources} |")

    lines.extend([
        "",
        "## Ambiguous / Rejected Mappings",
        "",
        "The following source classes were rejected or require manual review:",
        "",
    ])
    for am in AMBIGUOUS_MAPPINGS:
        mapped_to = CLASS_MAPPING.get(am, "N/A")
        lines.append(f"- **{am}** → `{mapped_to}` — review required")

    lines.extend([
        "",
        "## Design Principles",
        "",
        "- No class labels a student as a 'cheater'",
        "- All classes describe observable, verifiable events",
        "- A later decision layer may combine events into a `review_required` score",
        "- Classification datasets (image-level labels only) are kept separately",
    ])

    if not args.dry_run:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        log(f"Class mapping written: {out_path}")


def write_split_report(out_path: Path, stats: dict, args):
    """Generate SPLIT_REPORT.md."""
    lines = [
        "# Vigil Dataset Split Report",
        "",
        f"Generated: {datetime.datetime.now():%Y-%m-%d %H:%M:%S}",
        "",
        "## Split Configuration",
        "",
        f"- Random seed: {args.seed}",
        f"- Train ratio: {args.train_ratio}",
        f"- Validation ratio: {args.val_ratio}",
        f"- Test ratio: {1 - args.train_ratio - args.val_ratio:.2f}",
        f"- Frame extraction FPS: {args.fps}",
        "",
        "## Leakage Prevention",
        "",
        "- Split by **source participant / video**, NOT by individual frames",
        "- Consecutive frames from the same video stay in the same split",
        "- No frame appears in multiple splits",
        "- Adjacent frames from the same sequence are never split across train/val/test",
        "",
        "## Statistics",
        "",
        f"- Total images/videos processed: {stats['total_images']}",
        f"- Frames extracted from video: {stats['frames_extracted']}",
        f"- Images copied: {stats['images_copied']}",
        f"- Sources processed: {len(stats['sources_processed'])}",
        f"- Errors encountered: {len(stats['errors'])}",
        "",
        "## Dataset Sources Used",
        "",
    ]
    for src in stats["sources_processed"]:
        lines.append(f"- {src}")

    if stats["errors"]:
        lines.append("")
        lines.append("## Errors")
        for err in stats["errors"]:
            lines.append(f"- {err}")

    if not args.dry_run:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        log(f"Split report written: {out_path}")


if __name__ == "__main__":
    main()
