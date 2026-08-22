#!/usr/bin/env python3
"""
build_vigil_dataset.py — Build the Vigil YOLO dataset from SCB raw data.

Fixes the audit findings:
  - 6 classes only (5 with real SCB data + person from pretrained weights).
    The previous 13-class YAML had 9 ghost classes with zero instances.
  - Groups frames by numeric prefix (session proxy) before splitting, so
    frames from the same recording session stay in one split. The previous
    merge blindly trusted SCB's internal train/val folders, which overlap.
  - Produces a labeled TEST set (previous version had 0 test labels).
  - Splits 70/15/15 at the session-group level.

Deterministic: fixed seed produces identical output.

Usage:
  python scripts/build_vigil_dataset.py
  python scripts/build_vigil_dataset.py --dry-run
  python scripts/build_vigil_dataset.py --seed 123
"""

import argparse
import json
import random
import shutil
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "datasets" / "raw" / "scb_dataset"
VIGIL = ROOT / "datasets" / "vigil_exam"

# ---------------------------------------------------------------------------
# Final Vigil taxonomy: ONLY classes the model can actually learn.
# class 0 (person) comes from COCO-pretrained YOLO11-s weights; SCB provides
# no person labels, and we state that honestly rather than pretend otherwise.
# ---------------------------------------------------------------------------
VIGIL_CLASSES = {
    0: "person",                # pretrained COCO only; 0 instances from SCB
    1: "looking_left",          # SCB BowTurnHead turn_head
    2: "leaning_forward",       # SCB BowTurnHead bow_head
    3: "talking",               # SCB5 Discuss
    4: "hand_signal",           # SCB5 hand_raise
    5: "normal_exam_activity",  # SCB5 read/write
}

# Old 13-class IDs currently in the merged labels -> new 6-class IDs
OLD_TO_NEW = {2: 1, 7: 2, 9: 3, 10: 4, 12: 5}
NAME_TO_ID = {v: k for k, v in VIGIL_CLASSES.items()}


def log(msg):
    print(f"[BUILD] {msg}")


def session_key_from_stem(stem: str) -> str:
    """
    Derive a session key from a merged filename like
    'scb_SCB5_Handrise_Read_Write_0009047'. SCB filenames are sequential
    frame numbers, so drop the last 3 digits of the numeric part: frames
    from the same contiguous recording window land in one split.
    """
    parts = stem.rsplit("_", 1)
    digits = parts[-1] if len(parts) == 2 else stem
    src = stem[: stem.rfind("_")] if "_" in stem else stem
    return f"{src}/{digits[:-3] if len(digits) > 3 else digits}"


def collect_samples():
    """Collect merged scb_* images + labels already in vigil_exam."""
    samples = []
    for split in ("train", "val", "test"):
        img_dir = VIGIL / "images" / split
        lbl_dir = VIGIL / "labels" / split
        if not img_dir.exists():
            continue
        for img in img_dir.glob("scb_*.jpg"):
            lbl = lbl_dir / f"{img.stem}.txt"
            if not lbl.exists():
                continue
            samples.append({
                "img": img,
                "lbl": lbl,
                "stem": img.stem,
                "session_key": session_key_from_stem(img.stem),
                "old_split": split,
            })
    return samples


def split_sessions(samples, seed):
    """Group samples by session_key, shuffle groups, assign 70/15/15."""
    groups = defaultdict(list)
    for s in samples:
        groups[s["session_key"]].append(s)

    keys = sorted(groups.keys())
    rng = random.Random(seed)
    rng.shuffle(keys)

    n = len(keys)
    n_train = int(round(n * 0.70))
    n_val = int(round(n * 0.15))

    assignment = {}
    for i, k in enumerate(keys):
        assignment[k] = "train" if i < n_train else ("val" if i < n_train + n_val else "test")
    return assignment, groups


def main():
    ap = argparse.ArgumentParser(description="Build Vigil dataset from SCB")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    log(f"seed={args.seed}, dry_run={args.dry_run}")

    samples = collect_samples()
    log(f"Collected {len(samples)} merged SCB samples")

    assignment, groups = split_sessions(samples, args.seed)
    counts = Counter()
    class_hist = Counter()
    moved_in, moved_out = Counter(), Counter()

    for key, group in groups.items():
        split = assignment[key]
        for s in group:
            # Remap old 13-class IDs to new 6-class IDs
            new_lines = []
            with open(s["lbl"]) as f:
                for line in f:
                    if not line.strip():
                        continue
                    parts = line.split()
                    old_id = int(parts[0])
                    if old_id not in OLD_TO_NEW:
                        continue
                    new_id = OLD_TO_NEW[old_id]
                    new_lines.append(
                        f"{new_id} {parts[1]} {parts[2]} {parts[3]} {parts[4]}")
                    class_hist[new_id] += 1
            if not new_lines:
                continue

            if not args.dry_run:
                # Write remapped label into the new split
                new_lbl = VIGIL / "labels" / split / f"{s['stem']}.txt"
                new_img = VIGIL / "images" / split / f"{s['stem']}.jpg"
                with open(new_lbl, "w") as f:
                    f.write("\n".join(new_lines) + "\n")
                # Move image if it changed splits
                if s["old_split"] != split:
                    shutil.move(str(s["img"]), str(new_img))
                    moved_out[s["old_split"]] += 1
                    moved_in[split] += 1
                # Remove stale label from old split if it moved
                if s["old_split"] != split and s["lbl"].exists():
                    s["lbl"].unlink()
            counts[split] += 1

    log("Split sizes: " + ", ".join(f"{k}={counts[k]}" for k in ("train", "val", "test")))
    if not args.dry_run:
        log(f"Images moved: " + ", ".join(f"{k}: -{moved_out[k]}/+{moved_in[k]}" for k in ("train", "val", "test")))
    log("Class histogram (all splits combined):")
    for cid in sorted(VIGIL_CLASSES):
        log(f"  {cid} {VIGIL_CLASSES[cid]}: {class_hist.get(cid, 0)}")

    # Write YAML with exactly 6 classes
    yaml_path = VIGIL / "vigil_exam.yaml"
    if not args.dry_run:
        lines = [
            "# Vigil Exam-Hall Behavior Dataset",
            "# 6 classes: 5 learned from SCB + person from pretrained COCO weights.",
            "# Ghost classes from the old 13-class YAML removed (0 instances).",
            "path: datasets/vigil_exam",
            "train: images/train",
            "val: images/val",
            "test: images/test",
            "nc: 6",
            "names:",
        ]
        for cid in sorted(VIGIL_CLASSES):
            lines.append(f"  {cid}: {VIGIL_CLASSES[cid]}")
        yaml_path.write_text("\n".join(lines) + "\n")
        log(f"YAML written: {yaml_path} (nc=6)")

        meta = {
            "seed": args.seed,
            "splits": dict(counts),
            "class_histogram": {VIGIL_CLASSES[k]: v for k, v in class_hist.items()},
            "session_groups": len(groups),
            "note": "Session-grouped split; frames from same session stay together.",
        }
        (VIGIL / "metadata" / "build_stats.json").write_text(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
