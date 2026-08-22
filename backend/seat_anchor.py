"""backend/seat_anchor.py — SeatAnchorTracker: static-polygon seat association.
Matches person detections to predefined desk polygons via IoA + centroid-in-
polygon tests, greedy bipartite assignment, contention flagging, occlusion hold."""
from __future__ import annotations
import json
from typing import Dict, List, Tuple
import numpy as np

try:
    from shapely.geometry import Polygon as _ShapelyPolygon
    from shapely.geometry import box as _shapely_box
    _HAS_SHAPELY = True
except ImportError:
    _HAS_SHAPELY = False

IOA_THRESHOLD = 0.20
OCCLUSION_HOLD_FRAMES = 45

STATE_TRACKED = "TRACKED"
STATE_OCCLUDED_HOLD = "OCCLUDED_HOLD"
STATE_LOST = "LOST"
STATE_CONTENTION = "SEAT_CONTENTION"


def _polygon_area(poly: np.ndarray) -> float:
    x, y = poly[:, 0], poly[:, 1]
    return float(0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))))


def _clip_polygon_with_box(poly: np.ndarray, box: Tuple[float, float, float, float]) -> np.ndarray:
    x1, y1, x2, y2 = box

    def clip_edge(points, inside_fn, intersect_fn):
        if len(points) == 0:
            return points
        output = []
        n = len(points)
        for i in range(n):
            curr = points[i]
            prev = points[i - 1]
            curr_in = inside_fn(curr)
            prev_in = inside_fn(prev)
            if curr_in:
                if not prev_in:
                    output.append(intersect_fn(prev, curr))
                output.append(curr)
            elif prev_in:
                output.append(intersect_fn(prev, curr))
        return np.array(output, dtype=np.float64) if output else np.empty((0, 2))

    pts = poly.copy()
    pts = clip_edge(pts, lambda p: p[0] >= x1, lambda a, b: _lerp_x(a, b, x1))
    pts = clip_edge(pts, lambda p: p[0] <= x2, lambda a, b: _lerp_x(a, b, x2))
    pts = clip_edge(pts, lambda p: p[1] >= y1, lambda a, b: _lerp_y(a, b, y1))
    pts = clip_edge(pts, lambda p: p[1] <= y2, lambda a, b: _lerp_y(a, b, y2))
    return pts


def _lerp_x(a, b, x):
    t = 0.0 if b[0] == a[0] else (x - a[0]) / (b[0] - a[0])
    return np.array([x, a[1] + t * (b[1] - a[1])])


def _lerp_y(a, b, y):
    t = 0.0 if b[1] == a[1] else (y - a[1]) / (b[1] - a[1])
    return np.array([a[0] + t * (b[0] - a[0]), y])


def _intersection_over_area(poly: np.ndarray, box: Tuple[float, float, float, float], poly_area: float) -> float:
    if poly_area <= 0:
        return 0.0
    if _HAS_SHAPELY:
        shp_poly = _ShapelyPolygon(poly)
        shp_box = _shapely_box(*box)
        if not shp_poly.is_valid or not shp_box.is_valid:
            return 0.0
        inter = shp_poly.intersection(shp_box).area
        return float(inter / (poly_area + 1e-9))
    clipped = _clip_polygon_with_box(poly, box)
    if clipped.shape[0] < 3:
        return 0.0
    return float(_polygon_area(clipped) / (poly_area + 1e-9))


def _point_in_polygon(point, poly: np.ndarray) -> bool:
    x, y = point
    n = len(poly)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


class _SeatDef:
    __slots__ = ("seat_id", "polygon", "tier", "bbox", "centroid", "area", "neighbors")

    def __init__(self, seat_id: str, polygon: List[List[float]], tier: str, neighbors: List[str]) -> None:
        self.seat_id = seat_id
        self.polygon = np.asarray(polygon, dtype=np.float64)
        self.tier = tier
        self.neighbors = neighbors
        xs, ys = self.polygon[:, 0], self.polygon[:, 1]
        self.bbox = (float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max()))
        self.centroid = (float(xs.mean()), float(ys.mean()))
        self.area = _polygon_area(self.polygon)


class _TrackState:
    __slots__ = ("track_id", "seat_id", "bbox", "state", "misses")

    def __init__(self, track_id: int, seat_id: str, bbox: List[float]) -> None:
        self.track_id = track_id
        self.seat_id = seat_id
        self.bbox = bbox
        self.state = STATE_TRACKED
        self.misses = 0


class SeatAnchorTracker:
    def __init__(self, seatmap_path: str = "backend/seatmap.json", ioa_threshold: float = IOA_THRESHOLD,
                 occlusion_hold_frames: int = OCCLUSION_HOLD_FRAMES) -> None:
        self.ioa_threshold = ioa_threshold
        self.occlusion_hold_frames = occlusion_hold_frames
        self.seats: Dict[str, _SeatDef] = {}
        self._load_seatmap(seatmap_path)
        self._tracks: Dict[str, _TrackState] = {}
        self._next_track_id = 1

    def _load_seatmap(self, seatmap_path: str) -> None:
        try:
            with open(seatmap_path, "r") as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = {"seats": []}
        for seat in data.get("seats", []):
            seat_id = seat["seat_id"]
            polygon = seat.get("polygon", [])
            tier = seat.get("tier", "A")
            neighbors = list(seat.get("neighbors", []))
            if len(polygon) < 3:
                continue
            self.seats[seat_id] = _SeatDef(seat_id, polygon, tier, neighbors)

    def neighbor_polygons(self, seat_id: str) -> Dict[str, np.ndarray]:
        """Polygon lookup for each configured neighbor of `seat_id` (used by DeskLeakageDetector)."""
        seat = self.seats.get(seat_id)
        if seat is None:
            return {}
        return {nid: self.seats[nid].polygon for nid in seat.neighbors if nid in self.seats}

    @staticmethod
    def _bbox_center(bbox: List[float]) -> Tuple[float, float]:
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    def _score_detection_seat(self, bbox: List[float], seat: _SeatDef) -> float:
        ioa = _intersection_over_area(seat.polygon, tuple(bbox), seat.area)
        center = self._bbox_center(bbox)
        center_inside = _point_in_polygon(center, seat.polygon)
        if ioa >= self.ioa_threshold or center_inside:
            return max(ioa, 0.5 if center_inside else 0.0)
        return 0.0

    def _greedy_assign(self, detections: List[Dict]):
        candidates: List[Tuple[float, int, str]] = []
        seat_candidates: Dict[str, List[int]] = {sid: [] for sid in self.seats}
        for i, det in enumerate(detections):
            bbox = det["bbox"]
            for seat_id, seat in self.seats.items():
                score = self._score_detection_seat(bbox, seat)
                if score > 0.0:
                    candidates.append((score, i, seat_id))
                    seat_candidates[seat_id].append(i)
        candidates.sort(key=lambda t: t[0], reverse=True)
        det_to_seat: Dict[int, str] = {}
        used_seats, used_dets = set(), set()
        for score, i, seat_id in candidates:
            if i in used_dets or seat_id in used_seats:
                continue
            det_to_seat[i] = seat_id
            used_seats.add(seat_id)
            used_dets.add(i)
        return det_to_seat, seat_candidates

    def assign_seats(self, detections: List[Dict]) -> List[Dict]:
        det_to_seat, seat_candidates = self._greedy_assign(detections)
        results: List[Dict] = []
        seen_seats: set = set()

        for det_idx, seat_id in det_to_seat.items():
            seat = self.seats[seat_id]
            bbox = detections[det_idx]["bbox"]
            track = self._tracks.get(seat_id)
            if track is None:
                track = _TrackState(self._next_track_id, seat_id, bbox)
                self._next_track_id += 1
                self._tracks[seat_id] = track
            track.bbox = bbox
            track.misses = 0
            contested = len(seat_candidates.get(seat_id, [])) > 1
            track.state = STATE_CONTENTION if contested else STATE_TRACKED
            results.append({"seat_id": seat_id, "track_id": track.track_id, "bbox": list(bbox),
                             "tier": seat.tier, "state": track.state, "det_index": det_idx})
            seen_seats.add(seat_id)

        for seat_id, track in list(self._tracks.items()):
            if seat_id in seen_seats:
                continue
            track.misses += 1
            seat = self.seats[seat_id]
            if track.misses <= self.occlusion_hold_frames:
                track.state = STATE_OCCLUDED_HOLD
                results.append({"seat_id": seat_id, "track_id": track.track_id, "bbox": list(track.bbox),
                                 "tier": seat.tier, "state": STATE_OCCLUDED_HOLD, "det_index": None})
            else:
                track.state = STATE_LOST
                del self._tracks[seat_id]
        return results

    def reset(self) -> None:
        self._tracks.clear()
        self._next_track_id = 1
