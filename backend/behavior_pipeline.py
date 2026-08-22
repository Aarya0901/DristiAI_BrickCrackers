"""
VIGIL backend - Phase 4: behavior-event layer on top of the tracked pipeline.

Extends the Phase 2 stack (YOLO11-s person detection + ByteTrack + seat-anchor
snapping) with a SECOND detector: the 4-class Vigil behavior model (trained on
SCB, reduced taxonomy per the 2026-07-23 scope decision).

Architecture:
  person detector (COCO YOLO11-s) -> ByteTrack -> seat snapping
  behavior detector (4-class)     -> per-frame behavior boxes
  IoU association                 -> behavior events attached to track_id + seat_id
  sliding-window aggregation      -> review_candidate signals (NOT cheating labels)

The behavior taxonomy (4 classes):
  0 person, 1 leaning_forward, 2 hand_signal, 3 normal_exam_activity.

DROPPED CLASSES (2026-07-23 scope decision):
  - looking_left: 0.100 mAP50 on test; box detection is the wrong representation
    for head orientation. Head direction is owned by Gaze-LLE (primary, Tier A/B)
    and keypoint-geometry yaw (fallback, all tiers). See Drishti AI dossier §13A/§16.
  - talking: 0.059 mAP50 on test despite 3,780 train instances; mouth-movement is
    not box-detectable at CCTV resolution. Future: pairwise head-proximity heuristic.

MODEL PERFORMANCE (test, 4-class 35 epochs, vigil_yolo_4cls_best.pt):
  mAP50=0.388  mAP50-95=0.280  P=0.386  R=0.571
  hand_signal mAP50=0.570, leaning_forward mAP50=0.278, normal_exam mAP50=0.316

HONESTY CONSTRAINTS:
  - Trained on SCB classroom images, NOT exam-hall CCTV. Domain shift unvalidated.
  - Person detection (class 0) not evaluated on this dataset (0 test instances).
  - No GT-annotated exam video exists → real FP-per-student-hour unknown.
  - Output is "review_candidate" — never declares cheating.

Usage:
  python backend/behavior_pipeline.py --video backend/test_video_raw.mp4 \
      --behavior-weights vigil_yolo_4cls_best.pt

LICENSE: YOLO11 (ultralytics) AGPL-3.0 prototyping only; ByteTrack (MIT);
RTMPose (Apache-2.0).
"""
import argparse
import json
import time
from collections import defaultdict, deque

import cv2
import numpy as np
import supervision as sv
from shapely.geometry import Polygon, box
from ultralytics import YOLO

BEHAVIOR_NAMES = {
    0: "person",
    1: "leaning_forward",
    2: "hand_signal",
    3: "normal_exam_activity",
}

# Behaviors counted toward a review_candidate. normal_exam_activity and person
# are never flagged.
# NOTE: looking_left removed from YOLO stage — owned by Gaze-LLE/keypoint-yaw.
#       talking removed — mouth-movement not box-detectable at CCTV resolution.
FLAGGED_BEHAVIORS = {"leaning_forward", "hand_signal"}

# Window rule: >=N flagged events of the same behavior within W seconds of the
# same seat produces one review_candidate. Deliberately conservative.
WINDOW_SECONDS = 10.0
MIN_EVENTS_IN_WINDOW = 3

MIN_SEAT_OVERLAP_FRAC = 0.15
IOU_ASSOCIATE_THRES = 0.30
BEHAVIOR_CONF_THRES = 0.35
DET_CONF_THRES = 0.4
PERSON_CLASS_ID = 0

SEAT_COLORS = [(255, 128, 0), (0, 200, 255), (255, 0, 200), (128, 255, 0), (0, 128, 255)]


def parse_args():
    p = argparse.ArgumentParser(description="VIGIL Phase 4: behavior-event pipeline")
    p.add_argument("--video", default="backend/test_video_raw.mp4")
    p.add_argument("--seatmap", default="backend/seatmap.json")
    p.add_argument("--behavior-weights", required=True,
                    help="Path to fine-tuned Vigil behavior weights (best.pt). "
                        "Train first: python scripts/train_vigil_yolo.py")
    p.add_argument("--person-weights", default="backend/yolo11s.pt")
    p.add_argument("--video-out", default="backend/out_phase4_behavior.mp4")
    p.add_argument("--json-out", default="backend/out_phase4_events.json")
    p.add_argument("--device", default="cuda")
    p.add_argument("--max-frames", type=int, default=0, help="0 = all frames")
    return p.parse_args()


def load_seatmap(path):
    with open(path) as f:
        data = json.load(f)
    return [{"seat_id": s["seat_id"], "polygon": Polygon(s["polygon"]),
            "polygon_pts": s["polygon"]} for s in data["seats"]]


def snap_to_seat(bbox_xyxy, seats):
    x1, y1, x2, y2 = bbox_xyxy
    person_box = box(x1, y1, x2, y2)
    person_area = person_box.area
    if person_area <= 0:
        return None, 0.0
    best_seat, best_frac = None, 0.0
    for seat in seats:
        if not seat["polygon"].is_valid or not person_box.intersects(seat["polygon"]):
            continue
        frac = person_box.intersection(seat["polygon"]).area / person_area
        if frac > best_frac:
            best_frac, best_seat = frac, seat["seat_id"]
    if best_frac < MIN_SEAT_OVERLAP_FRAC:
        return None, best_frac
    return best_seat, best_frac


def iou_xyxy(a, b):
    x1 = max(a[0], b[0]); y1 = max(a[1], b[1])
    x2 = min(a[2], b[2]); y2 = min(a[3], b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def main():
    args = parse_args()

    import os
    if not os.path.exists(args.behavior_weights):
        raise SystemExit(
            f"Behavior weights not found: {args.behavior_weights}\n"
            "Train first:  python scripts/train_vigil_yolo.py\n"
            "Then point --behavior-weights at runs/detect/<run>/weights/best.pt"
        )

    seats = load_seatmap(args.seatmap) if os.path.exists(args.seatmap) else []
    if seats:
        print(f"loaded {len(seats)} seats from {args.seatmap}")
    else:
        print(f"WARNING: seatmap not found at {args.seatmap} — events will have seat_id=null")

    print("loading person detector (YOLO11-s, COCO)...")
    person_model = YOLO(args.person_weights)
    print(f"loading behavior detector ({args.behavior_weights})...")
    behavior_model = YOLO(args.behavior_weights)

    tracker = sv.ByteTrack()

    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        raise SystemExit(f"Cannot open video: {args.video}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"input: {w}x{h} @ {fps:.1f}fps, {n_frames} frames")

    writer = cv2.VideoWriter(
        args.video_out, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    event_stream = []
    review_candidates = []
    # per seat -> per behavior -> deque of timestamps
    seat_behavior_times = defaultdict(lambda: defaultdict(deque))

    frame_idx = 0
    t_start = time.time()

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            break
        if args.max_frames and frame_idx >= args.max_frames:
            break

        ts = frame_idx / fps

        # --- person detection + tracking ---
        det = person_model.predict(
            frame, classes=[PERSON_CLASS_ID], conf=DET_CONF_THRES, verbose=False)[0]
        if len(det.boxes):
            xyxy = det.boxes.xyxy.cpu().numpy()
            confs = det.boxes.conf.cpu().numpy()
        else:
            xyxy = np.empty((0, 4)); confs = np.empty((0,))

        detections = sv.Detections(
            xyxy=xyxy, confidence=confs,
            class_id=np.zeros(len(xyxy), dtype=int))
        tracked = tracker.update_with_detections(detections)

        # --- behavior detection ---
        bdet = behavior_model.predict(
            frame, conf=BEHAVIOR_CONF_THRES, verbose=False)[0]
        behavior_boxes = []
        if len(bdet.boxes):
            for b, c, k in zip(bdet.boxes.xyxy.cpu().numpy(),
                               bdet.boxes.conf.cpu().numpy(),
                               bdet.boxes.cls.cpu().numpy()):
                behavior_boxes.append({
                    "bbox": b, "conf": float(c),
                    "behavior": BEHAVIOR_NAMES.get(int(k), f"cls_{int(k)}"),
                })

        # --- associate behaviors to tracks by IoU ---
        frame_events = []
        for ti in range(len(tracked)):
            tbbox = tracked.xyxy[ti]
            track_id = int(tracked.tracker_id[ti])
            seat_id, seat_frac = snap_to_seat(tbbox, seats) if seats else (None, 0.0)

            best, best_iou = None, 0.0
            for bb in behavior_boxes:
                if bb["behavior"] in ("person",):
                    continue  # person class is covered by the person detector
                iou = iou_xyxy(tbbox, bb["bbox"])
                if iou > best_iou:
                    best_iou, best = iou, bb

            behavior = best["behavior"] if best_iou >= IOU_ASSOCIATE_THRES else None
            behavior_conf = best["conf"] if behavior else None

            ev = {
                "frame_idx": frame_idx,
                "timestamp_s": round(ts, 3),
                "track_id": track_id,
                "seat_id": seat_id,
                "behavior": behavior,
                "behavior_conf": round(behavior_conf, 3) if behavior_conf else None,
                "association_iou": round(best_iou, 3),
            }
            frame_events.append(ev)
            event_stream.append(ev)

            # --- sliding-window aggregation -> review_candidate ---
            if seat_id and behavior in FLAGGED_BEHAVIORS:
                dq = seat_behavior_times[seat_id][behavior]
                dq.append(ts)
                while dq and ts - dq[0] > WINDOW_SECONDS:
                    dq.popleft()
                if len(dq) == MIN_EVENTS_IN_WINDOW:  # fire once per crossing
                    review_candidates.append({
                        "timestamp_s": round(ts, 3),
                        "seat_id": seat_id,
                        "track_id": track_id,
                        "trigger": behavior,
                        "events_in_window": len(dq),
                        "window_s": WINDOW_SECONDS,
                        "note": "observable-event aggregate for human review; "
                                "NOT a cheating determination",
                    })

            # --- draw ---
            x1, y1, x2, y2 = tbbox.astype(int)
            color = (0, 255, 0) if behavior is None else (0, 165, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"id{track_id}"
            if seat_id:
                label += f"@{seat_id}"
            if behavior:
                label += f" [{behavior}]"
            cv2.putText(frame, label, (x1, max(0, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA)

        for bb in behavior_boxes:
            bx1, by1, bx2, by2 = bb["bbox"].astype(int)
            cv2.rectangle(frame, (bx1, by1), (bx2, by2), (255, 0, 255), 1)
            cv2.putText(frame, f"{bb['behavior']} {bb['conf']:.2f}",
                        (bx1, max(0, by1 - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 255), 1, cv2.LINE_AA)

        writer.write(frame)
        frame_idx += 1
        if frame_idx % 50 == 0:
            print(f"  frame {frame_idx}/{n_frames}")

    cap.release()
    writer.release()

    elapsed = time.time() - t_start
    fps_out = frame_idx / elapsed if elapsed > 0 else 0

    # per-seat behavior summary
    summary = {}
    for seat_id, behaviors in seat_behavior_times.items():
        summary[seat_id] = {b: len(times) for b, times in behaviors.items()}

    with open(args.json_out, "w") as f:
        json.dump({
            "source_video": args.video,
            "behavior_weights": args.behavior_weights,
            "fps": fps,
            "total_frames": frame_idx,
            "pipeline_fps_measured": round(fps_out, 2),
            "window_rule": {
                "window_s": WINDOW_SECONDS,
                "min_events": MIN_EVENTS_IN_WINDOW,
                "flagged_behaviors": sorted(FLAGGED_BEHAVIORS),
            },
            "review_candidates": review_candidates,
            "seat_behavior_summary": summary,
            "events": event_stream,
            "caveats": [
                "Behavior model trained on SCB classroom images, not exam-hall CCTV.",
                "review_candidate is an observable-event aggregate for human review, "
                "not a cheating determination.",
                "phone_visible/paper_exchange/standing not detectable (0 training instances).",
            ],
        }, f, indent=2)

    print(f"\ndone: {frame_idx} frames in {elapsed:.1f}s ({fps_out:.1f} fps)")
    print(f"behavior events: {sum(1 for e in event_stream if e['behavior'])}")
    print(f"review_candidates: {len(review_candidates)}")
    for rc in review_candidates:
        print(f"  t={rc['timestamp_s']}s seat={rc['seat_id']} "
              f"{rc['trigger']} x{rc['events_in_window']}")
    print(f"wrote {args.video_out}")
    print(f"wrote {args.json_out}")


if __name__ == "__main__":
    main()
