"""
VIGIL backend - Phase 2: adds ByteTrack (persistent track IDs) + seat-anchor snapping
on top of the Phase 1 detection+pose pipeline.

Output: skeleton overlay video (with seat polygons, track IDs, seat IDs) + JSON event
stream of {seat_id, track_id, keypoints, timestamp} per person per frame.

LICENSE NOTE: YOLO11 (ultralytics) is AGPL-3.0 - prototyping/research use here. ByteTrack
(via supervision) is MIT. RTMPose (via rtmlib) is Apache-2.0.
"""
import json
import time

import cv2
import numpy as np
import supervision as sv
from rtmlib import RTMPose, draw_skeleton
from shapely.geometry import Polygon, box
from ultralytics import YOLO

VIDEO_IN = "V:/backend/test_video_raw.mp4"
VIDEO_OUT = "V:/backend/out_phase2_tracked.mp4"
JSON_OUT = "V:/backend/out_phase2_events.json"
SEATMAP_PATH = "V:/backend/seatmap.json"

RTMPOSE_M_URL = (
    "https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/"
    "rtmpose-m_simcc-body7_pt-body7_420e-256x192-e48f03d0_20230504.zip"
)

PERSON_CLASS_ID = 0
DET_CONF_THRES = 0.4
DEVICE = "cuda"
MIN_SEAT_OVERLAP_FRAC = 0.15  # fraction of person bbox area that must overlap a seat to snap to it

SEAT_COLORS = [
    (255, 128, 0), (0, 200, 255), (255, 0, 200), (128, 255, 0), (0, 128, 255),
]


def load_seatmap(path):
    with open(path) as f:
        data = json.load(f)
    seats = []
    for s in data["seats"]:
        seats.append({"seat_id": s["seat_id"], "polygon": Polygon(s["polygon"]), "polygon_pts": s["polygon"]})
    return seats


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
        overlap_area = person_box.intersection(seat["polygon"]).area
        frac = overlap_area / person_area
        if frac > best_frac:
            best_frac = frac
            best_seat = seat["seat_id"]

    if best_frac < MIN_SEAT_OVERLAP_FRAC:
        return None, best_frac
    return best_seat, best_frac


def draw_seatmap(img, seats):
    overlay = img.copy()
    for i, seat in enumerate(seats):
        pts = np.array(seat["polygon_pts"], dtype=np.int32)
        color = SEAT_COLORS[i % len(SEAT_COLORS)]
        cv2.fillPoly(overlay, [pts], color)
        cv2.polylines(img, [pts], isClosed=True, color=color, thickness=2)
        cx, cy = pts.mean(axis=0).astype(int)
        cv2.putText(
            img, f"seat {seat['seat_id']}", (cx - 40, cy),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA,
        )
    cv2.addWeighted(overlay, 0.12, img, 0.88, 0, dst=img)
    return img


def main():
    seats = load_seatmap(SEATMAP_PATH)
    print(f"loaded {len(seats)} seats from {SEATMAP_PATH}")

    print("loading YOLO11-s (person detector, AGPL-3.0)...")
    yolo = YOLO("yolo11s.pt")

    print("loading RTMPose-m (rtmlib/ONNX, Apache-2.0)...")
    pose_model = RTMPose(
        onnx_model=RTMPOSE_M_URL,
        model_input_size=(192, 256),
        backend="onnxruntime",
        device=DEVICE,
    )

    tracker = sv.ByteTrack()
    print("ByteTrack initialized (MIT license, via supervision)")

    cap = cv2.VideoCapture(VIDEO_IN)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"input: {w}x{h} @ {fps}fps, {n_frames} frames")

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(VIDEO_OUT, fourcc, fps, (w, h))

    event_stream = []  # flat list: {seat_id, track_id, keypoints, timestamp, ...}
    frame_idx = 0
    t_start = time.time()

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            break
        timestamp_s = frame_idx / fps

        det_result = yolo.predict(
            frame, classes=[PERSON_CLASS_ID], conf=DET_CONF_THRES, verbose=False
        )[0]
        if len(det_result.boxes):
            xyxy = det_result.boxes.xyxy.cpu().numpy()
            confs = det_result.boxes.conf.cpu().numpy()
        else:
            xyxy = np.empty((0, 4))
            confs = np.empty((0,))

        detections = sv.Detections(
            xyxy=xyxy,
            confidence=confs,
            class_id=np.zeros(len(xyxy), dtype=int),
        )
        tracked = tracker.update_with_detections(detections)

        if len(tracked) > 0:
            keypoints, scores = pose_model(frame, bboxes=tracked.xyxy)
        else:
            keypoints, scores = np.empty((0, 17, 2)), np.empty((0, 17))

        img_show = frame.copy()
        img_show = draw_seatmap(img_show, seats)
        img_show = draw_skeleton(img_show, keypoints, scores, kpt_thr=0.3)

        for i in range(len(tracked)):
            bbox = tracked.xyxy[i]
            track_id = int(tracked.tracker_id[i])
            seat_id, overlap_frac = snap_to_seat(bbox, seats)

            x1, y1, x2, y2 = bbox.astype(int)
            cv2.rectangle(img_show, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"id{track_id}" + (f" -> {seat_id}" if seat_id else " (unassigned)")
            cv2.putText(
                img_show, label, (x1, max(0, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2, cv2.LINE_AA,
            )

            event_stream.append(
                {
                    "frame_idx": frame_idx,
                    "timestamp_s": round(timestamp_s, 3),
                    "track_id": track_id,
                    "seat_id": seat_id,
                    "seat_overlap_frac": round(float(overlap_frac), 3),
                    "bbox_xyxy": [round(float(v), 1) for v in bbox],
                    "det_confidence": round(float(tracked.confidence[i]), 3),
                    "keypoints": [
                        [round(float(x), 1), round(float(y), 1)] for x, y in keypoints[i]
                    ],
                    "keypoint_scores": [round(float(s), 3) for s in scores[i]],
                }
            )

        writer.write(img_show)
        frame_idx += 1
        if frame_idx % 25 == 0:
            print(f"  frame {frame_idx}/{n_frames}")

    cap.release()
    writer.release()

    elapsed = time.time() - t_start
    processed_fps = frame_idx / elapsed if elapsed > 0 else 0
    print(f"\ndone: {frame_idx} frames in {elapsed:.1f}s ({processed_fps:.1f} fps)")

    unique_tracks = sorted({e["track_id"] for e in event_stream})
    unique_seats_seen = sorted({e["seat_id"] for e in event_stream if e["seat_id"]})
    print(f"unique track IDs seen: {unique_tracks}")
    print(f"unique seats occupied at some point: {unique_seats_seen}")

    with open(JSON_OUT, "w") as f:
        json.dump(
            {
                "source_video": VIDEO_IN,
                "seatmap": SEATMAP_PATH,
                "fps": fps,
                "resolution": [w, h],
                "total_frames": frame_idx,
                "pipeline_fps_measured": round(processed_fps, 2),
                "unique_track_ids": unique_tracks,
                "events": event_stream,
            },
            f,
            indent=2,
        )
    print(f"wrote {VIDEO_OUT}")
    print(f"wrote {JSON_OUT}")


if __name__ == "__main__":
    main()
