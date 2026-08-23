"""
scripts/inspect_vigil_dataset.py

Paste each cell into a Kaggle Notebook to visually inspect the VIGIL Exam V2
dataset. It draws bounding boxes, confidence scores, and RTMPose/YOLOv8-pose
skeleton overlays on sampled frames and displays them as an inline grid.

Dataset: https://www.kaggle.com/datasets/aaryashah0901/vigil-exam-v2
Add it via: File → Add Input → Search "vigil-exam-v2"
"""

# ============================================================
# CELL 1 — Install dependencies
# ============================================================
# !pip install ultralytics opencv-python-headless -q


# ============================================================
# CELL 2 — Imports & constants
# ============================================================
import os
import glob
import random
import cv2
import numpy as np
import matplotlib.pyplot as plt
from ultralytics import YOLO

# Path inside Kaggle after adding the dataset as input
DATASET_ROOT = "/kaggle/input/datasets/aaryashah0901/vigil-exam-v2"

# ── COCO-17 skeleton connectivity (pairs of keypoint indices) ──────────────
SKELETON = [
    (0, 1), (0, 2),                  # nose → eyes
    (1, 3), (2, 4),                  # eyes → ears
    (5, 6),                          # shoulder–shoulder
    (5, 7), (7, 9),                  # L arm
    (6, 8), (8, 10),                 # R arm
    (5, 11), (6, 12),                # torso sides
    (11, 12),                        # hip–hip
    (11, 13), (13, 15),              # L leg
    (12, 14), (14, 16),              # R leg
]

KEYPOINT_COLOR  = (0, 255, 128)      # bright green
SKELETON_COLOR  = (255, 200, 0)      # gold
BBOX_COLOR      = (0, 180, 255)      # cyan
CONF_THRESHOLD  = 0.25               # minimum keypoint confidence to draw


# ============================================================
# CELL 3 — Helper: draw skeleton + bboxes on a frame
# ============================================================
def draw_pose(frame: np.ndarray, results) -> np.ndarray:
    """
    Given a YOLOv8-pose result, draw bounding boxes, keypoints and
    skeleton edges onto the frame.  Returns the annotated copy.
    """
    out = frame.copy()
    if not results or results[0].boxes is None:
        return out

    result   = results[0]
    boxes    = result.boxes
    kp_data  = result.keypoints          # may be None if no persons

    n = len(boxes)
    for i in range(n):
        # ── Bounding box ──────────────────────────────────────────────────
        x1, y1, x2, y2 = [int(v) for v in boxes.xyxy[i].tolist()]
        conf = float(boxes.conf[i])
        cv2.rectangle(out, (x1, y1), (x2, y2), BBOX_COLOR, 2)
        cv2.putText(out, f"person {conf:.2f}",
                    (x1, max(y1 - 8, 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, BBOX_COLOR, 2, cv2.LINE_AA)

        if kp_data is None:
            continue

        # ── Keypoints ─────────────────────────────────────────────────────
        kp_xy   = kp_data.xy[i].tolist()     # [[x,y], …]  17 points
        kp_conf = (kp_data.conf[i].tolist()
                   if kp_data.conf is not None else [1.0] * 17)

        pts = {}
        for idx, ((x, y), c) in enumerate(zip(kp_xy, kp_conf)):
            if c >= CONF_THRESHOLD:
                pts[idx] = (int(x), int(y))
                cv2.circle(out, (int(x), int(y)), 4,
                           KEYPOINT_COLOR, -1, cv2.LINE_AA)

        # ── Skeleton edges ────────────────────────────────────────────────
        for a, b in SKELETON:
            if a in pts and b in pts:
                cv2.line(out, pts[a], pts[b],
                         SKELETON_COLOR, 2, cv2.LINE_AA)

    return out


# ============================================================
# CELL 4 — Sample N videos and pick one frame per video
# ============================================================
def find_all_media(base: str = "/kaggle/input"):
    """
    Scans /kaggle/input for ALL media (videos AND images).
    Prints the full /kaggle/input directory tree (3 levels deep)
    so the user can see exactly what Kaggle mounted.
    Returns (list_of_videos, list_of_images).
    """
    print(f"\n📂 Full directory tree under {base}:")
    for root, dirs, files in os.walk(base):
        depth = root.replace(base, "").count(os.sep)
        if depth >= 3:
            dirs[:] = []
            continue
        indent = "  " * depth
        print(f"{indent}{os.path.basename(root) or base}/")
        subindent = "  " * (depth + 1)
        for f in sorted(files)[:8]:
            print(f"{subindent}{f}")
        if len(files) > 8:
            print(f"{subindent}... (+{len(files)-8} more)")

    # ── Videos ────────────────────────────────────────────────
    videos = []
    for ext in ("*.mp4", "*.avi", "*.mov", "*.mkv"):
        videos.extend(glob.glob(os.path.join(base, "**", ext), recursive=True))

    # ── Images ────────────────────────────────────────────────
    images = []
    for ext in ("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp"):
        images.extend(glob.glob(os.path.join(base, "**", ext), recursive=True))

    print(f"\n✅ Found: {len(videos)} videos, {len(images)} images")
    return videos, images


def sample_frames(dataset_root: str, n_videos: int = 8,
                  frame_offset: float = 0.3) -> list:
    """
    Collects n_videos representative frames.
    Works for both video files AND image datasets (YOLO layout).
    Returns a list of (filename, BGR_frame) tuples.
    """
    videos, images = find_all_media()

    samples = []

    if videos:
        print(f"\n🎞  Video mode — sampling {min(n_videos, len(videos))} videos")
        random.seed(42)
        chosen = random.sample(videos, min(n_videos, len(videos)))
        for path in chosen:
            cap = cv2.VideoCapture(path)
            total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            target_frame = max(0, int(total * frame_offset))
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            ok, frame = cap.read()
            cap.release()
            if ok and frame is not None:
                samples.append((os.path.basename(path), frame))

    elif images:
        print(f"\n🖼  Image mode — sampling {min(n_videos, len(images))} images")
        random.seed(42)
        chosen = random.sample(images, min(n_videos, len(images)))
        for path in chosen:
            frame = cv2.imread(path)
            if frame is not None:
                samples.append((os.path.basename(path), frame))

    else:
        raise FileNotFoundError(
            "❌ No videos or images found anywhere under /kaggle/input.\n"
            "Make sure you added the dataset via: File → Add Input on Kaggle."
        )

    return samples


# ============================================================
# CELL 5 — Run pose model and display the grid
# ============================================================
def run_inspection(n_videos: int = 8, cols: int = 4):
    print("Loading YOLOv8n-pose …")
    pose_model = YOLO("yolov8n-pose.pt")          # auto-downloads on first run

    print(f"Sampling {n_videos} videos from {DATASET_ROOT} …")
    samples = sample_frames(DATASET_ROOT, n_videos=n_videos)
    print(f"  → {len(samples)} frames collected")

    annotated = []
    for name, frame in samples:
        results = pose_model.predict(frame, verbose=False, conf=CONF_THRESHOLD)
        vis     = draw_pose(frame, results)
        vis_rgb = cv2.cvtColor(vis, cv2.COLOR_BGR2RGB)
        annotated.append((name, vis_rgb))

    # ── Build matplotlib grid ──────────────────────────────────────────────
    rows = (len(annotated) + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols,
                             figsize=(6 * cols, 5 * rows),
                             facecolor="#0d1117")   # dark background

    for ax_idx, ax in enumerate(axes.flat):
        ax.set_facecolor("#0d1117")
        ax.axis("off")
        if ax_idx < len(annotated):
            name, img = annotated[ax_idx]
            ax.imshow(img)
            ax.set_title(name, color="white", fontsize=9, pad=4)

    fig.suptitle(
        "VIGIL Exam V2 — Pose Inspection (YOLOv8n-pose)\n"
        "Cyan = Bounding Box  |  Green = Keypoint  |  Gold = Skeleton",
        color="white", fontsize=12, y=1.01,
    )
    plt.tight_layout()
    plt.savefig("pose_inspection.png", dpi=120,
                bbox_inches="tight", facecolor="#0d1117")
    plt.show()
    print("Saved → pose_inspection.png")


# ── Entry point ────────────────────────────────────────────────────────────
run_inspection(n_videos=8, cols=4)
