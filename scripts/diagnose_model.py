"""
scripts/diagnose_model.py

Diagnostic tool: run vigil_yolo_4cls_best.pt on a single Kaggle video and dump
every raw prediction at any confidence level. This tells us whether the model
is completely blind to the footage or just under-confident.

Usage on Kaggle:
  !python scripts/diagnose_model.py \
      --video /kaggle/input/.../c30.mp4 \
      --model vigil_yolo_4cls_best.pt
"""

import argparse
import os
import sys
import cv2

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ultralytics import YOLO
except ImportError:
    print("Please install ultralytics: pip install ultralytics")
    sys.exit(1)

CLASS_NAMES = {0: "person", 1: "leaning_forward", 2: "hand_signal", 3: "normal_exam_activity"}

def diagnose(video_path: str, model_path: str, max_frames: int = 300):
    print(f"\n{'='*60}")
    print(f"Diagnosing: {os.path.basename(video_path)}")
    print(f"Model: {model_path}")
    print(f"{'='*60}")

    model = YOLO(model_path)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("ERROR: Could not open video file.")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"  Resolution: {w}x{h}, FPS: {fps:.1f}, Total frames: {total_frames}")

    all_detections = []
    frame_idx = 0

    while True:
        ok, frame = cap.read()
        if not ok or frame_idx >= max_frames:
            break

        # Super low threshold to catch everything, even weak predictions
        results = model.predict(frame, verbose=False, conf=0.01)

        if results and results[0].boxes is not None:
            boxes = results[0].boxes
            for i in range(len(boxes)):
                cls = int(boxes.cls[i])
                conf = float(boxes.conf[i])
                all_detections.append((frame_idx, cls, conf))

        frame_idx += 1

    cap.release()

    print(f"\n  Frames processed: {frame_idx}")
    print(f"  Total raw detections (conf > 0.01): {len(all_detections)}")

    if not all_detections:
        print("\n  [!!!] MODEL IS COMPLETELY BLIND TO THIS VIDEO")
        print("  Zero detections even at 1% confidence -> domain shift / format mismatch.")
        return

    print("\n  Detection breakdown by class:")
    for cls_id, cls_name in CLASS_NAMES.items():
        cls_dets = [(f, c) for f, cl, c in all_detections if cl == cls_id]
        if cls_dets:
            confs = [c for _, c in cls_dets]
            print(f"    [{cls_id}] {cls_name}: {len(cls_dets)} | avg={sum(confs)/len(confs):.3f} | max={max(confs):.3f}")
        else:
            print(f"    [{cls_id}] {cls_name}: 0 detections")

    top = sorted(all_detections, key=lambda x: x[2], reverse=True)[:10]
    print("\n  Top 10 highest confidence detections:")
    for frame_n, cls_id, conf in top:
        print(f"    Frame {frame_n:<5} | {CLASS_NAMES.get(cls_id, str(cls_id)):<25} | conf={conf:.4f}")

    print("\n  Cheating-class detections above thresholds:")
    for thresh in [0.10, 0.20, 0.30, 0.50, 0.60]:
        count = sum(1 for _, cl, c in all_detections if cl in [1, 2] and c > thresh)
        print(f"    conf > {thresh:.2f}: {count}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--model", default="vigil_yolo_4cls_best.pt")
    parser.add_argument("--frames", type=int, default=300)
    args = parser.parse_args()
    diagnose(args.video, args.model, args.frames)

if __name__ == "__main__":
    main()
