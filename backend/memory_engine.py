"""
backend/memory_engine.py

SeatMemoryEngine: per-seat rolling pose history + adaptive behaviour baseline
for the Drishti AI / VIGIL exam-proctoring pipeline.
"""
from __future__ import annotations
import math
from collections import deque
from typing import Deque, Dict, List, Optional, Tuple
import numpy as np

EPS = 1e-6
HISTORY_LEN = 90
BASELINE_FRAMES = 60
MIN_KEYPOINTS = 8
MIN_AVG_CONF = 0.40
ANOMALY_Z_THRESHOLD = 3.0

KP_INDEX = {
    "nose": 0, "left_eye": 1, "right_eye": 2, "left_ear": 3, "right_ear": 4,
    "left_shoulder": 5, "right_shoulder": 6, "left_elbow": 7, "right_elbow": 8,
    "left_wrist": 9, "right_wrist": 10, "left_hip": 11, "right_hip": 12,
}


class RunningStats:
    __slots__ = ("n", "mean", "m2")

    def __init__(self) -> None:
        self.n = 0
        self.mean = 0.0
        self.m2 = 0.0

    def update(self, x: float) -> None:
        self.n += 1
        delta = x - self.mean
        self.mean += delta / self.n
        delta2 = x - self.mean
        self.m2 += delta * delta2

    @property
    def std(self) -> float:
        if self.n < 2:
            return 0.0
        return math.sqrt(self.m2 / (self.n - 1))

    def z_score(self, x: float) -> float:
        return abs(x - self.mean) / (self.std + EPS)


class SeatState:
    __slots__ = ("history", "yaw_stats", "lean_stats", "frame_count", "prev_wrist", "prev_t")

    def __init__(self) -> None:
        self.history: Deque[Dict] = deque(maxlen=HISTORY_LEN)
        self.yaw_stats = RunningStats()
        self.lean_stats = RunningStats()
        self.frame_count = 0
        self.prev_wrist: Optional[Tuple[np.ndarray, np.ndarray]] = None
        self.prev_t: Optional[float] = None


def _get_xy(keypoints: Dict[str, Tuple[float, float, float]], name: str) -> Optional[np.ndarray]:
    kp = keypoints.get(name)
    if kp is None:
        return None
    return np.array([kp[0], kp[1]], dtype=np.float64)


def _torso_lean_angle(keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[float]:
    ls, rs = _get_xy(keypoints, "left_shoulder"), _get_xy(keypoints, "right_shoulder")
    lh, rh = _get_xy(keypoints, "left_hip"), _get_xy(keypoints, "right_hip")
    if ls is None or rs is None or lh is None or rh is None:
        return None
    shoulder_mid = (ls + rs) / 2.0
    hip_mid = (lh + rh) / 2.0
    spine = shoulder_mid - hip_mid
    vertical = np.array([0.0, -1.0])
    denom = (np.linalg.norm(spine) * np.linalg.norm(vertical)) + EPS
    cos_theta = np.clip(np.dot(spine, vertical) / denom, -1.0, 1.0)
    return math.degrees(math.acos(cos_theta))


def _head_yaw_ratio(keypoints: Dict[str, Tuple[float, float, float]]) -> Optional[float]:
    nose = _get_xy(keypoints, "nose")
    l_ear = _get_xy(keypoints, "left_ear")
    r_ear = _get_xy(keypoints, "right_ear")
    if nose is None or l_ear is None or r_ear is None:
        return None
    d_left = abs(nose[0] - l_ear[0])
    d_right = abs(nose[0] - r_ear[0])
    return d_left / (d_right + EPS)


def _wrist_speed(keypoints, prev_wrist, dt):
    lw = _get_xy(keypoints, "left_wrist")
    rw = _get_xy(keypoints, "right_wrist")
    if lw is None or rw is None:
        return 0.0, prev_wrist
    current = (lw, rw)
    if prev_wrist is None or dt <= 0:
        return 0.0, current
    prev_lw, prev_rw = prev_wrist
    d_left = float(np.linalg.norm(lw - prev_lw))
    d_right = float(np.linalg.norm(rw - prev_rw))
    speed = ((d_left + d_right) / 2.0) / dt
    return speed, current


def _visible_keypoints(keypoints, conf_threshold: float = 0.0) -> Tuple[int, float]:
    confs = [kp[2] for kp in keypoints.values() if kp is not None and kp[2] >= conf_threshold]
    count = len(confs)
    avg_conf = float(np.mean(confs)) if confs else 0.0
    return count, avg_conf


class SeatMemoryEngine:
    def __init__(self, history_len: int = HISTORY_LEN, baseline_frames: int = BASELINE_FRAMES,
                 min_keypoints: int = MIN_KEYPOINTS, min_avg_conf: float = MIN_AVG_CONF,
                 anomaly_threshold: float = ANOMALY_Z_THRESHOLD) -> None:
        self.history_len = history_len
        self.baseline_frames = baseline_frames
        self.min_keypoints = min_keypoints
        self.min_avg_conf = min_avg_conf
        self.anomaly_threshold = anomaly_threshold
        self._seats: Dict[str, SeatState] = {}

    def _get_state(self, seat_id: str) -> SeatState:
        state = self._seats.get(seat_id)
        if state is None:
            state = SeatState()
            state.history = deque(maxlen=self.history_len)
            self._seats[seat_id] = state
        return state

    def process_frame(self, seat_id: str, keypoints, timestamp: float) -> Dict:
        state = self._get_state(seat_id)
        state.frame_count += 1

        n_visible, avg_conf = _visible_keypoints(keypoints)
        insufficient = (n_visible < self.min_keypoints) or (avg_conf < self.min_avg_conf)

        lean_angle = _torso_lean_angle(keypoints)
        yaw_ratio = _head_yaw_ratio(keypoints)

        dt = 0.0 if state.prev_t is None else max(timestamp - state.prev_t, EPS)
        wrist_speed, state.prev_wrist = _wrist_speed(keypoints, state.prev_wrist, dt)
        state.prev_t = timestamp

        if insufficient:
            frame_entry = {
                "torso_lean_angle": lean_angle if lean_angle is not None else 0.0,
                "head_yaw_ratio": yaw_ratio if yaw_ratio is not None else 0.0,
                "wrist_speed": wrist_speed,
            }
            state.history.append(frame_entry)
            return {"seat_id": seat_id, "z_yaw": 0.0, "z_lean": 0.0, "wrist_speed": wrist_speed,
                    "visibility": "INSUFFICIENT", "is_anomaly": False}

        lean_val = lean_angle if lean_angle is not None else 0.0
        yaw_val = yaw_ratio if yaw_ratio is not None else 0.0

        frame_entry = {"torso_lean_angle": lean_val, "head_yaw_ratio": yaw_val, "wrist_speed": wrist_speed}
        state.history.append(frame_entry)

        state.lean_stats.update(lean_val)
        state.yaw_stats.update(yaw_val)

        if state.frame_count <= self.baseline_frames:
            z_yaw = 0.0
            z_lean = 0.0
        else:
            z_yaw = state.yaw_stats.z_score(yaw_val)
            z_lean = state.lean_stats.z_score(lean_val)

        is_anomaly = (z_yaw >= self.anomaly_threshold) or (z_lean >= self.anomaly_threshold)

        return {"seat_id": seat_id, "z_yaw": float(z_yaw), "z_lean": float(z_lean),
                "wrist_speed": float(wrist_speed), "visibility": "OK", "is_anomaly": bool(is_anomaly)}

    def get_history(self, seat_id: str) -> List[Dict]:
        state = self._seats.get(seat_id)
        if state is None:
            return []
        return list(state.history)

    def get_anomaly_series(self, seat_id: str, field: str = "head_yaw_ratio") -> np.ndarray:
        history = self.get_history(seat_id)
        return np.array([entry[field] for entry in history], dtype=np.float64)

    def reset_seat(self, seat_id: str) -> None:
        self._seats.pop(seat_id, None)

    def seats(self) -> List[str]:
        return list(self._seats.keys())
