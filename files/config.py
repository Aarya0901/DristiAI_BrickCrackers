"""
config.py
=========
Single source of truth for every path, threshold, and taxonomy mapping used
across Phase 0-4. Nothing in the other scripts hardcodes a path — they all
pull from a `VigilConfig` instance, which can be built from defaults, a YAML
file, or CLI overrides (CLI > YAML > defaults).

Usage in a phase script:

    from config import VigilConfig, add_common_args
    parser = argparse.ArgumentParser()
    add_common_args(parser)
    args = parser.parse_args()
    cfg = VigilConfig.from_args(args)

Override just the root and everything downstream re-derives:
    python phase1_dataset_label_audit.py --root /path/to/DristiAI_BrickCrackers
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Optional


# --------------------------------------------------------------------------- #
# Final 5-class taxonomy (Phase 4 target). Order defines class_id 0..4 and
# MUST match the order written into the generated data.yaml.
# --------------------------------------------------------------------------- #
FINAL_CLASSES: List[str] = [
    "person",            # 0
    "cheating_posture",  # 1
    "cheating_phone",    # 2
    "edge_cases",        # 3
    "normal",            # 4
]

# Legacy (4-class) -> new taxonomy name remap used in Phase 2.
# Any old class name NOT in this dict is treated as "unmapped" and flagged
# (never silently dropped) by phase2_label_schema_remap.py.
OLD_TO_NEW_CLASS_MAP: Dict[str, str] = {
    "person": "person",
    "looking_left": "cheating_posture",   # glancing toward neighbor — behavioral cheating signal
    "leaning_forward": "cheating_posture",
    "talking": "cheating_posture",        # verbal communication during exam — cheating signal
    "hand_signal": "cheating_posture",
    "normal_exam_activity": "normal",
}

# Phase 3 raw video folders (datasets/new_data/<folder>) -> new taxonomy name.
NEW_DATA_CLASS_DIRS: Dict[str, str] = {
    "cheating_phone": "cheating_phone",
    "cheating_posture": "cheating_posture",
    "edge_cases": "edge_cases",
    "normal_baseline": "normal",
}

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
VIDEO_EXTS = (".mp4", ".mkv", ".avi", ".mov", ".webm")


@dataclass
class VigilConfig:
    # --- project root -------------------------------------------------- #
    root: Path = field(default_factory=lambda: Path.cwd())

    # --- legacy (vigil_exam) dataset ------------------------------------ #
    old_images_dir: Optional[Path] = None   # default: root/datasets/vigil_exam/images
    old_labels_dir: Optional[Path] = None   # default: root/datasets/vigil_exam/labels
    old_yaml_path: Optional[Path] = None    # default: root/datasets/vigil_exam/vigil_exam.yaml

    # --- new raw video data --------------------------------------------- #
    new_data_root: Optional[Path] = None    # default: root/datasets/new_data

    # --- models ----------------------------------------------------------#
    person_detector_ckpt: Optional[Path] = None  # default: root/yolov8n-pose.pt (used only for Phase 3/4
                                                  # auto-labeling — NOT the model being trained.
                                                  # vigil_yolo_4cls_best.pt has a dead person head
                                                  # (confirmed Phase 0); use a working detector here.)
    stock_yolo_ckpt: str = "yolov8n.pt"           # ultralytics auto-downloads if not local

    # --- sanity-check inputs (Phase 0) ----------------------------------#
    sanity_images_dir: Optional[Path] = None  # default: root/backend/data/samples

    # --- staging / output roots ------------------------------------------#
    merged_dataset_dir: Optional[Path] = None  # default: root/datasets/vigil_exam_v2
    reports_dir: Optional[Path] = None         # default: merged_dataset_dir/reports

    # --- taxonomy ----------------------------------------------------------
    final_classes: List[str] = field(default_factory=lambda: list(FINAL_CLASSES))
    old_to_new_class_map: Dict[str, str] = field(default_factory=lambda: dict(OLD_TO_NEW_CLASS_MAP))
    new_data_class_dirs: Dict[str, str] = field(default_factory=lambda: dict(NEW_DATA_CLASS_DIRS))

    # --- Phase 3 extraction params ---------------------------------------
    frame_stride_sec: float = 0.5
    person_conf_thresh: float = 0.35
    max_frames_per_video: int = 400
    dual_annotation: bool = True   # write both `person` box AND behavior box per detection
    dedup_ahash_threshold: Optional[int] = 4  # None disables perceptual-hash dedup

    # --- Phase 4 merge params ---------------------------------------------
    val_split_ratio: float = 0.15
    random_seed: int = 42
    class_balance_beta: float = 0.999  # for effective-number-of-samples weighting

    # ---------------------------------------------------------------------#
    def __post_init__(self):
        self.root = Path(self.root).resolve()
        if self.old_images_dir is None:
            self.old_images_dir = self.root / "datasets" / "vigil_exam" / "images"
        if self.old_labels_dir is None:
            self.old_labels_dir = self.root / "datasets" / "vigil_exam" / "labels"
        if self.old_yaml_path is None:
            self.old_yaml_path = self.root / "datasets" / "vigil_exam" / "vigil_exam.yaml"
        if self.new_data_root is None:
            self.new_data_root = self.root / "datasets" / "new_data"
        if self.person_detector_ckpt is None:
            self.person_detector_ckpt = self.root / "yolov8n-pose.pt"
        if self.sanity_images_dir is None:
            self.sanity_images_dir = self.root / "backend" / "data" / "samples"
        if self.merged_dataset_dir is None:
            self.merged_dataset_dir = self.root / "datasets" / "vigil_exam_v2"
        if self.reports_dir is None:
            self.reports_dir = self.merged_dataset_dir / "reports"

        for attr in (
            "old_images_dir", "old_labels_dir", "old_yaml_path", "new_data_root",
            "person_detector_ckpt", "sanity_images_dir", "merged_dataset_dir", "reports_dir",
        ):
            setattr(self, attr, Path(getattr(self, attr)))

    # Convenience staging paths shared across phases -----------------------
    @property
    def phase2_staging_dir(self) -> Path:
        return self.merged_dataset_dir / "_staging" / "phase2_remapped"

    @property
    def phase3_staging_dir(self) -> Path:
        return self.merged_dataset_dir / "_staging" / "phase3_frames"

    @property
    def phase3_manifest_path(self) -> Path:
        return self.new_data_root / "video_manifest.csv"

    @property
    def phase3_debug_viz_dir(self) -> Path:
        return self.merged_dataset_dir / "_staging" / "phase3_debug_viz"

    # ------------------------------------------------------------------- #
    @classmethod
    def from_yaml(cls, yaml_path: Path) -> "VigilConfig":
        import yaml  # local import: keep pyyaml optional for scripts that don't need it
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return cls(**data)

    @classmethod
    def from_args(cls, args: argparse.Namespace) -> "VigilConfig":
        """
        IMPORTANT: this builds the merged field dict from RAW (possibly
        unset / None) values only — it never starts from an already
        __post_init__-resolved VigilConfig. If it did, a `--root` override
        would arrive too late: the derived defaults (old_images_dir,
        merged_dataset_dir, etc.) would already have been computed against
        the OLD root and would look "explicitly set" to __post_init__,
        silently shadowing the new root for every derived path. Keeping
        unset fields as None here lets __post_init__ derive them fresh
        from whatever root actually won.
        """
        base_fields: dict = {}
        if getattr(args, "config_yaml", None):
            import yaml
            with open(args.config_yaml, "r", encoding="utf-8") as f:
                base_fields = yaml.safe_load(f) or {}

        overrides = {}
        for f in (
            "root", "old_images_dir", "old_labels_dir", "old_yaml_path", "new_data_root",
            "person_detector_ckpt", "stock_yolo_ckpt", "sanity_images_dir",
            "merged_dataset_dir", "reports_dir",
        ):
            val = getattr(args, f, None)
            if val is not None:
                overrides[f] = val
        for f in (
            "frame_stride_sec", "person_conf_thresh", "max_frames_per_video",
            "val_split_ratio", "random_seed", "class_balance_beta",
        ):
            val = getattr(args, f, None)
            if val is not None:
                overrides[f] = val
        if getattr(args, "no_dual_annotation", False):
            overrides["dual_annotation"] = False
        if getattr(args, "no_dedup", False):
            overrides["dedup_ahash_threshold"] = None

        merged = dict(base_fields)
        merged.update(overrides)
        return cls(**{k: v for k, v in merged.items() if k in cls.__dataclass_fields__})

    def to_json(self) -> str:
        def default(o):
            if isinstance(o, Path):
                return str(o)
            return str(o)
        return json.dumps(asdict(self), indent=2, default=default)


def add_common_args(parser: argparse.ArgumentParser) -> None:
    """Attach the standard set of path/threshold override flags to a parser."""
    g = parser.add_argument_group("vigil-config")
    g.add_argument("--config-yaml", type=str, default=None,
                   help="Optional YAML file with VigilConfig field overrides.")
    g.add_argument("--root", type=str, default=None, help="Project root directory.")
    g.add_argument("--old-images-dir", dest="old_images_dir", type=str, default=None)
    g.add_argument("--old-labels-dir", dest="old_labels_dir", type=str, default=None)
    g.add_argument("--old-yaml-path", dest="old_yaml_path", type=str, default=None)
    g.add_argument("--new-data-root", dest="new_data_root", type=str, default=None)
    g.add_argument("--person-detector-ckpt", dest="person_detector_ckpt", type=str, default=None)
    g.add_argument("--stock-yolo-ckpt", dest="stock_yolo_ckpt", type=str, default=None)
    g.add_argument("--sanity-images-dir", dest="sanity_images_dir", type=str, default=None)
    g.add_argument("--merged-dataset-dir", dest="merged_dataset_dir", type=str, default=None)
    g.add_argument("--reports-dir", dest="reports_dir", type=str, default=None)
    g.add_argument("--frame-stride-sec", dest="frame_stride_sec", type=float, default=None)
    g.add_argument("--person-conf-thresh", dest="person_conf_thresh", type=float, default=None)
    g.add_argument("--max-frames-per-video", dest="max_frames_per_video", type=int, default=None)
    g.add_argument("--val-split-ratio", dest="val_split_ratio", type=float, default=None)
    g.add_argument("--random-seed", dest="random_seed", type=int, default=None)
    g.add_argument("--class-balance-beta", dest="class_balance_beta", type=float, default=None)
    g.add_argument("--no-dual-annotation", action="store_true",
                   help="Phase 3: write only the behavior-class box, not an extra person box.")
    g.add_argument("--no-dedup", action="store_true",
                   help="Phase 3: disable perceptual-hash near-duplicate frame skipping.")
