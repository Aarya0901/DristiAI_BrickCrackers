"""backend/desk_leakage.py — DeskLeakageDetector: geometric boundary-excursion
detection (wrist/torso/head crossing into a neighbor's desk), dwell-gated."""
from __future__ import annotations
from typing import Dict, Optional, Tuple
import numpy as np

EPS = 1e-9
DWELL_THRESHOLD_FRAMES = 30
HORIZONTAL_MARGIN_RATIO = 0.15

LEAKAGE_TYPE_WRIST = "WRIST_EXCURSION"
LEAKAGE_TYPE_LEAN = "TORSO_HEAD_INGRESS"
LEAKAGE_TYPE_NONE = "NONE"


def _point_in_polygon(point, poly: np.ndarray) -> bool:
    x, y = point
    n = len(poly)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) + EPS) + xi):
            inside = not inside
        j = i
    return inside


def _polygon_bounds(poly: np.ndarray) -> Tuple[float, float, float, float]:
    xs, ys = poly[:, 0], poly[:, 1]
    return float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max())


def _get_xy(keypoints, name: str) -> Optional[np.ndarray]:
    kp = keypoints.get(name)
    if kp is None:
        return None
    return np.array([kp[0], kp[1]], dtype=np.float64)


class _DwellState:
    __slots__ = ("frames", "target_seat_id", "leakage_type")

    def __init__(self) -> None:
        self.frames = 0
        self.target_seat_id: Optional[str] = None
        self.leakage_type = LEAKAGE_TYPE_NONE


class DeskLeakageDetector:
    def __init__(self, dwell_threshold_frames: int = DWELL_THRESHOLD_FRAMES,
                 horizontal_margin_ratio: float = HORIZONTAL_MARGIN_RATIO) -> None:
        self.dwell_threshold_frames = dwell_threshold_frames
        self.horizontal_margin_ratio = horizontal_margin_ratio
        self._dwell: Dict[str, _DwellState] = {}

    def _get_dwell(self, seat_id: str) -> _DwellState:
        state = self._dwell.get(seat_id)
        if state is None:
            state = _DwellState()
            self._dwell[seat_id] = state
        return state

    def _check_wrist_excursion(self, keypoints, own_polygon, neighbor_polygons):
        for wrist_name in ("left_wrist", "right_wrist"):
            wrist = _get_xy(keypoints, wrist_name)
            if wrist is None:
                continue
            point = (float(wrist[0]), float(wrist[1]))
            if _point_in_polygon(point, own_polygon):
                continue
            for neighbor_id, neighbor_poly in neighbor_polygons.items():
                if _point_in_polygon(point, neighbor_poly):
                    return True, neighbor_id
        return False, None

    def _check_torso_head_ingress(self, keypoints, own_polygon, neighbor_polygons):
        x_min, _, x_max, _ = _polygon_bounds(own_polygon)
        width = x_max - x_min
        if width <= 0:
            return False, None
        margin = width * self.horizontal_margin_ratio
        candidates = []
        ls, rs = _get_xy(keypoints, "left_shoulder"), _get_xy(keypoints, "right_shoulder")
        if ls is not None and rs is not None:
            candidates.append((ls + rs) / 2.0)
        nose = _get_xy(keypoints, "nose")
        if nose is not None:
            candidates.append(nose)
        for pt in candidates:
            px, py = float(pt[0]), float(pt[1])
            beyond_left = px < (x_min - margin)
            beyond_right = px > (x_max + margin)
            if not (beyond_left or beyond_right):
                continue
            for neighbor_id, neighbor_poly in neighbor_polygons.items():
                nx_min, _, nx_max, _ = _polygon_bounds(neighbor_poly)
                if (beyond_left and px >= nx_min) or (beyond_right and px <= nx_max):
                    if _point_in_polygon((px, py), neighbor_poly) or (
                        (beyond_left and nx_max >= x_min - margin) or (beyond_right and nx_min <= x_max + margin)
                    ):
                        return True, neighbor_id
        return False, None

    def evaluate_leakage(self, seat_id: str, keypoints, neighbor_polygons, own_polygon=None) -> Dict:
        neighbor_polys = {nid: np.asarray(poly, dtype=np.float64) for nid, poly in neighbor_polygons.items()}
        own_poly = np.asarray(own_polygon, dtype=np.float64) if own_polygon is not None else None
        dwell = self._get_dwell(seat_id)

        detected_type = LEAKAGE_TYPE_NONE
        detected_target: Optional[str] = None

        if own_poly is not None and own_poly.shape[0] >= 3:
            wrist_hit, wrist_target = self._check_wrist_excursion(keypoints, own_poly, neighbor_polys)
            if wrist_hit:
                detected_type = LEAKAGE_TYPE_WRIST
                detected_target = wrist_target
            else:
                lean_hit, lean_target = self._check_torso_head_ingress(keypoints, own_poly, neighbor_polys)
                if lean_hit:
                    detected_type = LEAKAGE_TYPE_LEAN
                    detected_target = lean_target

        if detected_type != LEAKAGE_TYPE_NONE:
            if dwell.target_seat_id == detected_target and dwell.leakage_type == detected_type:
                dwell.frames += 1
            else:
                dwell.frames = 1
                dwell.target_seat_id = detected_target
                dwell.leakage_type = detected_type
        else:
            dwell.frames = 0
            dwell.target_seat_id = None
            dwell.leakage_type = LEAKAGE_TYPE_NONE

        is_leaking = dwell.frames >= self.dwell_threshold_frames
        return {"seat_id": seat_id, "is_leaking": bool(is_leaking),
                "target_seat_id": dwell.target_seat_id if is_leaking else None,
                "leakage_type": dwell.leakage_type if is_leaking else LEAKAGE_TYPE_NONE,
                "dwell_frames": int(dwell.frames)}

    def reset_seat(self, seat_id: str) -> None:
        self._dwell.pop(seat_id, None)
