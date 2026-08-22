"""
scripts/evaluate_kaggle.py

Batch evaluation script to run the VIGIL USPs against the Kaggle ExamCheating-MultiV dataset.
This script performs an ablation study comparing raw YOLO detections vs. our MultiEvidenceRiskEngine.

Usage:
  python scripts/evaluate_kaggle.py --dataset_dir /kaggle/input/examcheating-multiv-video-based-dataset/data
"""

import argparse
import glob
import json
import os
import sys
import time
import tempfile
import cv2

# Add the parent directory (project root) to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.behavior_pipeline import PoseDetector, COCO17_NAMES
from backend.seat_anchor import SeatAnchorTracker, STATE_LOST, STATE_OCCLUDED_HOLD
from backend.memory_engine import SeatMemoryEngine
from backend.cheat_sync import CheatSyncEngine
from backend.risk_engine import MultiEvidenceRiskEngine

try:
    from ultralytics import YOLO
except ImportError:
    print("Please install ultralytics: pip install ultralytics")
    sys.exit(1)

def generate_dynamic_seatmap(frame, pose_model, seatmap_path):
    """
    Detects people in the first frame and creates a bounding box-based 
    seat polygon for each person, saving to a temporary JSON file.
    """
    results = pose_model.predict(frame, verbose=False)
    seats = []
    
    if results and results[0].boxes is not None:
        boxes = results[0].boxes
        for i in range(len(boxes)):
            x1, y1, x2, y2 = [float(v) for v in boxes.xyxy[i].tolist()]
            # Expand bounding box slightly for the "seat" polygon
            pad = 20
            polygon = [
                [x1 - pad, y1 - pad],
                [x2 + pad, y1 - pad],
                [x2 + pad, y2 + pad],
                [x1 - pad, y2 + pad]
            ]
            seats.append({
                "seat_id": f"Kaggle_S{i+1}",
                "tier": "A",
                "polygon": polygon,
                "neighbors": []  # For simplicity in ablation, no explicit neighbor topology
            })
            
    with open(seatmap_path, "w") as f:
        json.dump({"seats": seats}, f)

def evaluate_video(video_path: str, pose_model, behavior_model):
    print(f"Evaluating {video_path}...")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"  -> Failed to open video.")
        return None
        
    ok, first_frame = cap.read()
    if not ok:
        print(f"  -> Video is empty.")
        return None
        
    # 1. Create dynamic seatmap for this video
    fd, temp_seatmap = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    
    generate_dynamic_seatmap(first_frame, pose_model, temp_seatmap)
    
    # 2. Initialize our USPs
    seat_tracker = SeatAnchorTracker(seatmap_path=temp_seatmap)
    memory_engine = SeatMemoryEngine()
    cheat_sync = CheatSyncEngine(seatmap_path=temp_seatmap)
    risk_engine = MultiEvidenceRiskEngine()
    
    # 3. Use PoseDetector wrapper from behavior_pipeline
    detector = PoseDetector(model_path="yolov8n-pose.pt")
    detector._model = pose_model # inject pre-loaded model
    
    # --- ABLATION METRICS ---
    raw_yolo_flags = 0
    fused_risk_flags = 0
    
    # Fusion signal buffer required for CheatSync
    fusion_buffers = {}
    
    frame_idx = 0
    
    # Reset video to start
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    # Limit frames per video to keep evaluation time reasonable (e.g. max 300 frames)
    MAX_FRAMES = 300
    
    while True:
        ok, frame = cap.read()
        if not ok or frame_idx >= MAX_FRAMES:
            break
            
        timestamp = frame_idx / 30.0
        frame_idx += 1
        
        # A. Raw YOLO Behavior Detection (The Baseline)
        behav_results = behavior_model.predict(frame, verbose=False)
        frame_raw_flags = 0
        if behav_results and behav_results[0].boxes is not None:
            boxes = behav_results[0].boxes
            for i in range(len(boxes)):
                cls = int(boxes.cls[i])
                conf = float(boxes.conf[i])
                # Class 1: leaning_forward, Class 2: hand_signal
                if cls in [1, 2] and conf > 0.60:
                    raw_yolo_flags += 1
                    frame_raw_flags += 1
                    
        # B. VIGIL Fused Risk (The USPs)
        detections = detector.detect(frame)
        det_payload = [{"bbox": d["bbox"], "conf": d.get("conf", 0.0)} for d in detections]
        
        seat_assignments = seat_tracker.assign_seats(det_payload)
        
        for assignment in seat_assignments:
            seat_id = assignment["seat_id"]
            det_idx = assignment.get("det_index")
            
            if assignment["state"] in (STATE_LOST, STATE_OCCLUDED_HOLD) or det_idx is None:
                continue
                
            det = detections[det_idx]
            kpts = det.get("keypoints", {})
            
            # 1. Memory Engine
            pose_result = memory_engine.process_frame(seat_id, kpts, timestamp)
            z_pose = max(pose_result["z_yaw"], pose_result["z_lean"])
            
            # Track signals for sync
            buf = fusion_buffers.setdefault(seat_id, [])
            buf.append(z_pose)
            if len(buf) > 90:
                del buf[:len(buf)-90]
            
            # 2. Cheat Sync Engine
            sync_results = cheat_sync.evaluate_synchrony(fusion_buffers)
            best_sync = 0.0
            paired_seat = None
            for r in sync_results:
                if r["seat_id"] == seat_id or r["paired_seat_id"] == seat_id:
                    if r["sync_score"] > best_sync:
                        best_sync = r["sync_score"]
                        paired_seat = r["paired_seat_id"] if r["seat_id"] == seat_id else r["seat_id"]
            
            # We assign the highest yolo conf in this frame to this student for the harness
            # (In production, we would use bounding box IoU to map exact behaviour to seat)
            best_yolo_conf = 0.0
            best_yolo_class = None
            if behav_results and behav_results[0].boxes is not None:
                for i in range(len(behav_results[0].boxes)):
                    if int(behav_results[0].boxes.cls[i]) in [1, 2]:
                        c = float(behav_results[0].boxes.conf[i])
                        if c > best_yolo_conf:
                            best_yolo_conf = c
                            best_yolo_class = "suspicious" # normalize class string
                            
            # 3. Risk Engine
            card = risk_engine.evaluate(
                seat=seat_id,
                z_pose=z_pose,
                cheat_sync_score=best_sync,
                yolo_conf=best_yolo_conf,
                paired_seat=paired_seat,
                yolo_class=best_yolo_class,
                elapsed_seconds=timestamp
            )
            
            if card is not None:
                fused_risk_flags += 1

    cap.release()
    os.remove(temp_seatmap)
    
    print(f"  -> Raw YOLO False Positives / Noise: {raw_yolo_flags}")
    print(f"  -> VIGIL Fused Risk Alerts: {fused_risk_flags}")
    
    return {
        "video": os.path.basename(video_path),
        "raw_yolo_flags": raw_yolo_flags,
        "fused_risk_flags": fused_risk_flags
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_dir", default="/kaggle/input/datasets/rimmajeed/examcheating-multiv-video-based-dataset", help="Path to Kaggle videos")
    parser.add_argument("--out", default="evaluation_report.json")
    args = parser.parse_args()
    
    videos = []
    for ext in ("*.mp4", "*.avi", "*.mov", "*.mkv"):
        videos.extend(glob.glob(os.path.join(args.dataset_dir, "**", ext), recursive=True))
        
    if not videos:
        print(f"No video files found in {args.dataset_dir}")
        return

    print("Loading models...")
    pose_model = YOLO("yolov8n-pose.pt")
    
    # Fallback if custom model isn't found locally (e.g. testing)
    behav_model_path = "vigil_yolo_4cls_best.pt"
    if not os.path.exists(behav_model_path):
        print(f"WARNING: Custom model {behav_model_path} not found. Falling back to yolov8n.pt for ablation.")
        behavior_model = YOLO("yolov8n.pt")
    else:
        behavior_model = YOLO(behav_model_path)

    results = []
    t0 = time.time()
    
    for vid in videos:
        res = evaluate_video(vid, pose_model, behavior_model)
        if res:
            results.append(res)
        
    print(f"\nEvaluation complete in {time.time() - t0:.2f}s")
    
    with open(args.out, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Wrote metrics to {args.out}")

if __name__ == "__main__":
    main()
