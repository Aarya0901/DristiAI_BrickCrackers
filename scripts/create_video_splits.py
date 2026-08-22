#!/usr/bin/env python3
"""
create_video_splits.py — Create train/val/test splits for video data.

Ensures no data leakage by splitting at the source video level, not
at the individual frame level. Maintains consecutive frame sequences
for temporal modeling.

Usage:
  python scripts/create_video_splits.py
  python scripts/create_video_splits.py --help
  python scripts/create_video_splits.py --fps 2 --seed 42
  python scripts/create_video_splits.py --dry-run
  python scripts/create_video_splits.py --sequence-length 16 32 64
"""

import argparse
import csv
import datetime
import json
import os
import random
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
VIGIL_DIR = DATASETS_DIR / "vigil_exam"
RAW_DIR = DATASETS_DIR / "raw"
INTERIM_DIR = DATASETS_DIR / "interim"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}


def parse_args():
    p = argparse.ArgumentParser(
        description="Create train/val/test splits for Vigil video data"
    )
    p.add_argument("--fps", type=float, default=2.0,
                   help="FPS for frame extraction (default: 2)")
    p.add_argument("--seed", type=int, default=42,
                   help="Random seed (default: 42)")
    p.add_argument("--train-ratio", type=float, default=0.70)
    p.add_argument("--val-ratio", type=float, default=0.15)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--sequence-length", type=int, nargs="+", default=[16, 32, 64],
                   help="Temporal sequence lengths (default: 16 32 64)")
    p.add_argument("--output", default=None,
                   help="Write JSON report to this path")
    return p.parse_args()


def log(msg: str):
    print(f"[VIDEO SPLIT] {msg}")


def warn(msg: str):
    print(f"[VIDEO SPLIT] WARNING: {msg}", file=sys.stderr)


def find_videos(directory: Path) -> list[Path]:
    """Find all video files in a directory tree."""
    videos = []
    if not directory.exists():
        return videos
    for ext in VIDEO_EXTENSIONS:
        videos.extend(directory.rglob(f"*{ext}"))
        videos.extend(directory.rglob(f"*{ext.upper()}"))
    return sorted(videos)


def extract_frames(video_path: Path, output_dir: Path, fps: float,
                   dry_run: bool = False) -> list[dict]:
    """Extract frames from a video and return frame metadata."""
    try:
        import cv2
    except ImportError:
        warn("opencv-python not installed.")
        return []

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        warn(f"Cannot open: {video_path}")
        return []

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    interval = max(1, round(video_fps / fps)) if fps < video_fps else 1

    output_dir.mkdir(parents=True, exist_ok=True)
    video_id = video_path.stem
    frames = []
    idx = 0
    saved = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if idx % interval == 0:
            ts = idx / video_fps if video_fps > 0 else 0
            out_name = f"{video_id}_f{saved:06d}_t{ts:.2f}s.jpg"
            out_path = output_dir / out_name

            if not dry_run:
                cv2.imwrite(str(out_path), frame)

            frames.append({
                "path": out_path,
                "video": video_path.name,
                "video_id": video_id,
                "frame_index": idx,
                "timestamp": round(ts, 3),
                "sequence_index": saved,
            })
            saved += 1

        idx += 1

    cap.release()
    log(f"  {video_path.name}: {saved} frames at {fps} FPS")
    return frames


def create_sequences(frames: list[dict], seq_length: int) -> list[list[dict]]:
    """Group consecutive frames into non-overlapping sequences."""
    sequences = []
    for i in range(0, len(frames) - seq_length + 1, seq_length // 2):  # 50% overlap
        sequences.append(frames[i:i + seq_length])
    return sequences


def generate_split_metadata(video_splits: dict, frames_by_split: dict,
                            sequences_by_split: dict, args) -> dict:
    """Generate detailed split metadata."""
    report = {
        "generated": datetime.datetime.now().isoformat(),
        "seed": args.seed,
        "train_ratio": args.train_ratio,
        "val_ratio": args.val_ratio,
        "test_ratio": round(1 - args.train_ratio - args.val_ratio, 3),
        "fps": args.fps,
        "video_splits": {},
        "summary": {},
    }

    for split in ["train", "val", "test"]:
        videos = video_splits.get(split, [])
        frames = frames_by_split.get(split, [])
        seqs = sequences_by_split.get(split, {})

        report["video_splits"][split] = {
            "videos": list(videos),
            "video_count": len(videos),
            "frame_count": len(frames),
            "sequences": {str(k): len(v) for k, v in seqs.items()},
        }

    total_vids = sum(len(v) for v in video_splits.values())
    total_frames = sum(len(f) for f in frames_by_split.values())
    report["summary"] = {
        "total_videos": total_vids,
        "total_frames": total_frames,
        "split_video_counts": {s: len(v) for s, v in video_splits.items()},
        "split_frame_counts": {s: len(f) for s, f in frames_by_split.items()},
    }

    return report


def main():
    args = parse_args()
    log("===== Vigil Video Splits =====")
    log(f"Seed: {args.seed}, FPS: {args.fps}")
    log(f"Ratios — train: {args.train_ratio}, val: {args.val_ratio}")

    rng = random.Random(args.seed)

    # Collect all videos from raw datasets
    all_videos = []
    for ds_name in ["oep", "cheating_scenarios", "cctv_exam_monitor"]:
        ds_dir = RAW_DIR / ds_name
        vids = find_videos(ds_dir)
        for v in vids:
            all_videos.append((v, ds_name))
        log(f"  {ds_name}: {len(vids)} videos")

    log(f"Total videos found: {len(all_videos)}")

    # Shuffle at video level
    rng.shuffle(all_videos)

    # Assign splits
    n = len(all_videos)
    if n == 0:
        warn("No videos found. Nothing to split.")
        return

    n_train = max(1, round(n * args.train_ratio))
    n_val = max(1, round(n * args.val_ratio))

    video_splits = {"train": [], "val": [], "test": []}
    for i, (vid_path, ds_name) in enumerate(all_videos):
        vid_id = f"{ds_name}/{vid_path.stem}"
        if i < n_train:
            video_splits["train"].append(vid_id)
        elif i < n_train + n_val:
            video_splits["val"].append(vid_id)
        else:
            video_splits["test"].append(vid_id)

    log(f"\nVideo split counts:")
    for split, vids in video_splits.items():
        log(f"  {split}: {len(vids)} videos")

    # Extract frames and organize by split
    frames_by_split: dict[str, list] = {s: [] for s in video_splits}
    sequences_by_split: dict[str, dict] = {s: {} for s in video_splits}

    for split, vid_ids in video_splits.items():
        for vid_id in vid_ids:
            ds_name, vid_stem = vid_id.split("/", 1)
            vid_path = RAW_DIR / ds_name / f"{vid_stem}.mp4"

            # Try to find the actual video file
            if not vid_path.exists():
                candidates = list((RAW_DIR / ds_name).rglob(f"{vid_stem}.*"))
                if candidates:
                    vid_path = candidates[0]
                else:
                    warn(f"Video not found: {vid_id}")
                    continue

            out_dir = INTERIM_DIR / "extracted_frames" / split / vid_stem
            frames = extract_frames(vid_path, out_dir, args.fps, args.dry_run)
            frames_by_split[split].extend(frames)

            # Create sequences
            for seq_len in args.sequence_length:
                seq_list = create_sequences(frames, seq_len)
                if seq_list:
                    sequences_by_split[split].setdefault(seq_len, []).extend(seq_list)

    # Print sequence counts
    for split in ["train", "val", "test"]:
        for seq_len, seqs in sequences_by_split[split].items():
            log(f"  {split} - {seq_len}-frame sequences: {len(seqs)}")

    # Generate report
    report = generate_split_metadata(video_splits, frames_by_split,
                                     sequences_by_split, args)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        log(f"\nReport written to {out_path}")

    # Write frame manifest
    manifest_path = VIGIL_DIR / "metadata" / "frame_manifest.csv"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "frame_path", "source_video", "source_dataset",
            "frame_index", "timestamp_seconds", "split", "sequence_index",
        ])
        writer.writeheader()
        for split, frames in frames_by_split.items():
            for fr in frames:
                writer.writerow({
                    "frame_path": str(fr["path"].relative_to(ROOT)),
                    "source_video": fr["video"],
                    "source_dataset": fr["video"].split("_")[0] if "_" in fr["video"] else "",
                    "frame_index": fr["frame_index"],
                    "timestamp_seconds": fr["timestamp"],
                    "split": split,
                    "sequence_index": fr.get("sequence_index", 0),
                })

    log(f"\nFrame manifest: {manifest_path}")
    log("===== Video Splits Complete =====")


if __name__ == "__main__":
    main()
