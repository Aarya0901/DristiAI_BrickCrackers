"""
common/yolo_io.py
==================
Shared primitives for reading/writing standard YOLO-format label files
(`<class_id> <x_center> <y_center> <width> <height>`, all normalized to
[0, 1]), plus small defensive helpers (dimension checks, coordinate
clipping, image<->label pairing, perceptual-hash dedup) reused across
Phase 1-4.

Every function here is written to degrade gracefully on bad input: a
malformed label line is logged and skipped, not a crash.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")


@dataclass
class YoloBox:
    class_id: int
    xc: float
    yc: float
    w: float
    h: float

    def as_line(self) -> str:
        return f"{self.class_id} {self.xc:.6f} {self.yc:.6f} {self.w:.6f} {self.h:.6f}"

    def to_xyxy(self) -> Tuple[float, float, float, float]:
        x1 = self.xc - self.w / 2.0
        y1 = self.yc - self.h / 2.0
        x2 = self.xc + self.w / 2.0
        y2 = self.yc + self.h / 2.0
        return x1, y1, x2, y2

    @staticmethod
    def from_xyxy(class_id: int, x1: float, y1: float, x2: float, y2: float) -> "YoloBox":
        xc = (x1 + x2) / 2.0
        yc = (y1 + y2) / 2.0
        w = x2 - x1
        h = y2 - y1
        return YoloBox(class_id=class_id, xc=xc, yc=yc, w=w, h=h)


def clip_box(xc: float, yc: float, w: float, h: float) -> Tuple[float, float, float, float, bool]:
    """
    Clip a normalized xywh box so it fits fully inside [0, 1] x [0, 1].
    Returns (xc, yc, w, h, was_changed).
    """
    x1, y1 = xc - w / 2.0, yc - h / 2.0
    x2, y2 = xc + w / 2.0, yc + h / 2.0

    cx1, cy1 = max(0.0, x1), max(0.0, y1)
    cx2, cy2 = min(1.0, x2), min(1.0, y2)

    changed = (cx1 != x1) or (cy1 != y1) or (cx2 != x2) or (cy2 != y2)

    if cx2 <= cx1 or cy2 <= cy1:
        # Degenerate after clipping (box was fully out of frame).
        return 0.0, 0.0, 0.0, 0.0, True

    new_xc = (cx1 + cx2) / 2.0
    new_yc = (cy1 + cy2) / 2.0
    new_w = cx2 - cx1
    new_h = cy2 - cy1
    return new_xc, new_yc, new_w, new_h, changed


def read_yolo_label(
    label_path: Path,
    logger: Optional[logging.Logger] = None,
    valid_class_ids: Optional[Sequence[int]] = None,
) -> List[YoloBox]:
    """
    Parse a YOLO .txt label file. Malformed lines are logged and skipped
    (never raise), so one bad line can't kill a whole audit/merge run.
    """
    boxes: List[YoloBox] = []
    if not label_path.exists():
        if logger:
            logger.warning("Label file missing: %s", label_path)
        return boxes

    try:
        raw = label_path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as e:
        if logger:
            logger.error("Could not read label file %s: %s", label_path, e)
        return boxes

    for i, line in enumerate(raw.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) != 5:
            if logger:
                logger.warning("%s:%d malformed line (expected 5 fields, got %d): %r",
                                label_path, i, len(parts), line)
            continue
        try:
            class_id = int(float(parts[0]))
            xc, yc, w, h = (float(p) for p in parts[1:])
        except ValueError:
            if logger:
                logger.warning("%s:%d non-numeric field(s): %r", label_path, i, line)
            continue

        if valid_class_ids is not None and class_id not in valid_class_ids:
            if logger:
                logger.warning("%s:%d class_id %d outside expected set %s",
                                label_path, i, class_id, list(valid_class_ids))
            # Still keep it — audits need to *see* out-of-range ids, not silently drop them.

        if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 < w <= 1.0 and 0.0 < h <= 1.0):
            xc_c, yc_c, w_c, h_c, changed = clip_box(xc, yc, w, h)
            if w_c <= 0.0 or h_c <= 0.0:
                if logger:
                    logger.warning("%s:%d box degenerate/out-of-frame after clipping, dropped: %r",
                                    label_path, i, line)
                continue
            if logger:
                logger.warning("%s:%d box out of [0,1] range, clipped: %r -> (%.4f %.4f %.4f %.4f)",
                                label_path, i, line, xc_c, yc_c, w_c, h_c)
            xc, yc, w, h = xc_c, yc_c, w_c, h_c

        boxes.append(YoloBox(class_id, xc, yc, w, h))

    return boxes


def write_yolo_label(label_path: Path, boxes: Iterable[YoloBox]) -> None:
    label_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [b.as_line() for b in boxes]
    label_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def get_image_size(image_path: Path, logger: Optional[logging.Logger] = None) -> Optional[Tuple[int, int]]:
    """Return (width, height) or None if the image can't be opened/is corrupt."""
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError as e:
        raise ImportError("Pillow is required for image dimension checks: pip install pillow") from e

    try:
        with Image.open(image_path) as img:
            img.verify()  # cheap corruption check
        with Image.open(image_path) as img:  # re-open: verify() invalidates the file handle
            return img.size  # (width, height)
    except (UnidentifiedImageError, OSError, ValueError) as e:
        if logger:
            logger.error("Corrupt or unreadable image %s: %s", image_path, e)
        return None


def find_image_for_stem(images_dir: Path, stem: str) -> Optional[Path]:
    for ext in IMAGE_EXTS:
        candidate = images_dir / f"{stem}{ext}"
        if candidate.exists():
            return candidate
    return None


def iter_label_files(labels_dir: Path) -> Iterable[Path]:
    if not labels_dir.exists():
        return []
    return sorted(labels_dir.rglob("*.txt"))


def iou_xyxy(a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
    inter = iw * ih
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


# --------------------------------------------------------------------------- #
# Perceptual hashing for cheap near-duplicate frame detection (Phase 3).
# Pure PIL/stdlib — no extra dependency beyond Pillow, which we already need.
# --------------------------------------------------------------------------- #
def average_hash(image, hash_size: int = 8) -> int:
    """`image` is a PIL.Image (any mode). Returns a hash_size*hash_size-bit int."""
    img = image.convert("L").resize((hash_size, hash_size))
    pixels = list(img.getdata())
    avg = sum(pixels) / len(pixels)
    bits = 0
    for p in pixels:
        bits = (bits << 1) | (1 if p >= avg else 0)
    return bits


def hamming_distance(a: int, b: int) -> int:
    return bin(a ^ b).count("1")
