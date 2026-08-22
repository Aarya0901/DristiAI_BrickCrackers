"""
backend/behavior_pipeline.py

BehaviorPipeline: real-time, edge-optimized exam-monitoring perception
pipeline for the Drishti AI / VIGIL project.

This is the composition root for four of the eight modules:
  - PoseDetector (defined here)         : person + 17 COCO keypoint detection
  - SeatAnchorTracker  (seat_anchor.py) : bbox -> seat_id assignment + tracking
  - CalibratedAbstentionGate (calibrated_abstention.py) : visibility gating
  - DeskLeakageDetector (desk_leakage.py) : boundary-excursion detection

Rather than reimplementing seat-matching / occlusion-handling /
desk-leakage / confidence-gating inline (as earlier drafts did), this file
now delegates each of those responsibilities to its dedicated module, so
there is exactly one implementation of each behaviour in the codebase.

Two consumption modes are exposed:
  1. `BehaviorPipeline.run(video_source)` — synchronous generator for CLI /
     offline video use. Yields (annotated_frame, records) per frame, same
     as before.
  2. `stream_events(...)` — an ASYNC generator that main.py's live pipeline
     worker imports directly (`from backend.behavior_pipeline import
     stream_events`). It yields the raw per-seat event schema that
     SeatMemoryEngine/CheatSyncEngine/MultiEvidenceRiskEngine expect:
         {"seat_id", "timestamp", "keypoints", "yolo": {"class", "conf"}}
     Camera I/O is blocking (cv2.VideoCapture.read), so it's pushed to a
     thread via asyncio.to_thread on every frame to avoid stalling the
     FastAPI event loop.
"""

from __future__ import annotations

import asyncio
import json
import time
from collections import deque
from pathlib import Path
from typing import Any, Deque, Dict, Generator, List, Optional, Tuple

import numpy as np

try:
    import cv2
except ImportError as exc:  # pragma: no cover - OpenCV is a hard requirement
    raise ImportError(
        "backend.behavior_pipeline requires opencv-python (`pip install opencv-python`)."
    ) from exc

from backend.seat_anchor import SeatAnchorTracker, STATE_LOST, STATE_OCCLUDED_HOLD, auto_generate_seatmap
from backend.calibrated_abstention import CalibratedAbstentionGate
from backend.desk_leakage import DeskLeakageDetector, LEAKAGE_TYPE_NONE

EPS = 1e-9

# COCO-17 keypoint index -> name (RTMPose / YOLOv8-pose ordering)
COCO17_NAMES = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle",
]

# MediaPipe Pose (BlazePose, 33 landmarks) -> subset mapped to COCO names.
MEDIAPIPE_TO_COCO = {
    "nose": 0, "left_eye": 2, "right_eye": 5, "left_ear": 7, "right_ear": 8,
    "left_shoulder": 11, "right_shoulder": 12, "left_elbow": 13, "right_elbow": 14,
    "left_wrist": 15, "right_wrist": 16, "left_hip": 23, "right_hip": 24,
    "left_knee": 25, "right_knee": 26, "left_ankle": 27, "right_ankle": 28,
}

STATUS_NORMAL = "NORMAL"
STATUS_LEAKAGE_ANOMALY = "LEAKAGE_ANOMALY"
STATUS_ABSTAIN = "ABSTAIN"

REASON_NONE = ""
REASON_NO_MODEL = "NO_MODEL_AVAILABLE"
REASON_HEAD_YAW_SUSTAINED = "SUSTAINED_HEAD_YAW"

DEFAULT_YAW_THRESHOLD_DEG = 45.0
DEFAULT_SUSTAINED_FRAMES = 20  # ~0.66s @ 30 FPS

STATUS_COLORS = {
    STATUS_NORMAL: (0, 200, 0),
    STATUS_LEAKAGE_ANOMALY: (0, 0, 255),
    STATUS_ABSTAIN: (0, 200, 255),
}

DEFAULT_SEATMAP_PATH = "backend/seatmap.json"
DEFAULT_MODEL_PATH = "yolov8n-pose.pt"


# --------------------------------------------------------------------------
# Detector abstraction (YOLOv8n-pose preferred, MediaPipe fallback)
# --------------------------------------------------------------------------

class PoseDetector:
    """
    Thin wrapper unifying YOLOv8n-pose (ultralytics) and MediaPipe Pose
    behind one `detect(frame) -> List[Dict]` interface. Falls back to a
    no-op detector (everything ABSTAINs) if neither library is present,
    so the pipeline still runs end-to-end on a bare environment.
    """

    BACKEND_YOLO = "yolov8n-pose"
    BACKEND_MEDIAPIPE = "mediapipe"
    BACKEND_NONE = "none"

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH, device: str = "cpu") -> None:
        self.backend = self.BACKEND_NONE
        self._model = None
        self._mp_pose = None

        try:
            from ultralytics import YOLO  # type: ignore
            self._model = YOLO(model_path)
            self.backend = self.BACKEND_YOLO
            return
        except Exception:
            pass

        try:
            import mediapipe as mp  # type: ignore
            self._mp_pose = mp.solutions.pose.Pose(
                static_image_mode=False, model_complexity=1,
                min_detection_confidence=0.5, min_tracking_confidence=0.5,
            )
            self.backend = self.BACKEND_MEDIAPIPE
        except Exception:
            self.backend = self.BACKEND_NONE

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        if self.backend == self.BACKEND_YOLO:
            return self._detect_yolo(frame)
        if self.backend == self.BACKEND_MEDIAPIPE:
            return self._detect_mediapipe(frame)
        return []

    def _detect_yolo(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        results = self._model.predict(frame, verbose=False)
        detections: List[Dict[str, Any]] = []
        if not results:
            return detections
        result = results[0]
        boxes = getattr(result, "boxes", None)
        keypoints = getattr(result, "keypoints", None)
        if boxes is None:
            return detections

        n = len(boxes)
        for i in range(n):
            xyxy = boxes.xyxy[i].tolist()
            conf = float(boxes.conf[i]) if boxes.conf is not None else 0.0
            kp_dict: Dict[str, Tuple[float, float, float]] = {}
            if keypoints is not None:
                kp_xy = keypoints.xy[i].tolist()
                kp_conf = (
                    keypoints.conf[i].tolist()
                    if getattr(keypoints, "conf", None) is not None
                    else [1.0] * len(kp_xy)
                )
                for idx, name in enumerate(COCO17_NAMES):
                    if idx < len(kp_xy):
                        x, y = kp_xy[idx]
                        c = kp_conf[idx] if idx < len(kp_conf) else 0.0
                        kp_dict[name] = (float(x), float(y), float(c))
            detections.append({"bbox": [float(v) for v in xyxy], "conf": conf, "keypoints": kp_dict})
        return detections

    def _detect_mediapipe(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self._mp_pose.process(rgb)
        if not result.pose_landmarks:
            return []

        landmarks = result.pose_landmarks.landmark
        kp_dict: Dict[str, Tuple[float, float, float]] = {}
        xs, ys = [], []
        for name, idx in MEDIAPIPE_TO_COCO.items():
            lm = landmarks[idx]
            x, y = lm.x * w, lm.y * h
            kp_dict[name] = (float(x), float(y), float(lm.visibility))
            xs.append(x)
            ys.append(y)

        if not xs:
            return []
        bbox = [min(xs), min(ys), max(xs), max(ys)]
        avg_visibility = float(np.mean([kp[2] for kp in kp_dict.values()]))
        return [{"bbox": bbox, "conf": avg_visibility, "keypoints": kp_dict}]


# --------------------------------------------------------------------------
# Per-seat temporal state (head-yaw sustain counter only — everything else
# now lives inside seat_anchor / calibrated_abstention / desk_leakage)
# --------------------------------------------------------------------------

class _SeatYawState:
    __slots__ = ("yaw_history", "yaw_sustained_frames")

    def __init__(self, history_len: int = 90) -> None:
        self.yaw_history: Deque[float] = deque(maxlen=history_len)
        self.yaw_sustained_frames = 0


# --------------------------------------------------------------------------
# BehaviorPipeline
# --------------------------------------------------------------------------

class BehaviorPipeline:
    """
    End-to-end, edge-optimized behaviour monitoring pipeline: detection ->
    seat anchoring (SeatAnchorTracker) -> calibrated abstention gating
    (CalibratedAbstentionGate) -> desk-leakage + head-yaw anomaly checks
    (DeskLeakageDetector) -> annotated frame + structured JSON output.
    """

    def __init__(
        self,
        seatmap_path: Optional[str] = DEFAULT_SEATMAP_PATH,
        model_path: str = DEFAULT_MODEL_PATH,
        yaw_threshold_deg: float = DEFAULT_YAW_THRESHOLD_DEG,
        yaw_sustained_frames: int = DEFAULT_SUSTAINED_FRAMES,
    ) -> None:
        self.detector = PoseDetector(model_path=model_path)
        self.seatmap_path = seatmap_path

        # If 'auto' or file does not exist, initialize seat_tracker dynamically on first frame
        self.auto_seatmap = (
            seatmap_path is None
            or seatmap_path == "auto"
            or not Path(str(seatmap_path)).exists()
        )

        if self.auto_seatmap:
            self.seat_tracker = None
        else:
            self.seat_tracker = SeatAnchorTracker(seatmap=seatmap_path)

        self.abstention_gate = CalibratedAbstentionGate()
        self.leakage_detector = DeskLeakageDetector()

        self.yaw_threshold_deg = yaw_threshold_deg
        self.yaw_sustained_frames = yaw_sustained_frames

        self._yaw_states: Dict[str, _SeatYawState] = {}
        self.frame_id = 0
        self._last_fps_ts = time.time()
        self.fps_estimate = 0.0

    # ---- geometry / signal computation -----------------------------------

    @staticmethod
    def _get_xy(keypoints, name: str) -> Optional[Tuple[float, float]]:
        kp = keypoints.get(name)
        if kp is None:
            return None
        return (kp[0], kp[1])

    def _estimate_head_yaw(self, keypoints) -> Optional[float]:
        """Eye-nose-ear triangulation, mapped to an approximate yaw angle."""
        nose = self._get_xy(keypoints, "nose")
        l_ear = self._get_xy(keypoints, "left_ear")
        r_ear = self._get_xy(keypoints, "right_ear")
        if nose is None or l_ear is None or r_ear is None:
            return None

        ear_mid_x = (l_ear[0] + r_ear[0]) / 2.0
        inter_ear_dist = abs(l_ear[0] - r_ear[0])
        if inter_ear_dist < 1e-3:
            return None

        offset_ratio = (nose[0] - ear_mid_x) / (inter_ear_dist / 2.0 + EPS)
        offset_ratio = float(np.clip(offset_ratio, -3.0, 3.0))
        yaw_deg = float(np.clip(offset_ratio * 90.0, -90.0, 90.0))
        return yaw_deg

    def _get_yaw_state(self, seat_id: str) -> _SeatYawState:
        state = self._yaw_states.get(seat_id)
        if state is None:
            state = _SeatYawState()
            self._yaw_states[seat_id] = state
        return state

    # ---- per-frame processing ----------------------------------------------

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """Runs the full pipeline on a single BGR frame. Returns (annotated_frame, records)."""
        self.frame_id += 1
        annotated = frame.copy()
        records: List[Dict[str, Any]] = []

        if self.detector.backend == PoseDetector.BACKEND_NONE:
            self._draw_banner(annotated, "NO POSE MODEL AVAILABLE - ABSTAIN MODE")
            return annotated, records

        detections = self.detector.detect(frame)
        det_payload = [{"bbox": d["bbox"], "conf": d.get("conf", 0.0)} for d in detections]

        # Dynamic Auto-Seatmap initialization on initial frame with detections
        if self.seat_tracker is None or (self.auto_seatmap and len(self.seat_tracker.seats) == 0):
            if det_payload:
                bboxes = [d["bbox"] for d in det_payload]
                auto_map = auto_generate_seatmap(bboxes, frame_shape=frame.shape[:2])
                self.seat_tracker = SeatAnchorTracker(seatmap=auto_map)
            else:
                return annotated, records

        # Draw static seat polygons for visual clarity
        for seat_id, seat in self.seat_tracker.seats.items():
            poly_pts = np.asarray(seat.polygon, dtype=np.int32).reshape((-1, 1, 2))
            cv2.polylines(annotated, [poly_pts], isClosed=True, color=(180, 180, 180), thickness=1)

        # 1) Seat anchoring / tracking (SeatAnchorTracker owns occlusion hold
        #    + contention resolution; we no longer duplicate that logic here).
        seat_assignments = self.seat_tracker.assign_seats(det_payload)

        for assignment in seat_assignments:
            seat_id = assignment["seat_id"]
            det_idx = assignment.get("det_index")

            if assignment["state"] in (STATE_LOST,):
                continue

            if det_idx is None:
                # OCCLUDED_HOLD: no fresh detection this frame, carry state
                # forward without evaluating anomalies against stale keypoints.
                record = {
                    "frame_id": self.frame_id, "seat_id": seat_id,
                    "status": STATUS_ABSTAIN, "confidence": 0.0,
                    "flag_reason": "OCCLUDED_HOLD",
                }
                records.append(record)
                self._draw_overlay(annotated, seat_id, assignment["bbox"], record)
                continue

            det = detections[det_idx]
            record = self._evaluate_seat(seat_id, assignment, det)
            records.append(record)
            self._draw_overlay(annotated, seat_id, det["bbox"], record)

        return annotated, records

    def _evaluate_seat(self, seat_id: str, assignment: Dict[str, Any], det: Dict[str, Any]) -> Dict[str, Any]:
        bbox = det["bbox"]
        conf = float(det.get("conf", 0.0))
        keypoints = det.get("keypoints", {})
        tier = assignment.get("tier", "A")

        # 2) Calibrated abstention gate (CalibratedAbstentionGate owns the
        #    visibility-score composite; we no longer duplicate that logic).
        visibility = self.abstention_gate.evaluate_visibility(
            seat_id=seat_id, bbox=bbox, keypoints=keypoints, tier=tier, conf=conf,
        )
        if visibility["suppress_alert"]:
            self._get_yaw_state(seat_id).yaw_sustained_frames = 0
            self.leakage_detector.reset_seat(seat_id)
            return {
                "frame_id": self.frame_id, "seat_id": seat_id, "status": STATUS_ABSTAIN,
                "confidence": round(float(visibility["visibility_score"]), 3),
                "flag_reason": visibility["reason"], "keypoints": keypoints,
            }

        # 3) Desk leakage (DeskLeakageDetector owns wrist/torso boundary
        #    excursion + its own dwell-frame gate).
        own_polygon = self.seat_tracker.seats[seat_id].polygon if seat_id in self.seat_tracker.seats else None
        neighbor_polygons = self.seat_tracker.neighbor_polygons(seat_id)
        leakage = self.leakage_detector.evaluate_leakage(
            seat_id=seat_id, keypoints=keypoints, neighbor_polygons=neighbor_polygons, own_polygon=own_polygon,
        )

        # 4) Head yaw anomaly, sustained-frame gated (kept local: it's not
        #    duplicated by any of the other 7 modules).
        yaw_state = self._get_yaw_state(seat_id)
        yaw_deg = self._estimate_head_yaw(keypoints)
        yaw_anomalous_this_frame = yaw_deg is not None and abs(yaw_deg) > self.yaw_threshold_deg
        if yaw_deg is not None:
            yaw_state.yaw_history.append(yaw_deg)
        yaw_state.yaw_sustained_frames = (
            yaw_state.yaw_sustained_frames + 1 if yaw_anomalous_this_frame else 0
        )
        yaw_flagged = yaw_state.yaw_sustained_frames >= self.yaw_sustained_frames

        if leakage["is_leaking"]:
            status = STATUS_LEAKAGE_ANOMALY
            reason = f"{leakage['leakage_type']}:{leakage['target_seat_id']}"
        elif yaw_flagged:
            status = STATUS_LEAKAGE_ANOMALY
            reason = REASON_HEAD_YAW_SUSTAINED
        else:
            status = STATUS_NORMAL
            reason = REASON_NONE

        return {
            "frame_id": self.frame_id, "seat_id": seat_id, "status": status,
            "confidence": round(float(visibility["visibility_score"]), 3),
            "flag_reason": reason, "keypoints": keypoints,
        }

    # ---- rendering ----------------------------------------------------------

    def _draw_overlay(self, frame: np.ndarray, seat_id: str, bbox, record: Dict[str, Any]) -> None:
        x1, y1, x2, y2 = [int(v) for v in bbox]
        color = STATUS_COLORS.get(record["status"], (255, 255, 255))
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        label = f"{seat_id} | {record['status']}"
        cv2.putText(frame, label, (x1, max(0, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA)
        if record["flag_reason"]:
            cv2.putText(frame, record["flag_reason"], (x1, min(frame.shape[0] - 5, y2 + 18)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1, cv2.LINE_AA)

    def _draw_banner(self, frame: np.ndarray, text: str) -> None:
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)

    # ---- FPS bookkeeping ------------------------------------------------

    def _tick_fps(self) -> None:
        now = time.time()
        dt = now - self._last_fps_ts
        self._last_fps_ts = now
        if dt > 0:
            inst = 1.0 / dt
            self.fps_estimate = inst if not self.fps_estimate else (0.9 * self.fps_estimate + 0.1 * inst)

    # ---- streaming entry point (CLI / offline video) ------------------------

    def run(
        self, video_source: Any = 0, display: bool = False, jsonl_output_path: Optional[str] = None,
    ) -> Generator[Tuple[np.ndarray, List[Dict[str, Any]]], None, None]:
        cap = cv2.VideoCapture(video_source)
        if not cap.isOpened():
            raise RuntimeError(f"Unable to open video source: {video_source}")

        jsonl_file = open(jsonl_output_path, "a") if jsonl_output_path else None
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                annotated, records = self.process_frame(frame)
                self._tick_fps()

                if jsonl_file is not None:
                    for record in records:
                        # keypoints are numpy-free tuples already, safe to serialize
                        serializable = {k: v for k, v in record.items() if k != "keypoints"}
                        jsonl_file.write(json.dumps(serializable) + "\n")
                    jsonl_file.flush()

                if display:
                    cv2.putText(annotated, f"FPS: {self.fps_estimate:.1f}", (10, annotated.shape[0] - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
                    cv2.imshow("VIGIL Behavior Pipeline", annotated)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break

                yield annotated, records
        finally:
            cap.release()
            if jsonl_file is not None:
                jsonl_file.close()
            if display:
                cv2.destroyAllWindows()

    def reset(self) -> None:
        self._yaw_states.clear()
        self.seat_tracker.reset()
        self.frame_id = 0


# --------------------------------------------------------------------------
# stream_events(): the async bridge main.py's live pipeline worker imports.
#
# This is what was MISSING from the original 8 files. main.py expects:
#     from backend.behavior_pipeline import stream_events
#     async for event in stream_events():
#         ...
# where each event is the raw-observation schema consumed by
# SeatMemoryEngine.process_frame(seat_id, keypoints, timestamp) upstream of
# CheatSyncEngine / MultiEvidenceRiskEngine. This function owns exactly that
# hand-off: it runs BehaviorPipeline against a live camera/RTSP source and
# re-shapes each per-seat record into that event schema.
#
# NOTE: this pipeline does not itself run a hand-signal/leaning-forward
# behaviour classifier (that's the separate vigil_yolo_*.pt model visible in
# your repo tree, trained via scripts/train_vigil_yolo.py) -- yolo.class is
# left as None/0.0 here. Plug that classifier's output in where marked below
# once you want main.py's yolo_class fusion term to carry real signal.
# --------------------------------------------------------------------------

async def stream_events(
    video_source: Any = 0,
    seatmap_path: str = DEFAULT_SEATMAP_PATH,
    model_path: str = DEFAULT_MODEL_PATH,
    fps_limit: Optional[float] = 30.0,
):
    pipeline = BehaviorPipeline(seatmap_path=seatmap_path, model_path=model_path)
    cap = await asyncio.to_thread(cv2.VideoCapture, video_source)
    if not cap.isOpened():
        raise RuntimeError(f"Unable to open video source: {video_source}")

    frame_interval = (1.0 / fps_limit) if fps_limit else 0.0
    try:
        while True:
            loop_start = time.time()
            ok, frame = await asyncio.to_thread(cap.read)
            if not ok:
                break

            annotated, records = await asyncio.to_thread(pipeline.process_frame, frame)
            timestamp = time.time()

            for record in records:
                if record["status"] == STATUS_ABSTAIN:
                    # Still surface the seat with empty keypoints so
                    # SeatMemoryEngine can register it as INSUFFICIENT
                    # rather than silently dropping the seat.
                    keypoints = {}
                else:
                    keypoints = record.get("keypoints", {})

                yield {
                    "seat_id": record["seat_id"],
                    "timestamp": timestamp,
                    "keypoints": keypoints,
                    # TODO: wire in vigil_yolo behaviour-classifier output here.
                    "yolo": {"class": None, "conf": 0.0},
                }

            if frame_interval:
                elapsed = time.time() - loop_start
                remaining = frame_interval - elapsed
                if remaining > 0:
                    await asyncio.sleep(remaining)
    finally:
        await asyncio.to_thread(cap.release)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="VIGIL real-time behaviour monitoring pipeline")
    parser.add_argument("--source", default=0, help="Video source: webcam index, file path, or RTSP URL")
    parser.add_argument("--seatmap", default="auto", help="Path to seatmap.json or 'auto' to generate dynamically on frame 0")
    parser.add_argument("--model", default=DEFAULT_MODEL_PATH, help="Path/name of YOLOv8n-pose weights")
    parser.add_argument("--display", action="store_true", help="Show annotated stream in a window")
    parser.add_argument("--out", default=None, help="Path to append per-frame JSONL output")
    args = parser.parse_args()

    try:
        source: Any = int(args.source)
    except (TypeError, ValueError):
        source = args.source

    pipeline = BehaviorPipeline(seatmap_path=args.seatmap, model_path=args.model)
    for _annotated_frame, _records in pipeline.run(source, display=args.display, jsonl_output_path=args.out):
        pass
