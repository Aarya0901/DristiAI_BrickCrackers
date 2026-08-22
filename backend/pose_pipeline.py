"""
VIGIL backend - Phase 1: person detection (YOLO11-s) + pose (RTMPose-m via rtmlib/ONNX).
Renders skeleton overlay video and writes per-frame JSON: person bbox, keypoints, confidence.
No tracking / seat-anchoring yet (that's Phase 2) - every frame's people are independent detections.

LICENSE NOTE: ultralytics (YOLO11) is AGPL-3.0. Using it here for prototyping/research only.
Any commercial deployment of VIGIL must either buy an Ultralytics Enterprise license or swap
the detector for a permissively-licensed alternative (e.g. RT-DETR, Apache-2.0) before shipping.
"""
import json
import time

import cv2
import numpy as np
from rtmlib import RTMPose, draw_skeleton
from ultralytics import YOLO

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
VIDEO_IN = str(BACKEND_DIR / "test_video_raw.mp4")
VIDEO_OUT = str(BACKEND_DIR / "out_phase1_skeleton.mp4")
JSON_OUT = str(BACKEND_DIR / "out_phase1_events.json")

RTMPOSE_M_URL = (
    "https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/"
    "rtmpose-m_simcc-body7_pt-body7_420e-256x192-e48f03d0_20230504.zip"
)

PERSON_CLASS_ID = 0  # COCO 'person'
DET_CONF_THRES = 0.4
DEVICE = "cuda"


def main():
    print("loading YOLO11-s (person detector, AGPL-3.0)...")
    yolo_weights = str(BACKEND_DIR / "yolo11s.pt") if (BACKEND_DIR / "yolo11s.pt").exists() else "yolo11s.pt"
    yolo = YOLO(yolo_weights)

    print("loading RTMPose-m (rtmlib/ONNX, Apache-2.0)...")
    pose_model = RTMPose(
        onnx_model=RTMPOSE_M_URL,
        model_input_size=(192, 256),
        backend="onnxruntime",
        device=DEVICE,
    )

    cap = cv2.VideoCapture(VIDEO_IN)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"input: {w}x{h} @ {fps}fps, {n_frames} frames")

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(VIDEO_OUT, fourcc, fps, (w, h))

    all_frames_events = []
    frame_idx = 0
    t_pipeline_start = time.time()

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            break

        timestamp_s = frame_idx / fps

        det_result = yolo.predict(
            frame, classes=[PERSON_CLASS_ID], conf=DET_CONF_THRES, verbose=False
        )[0]
        bboxes_xyxy = det_result.boxes.xyxy.cpu().numpy() if len(det_result.boxes) else np.empty((0, 4))
        det_confs = det_result.boxes.conf.cpu().numpy() if len(det_result.boxes) else np.empty((0,))

        if len(bboxes_xyxy) > 0:
            keypoints, scores = pose_model(frame, bboxes=bboxes_xyxy)
        else:
            keypoints, scores = np.empty((0, 17, 2)), np.empty((0, 17))

        img_show = frame.copy()
        img_show = draw_skeleton(img_show, keypoints, scores, kpt_thr=0.3)
        for bbox in bboxes_xyxy:
            x1, y1, x2, y2 = bbox.astype(int)
            cv2.rectangle(img_show, (x1, y1), (x2, y2), (0, 255, 0), 2)
        writer.write(img_show)

        frame_people = []
        for i in range(len(bboxes_xyxy)):
            frame_people.append(
                {
                    "person_idx": i,  # no persistent identity yet - Phase 2 adds track_id
                    "bbox_xyxy": [round(float(v), 1) for v in bboxes_xyxy[i]],
                    "det_confidence": round(float(det_confs[i]), 3),
                    "keypoints": [
                        [round(float(x), 1), round(float(y), 1)]
                        for x, y in keypoints[i]
                    ],
                    "keypoint_scores": [round(float(s), 3) for s in scores[i]],
                }
            )

        all_frames_events.append(
            {
                "frame_idx": frame_idx,
                "timestamp_s": round(timestamp_s, 3),
                "num_people": len(frame_people),
                "people": frame_people,
            }
        )

        frame_idx += 1
        if frame_idx % 25 == 0:
            print(f"  frame {frame_idx}/{n_frames}")

    cap.release()
    writer.release()

    elapsed = time.time() - t_pipeline_start
    processed_fps = frame_idx / elapsed if elapsed > 0 else 0
    print(f"\ndone: {frame_idx} frames in {elapsed:.1f}s ({processed_fps:.1f} fps)")

    with open(JSON_OUT, "w") as f:
        json.dump(
            {
                "source_video": VIDEO_IN,
                "fps": fps,
                "resolution": [w, h],
                "total_frames": frame_idx,
                "pipeline_fps_measured": round(processed_fps, 2),
                "frames": all_frames_events,
            },
            f,
            indent=2,
        )
    print(f"wrote {VIDEO_OUT}")
    print(f"wrote {JSON_OUT}")


if __name__ == "__main__":
    main()
