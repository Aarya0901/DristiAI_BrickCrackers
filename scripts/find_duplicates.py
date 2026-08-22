#!/usr/bin/env python3
"""
find_duplicates.py — Detect exact and near-duplicate images in the Vigil dataset.

Computes cryptographic hashes (SHA-256) for exact duplicate detection and
perceptual hashes for near-duplicate detection.

Detects:
  - Exact byte-for-byte duplicates
  - Resized duplicates (via perceptual hash)
  - Near-duplicate consecutive video frames (low perceptual hash distance)
  - Samples appearing in multiple public datasets

Usage:
  python scripts/find_duplicates.py
  python scripts/find_duplicates.py --help
  python scripts/find_duplicates.py --hash-threshold 5
  python scripts/find_duplicates.py --dirs datasets/raw/cctv_exam_monitor datasets/raw/oep
  python scripts/find_duplicates.py --dry-run
  python scripts/find_duplicates.py --move-duplicates  # move to duplicate_review
"""

import argparse
import csv
import hashlib
import json
import os
import shutil
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
DUPLICATE_REVIEW_DIR = DATASETS_DIR / "interim" / "duplicate_review"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}


def parse_args():
    p = argparse.ArgumentParser(
        description="Find duplicate images in the Vigil dataset"
    )
    p.add_argument("--dirs", nargs="+", default=None,
                   help="Directories to scan (default: all raw & vigil_exam)")
    p.add_argument("--hash-threshold", type=int, default=5,
                   help="Maximum Hamming distance for perceptual near-duplicate (default: 5)")
    p.add_argument("--dry-run", action="store_true",
                   help="Print duplicates without moving files")
    p.add_argument("--move-duplicates", action="store_true",
                   help="Move detected duplicates to duplicate_review/")
    p.add_argument("--output", default=None,
                   help="Write CSV report to this path")
    return p.parse_args()


def log(msg: str):
    print(f"[DUPLICATE CHECK] {msg}")


def sha256_file(filepath: Path) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
    except (OSError, PermissionError) as e:
        log(f"  Cannot hash {filepath}: {e}")
        return ""
    return h.hexdigest()


def compute_perceptual_hash(filepath: Path) -> str | None:
    """
    Compute perceptual hash (average hash) of an image.
    Requires Pillow.
    Returns hex string or None on failure.
    """
    try:
        from PIL import Image
    except ImportError:
        log("Pillow not installed. Skipping perceptual hashing.")
        return None

    try:
        img = Image.open(filepath).convert("L").resize((8, 8), Image.LANCZOS)
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        bits = "".join("1" if p > avg else "0" for p in pixels)
        return hex(int(bits, 2))[2:].zfill(16)
    except Exception as e:
        log(f"  Cannot perceptual-hash {filepath}: {e}")
        return None


def hamming_distance(h1: str, h2: str) -> int:
    """Compute Hamming distance between two hex perceptual hashes."""
    b1 = bin(int(h1, 16))[2:].zfill(64)
    b2 = bin(int(h2, 16))[2:].zfill(64)
    return sum(c1 != c2 for c1, c2 in zip(b1, b2))


def find_all_images(directories: list[Path]) -> list[Path]:
    """Recursively find all image files in given directories."""
    images = []
    for d in directories:
        if not d.exists():
            log(f"  Directory not found: {d}")
            continue
        for ext in IMAGE_EXTENSIONS:
            images.extend(d.rglob(f"*{ext}"))
            images.extend(d.rglob(f"*{ext.upper()}"))
    return sorted(set(images))


def main():
    args = parse_args()

    if args.dirs:
        scan_dirs = [Path(d) for d in args.dirs]
    else:
        scan_dirs = []
        if (DATASETS_DIR / "raw").exists():
            scan_dirs.append(DATASETS_DIR / "raw")
        if (DATASETS_DIR / "vigil_exam" / "images").exists():
            scan_dirs.append(DATASETS_DIR / "vigil_exam" / "images")

    log(f"Scanning {len(scan_dirs)} directories for images...")
    images = find_all_images(scan_dirs)
    log(f"Found {len(images)} total images")

    # =========================================================================
    # Exact duplicates (cryptographic hash)
    # =========================================================================
    log("\n--- Exact Duplicate Detection (SHA-256) ---")
    hash_map = defaultdict(list)
    for i, img in enumerate(images):
        if (i + 1) % 500 == 0:
            log(f"  Hashing: {i+1}/{len(images)}")
        h = sha256_file(img)
        if h:
            hash_map[h].append(img)

    exact_dupes = {h: paths for h, paths in hash_map.items() if len(paths) > 1}
    exact_dupe_count = sum(len(v) - 1 for v in exact_dupes.values())
    log(f"Exact duplicates found: {exact_dupe_count} files ({len(exact_dupes)} unique hash groups)")

    for h, paths in list(exact_dupes.items())[:10]:
        log(f"  Hash {h[:16]}... — {len(paths)} copies:")
        for p in paths:
            log(f"    {p}")

    if len(exact_dupes) > 10:
        log(f"  ... and {len(exact_dupes) - 10} more groups")

    # =========================================================================
    # Near-duplicates (perceptual hash)
    # =========================================================================
    log("\n--- Near-Duplicate Detection (Perceptual Hash) ---")
    phash_map = {}
    for img in images:
        ph = compute_perceptual_hash(img)
        if ph:
            phash_map[img] = ph

    near_dupes = []
    phashes = list(phash_map.items())

    if len(phashes) > 1:
        # Only compare images from different source directories to find cross-dataset dupes
        log(f"  Computing pairwise perceptual distances for {len(phashes)} images...")
        for i in range(len(phashes)):
            for j in range(i + 1, len(phashes)):
                dist = hamming_distance(phashes[i][1], phashes[j][1])
                if dist <= args.hash_threshold:
                    near_dupes.append((phashes[i][0], phashes[j][0], dist))

    log(f"Near-duplicates found (distance <= {args.hash_threshold}): {len(near_dupes)}")
    for a, b, dist in near_dupes[:20]:
        log(f"  Distance {dist}: {a.name} ↔ {b.name}")

    # =========================================================================
    # Move to review
    # =========================================================================
    if args.move_duplicates and not args.dry_run:
        DUPLICATE_REVIEW_DIR.mkdir(parents=True, exist_ok=True)
        moved = 0

        for h, paths in exact_dupes.items():
            group_dir = DUPLICATE_REVIEW_DIR / f"exact_{h[:12]}"
            group_dir.mkdir(exist_ok=True)
            # Keep first copy in-place, move rest
            for p in paths[1:]:
                dest = group_dir / f"{p.parent.name}_{p.name}"
                shutil.move(str(p), str(dest))
                moved += 1

        for i, (a, b, dist) in enumerate(near_dupes):
            group_dir = DUPLICATE_REVIEW_DIR / f"near_{i:04d}_d{dist}"
            group_dir.mkdir(exist_ok=True)
            # Move both copies for review
            for p in [a, b]:
                if p.exists():
                    dest = group_dir / f"{p.parent.name}_{p.name}"
                    shutil.move(str(p), str(dest))
            moved += 2

        log(f"Moved {moved} files to {DUPLICATE_REVIEW_DIR}")

    # =========================================================================
    # CSV Report
    # =========================================================================
    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["type", "group_id", "file", "source_dataset", "notes"])

            for h, paths in exact_dupes.items():
                for p in paths:
                    rel = p.relative_to(ROOT) if ROOT in p.parents else p
                    writer.writerow(["exact", h[:16], str(rel),
                                     p.parent.name, f"{len(paths)} copies"])

            for i, (a, b, dist) in enumerate(near_dupes):
                for p in [a, b]:
                    rel = p.relative_to(ROOT) if ROOT in p.parents else p
                    writer.writerow(["near", f"group_{i:04d}", str(rel),
                                     p.parent.name, f"distance={dist}"])

        log(f"Duplicate report written to {out_path}")

    # Summary
    log(f"\n===== Duplicate Detection Summary =====")
    log(f"Total images scanned: {len(images)}")
    log(f"Exact duplicate groups: {len(exact_dupes)}")
    log(f"Near-duplicate pairs: {len(near_dupes)}")
    log(f"Total redundant files: "
        f"{sum(len(v)-1 for v in exact_dupes.values()) + len(near_dupes) * 2}")


if __name__ == "__main__":
    main()
