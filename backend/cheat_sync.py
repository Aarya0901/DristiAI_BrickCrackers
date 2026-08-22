"""backend/cheat_sync.py — CheatSyncEngine: spatial-temporal cross-correlation
of per-seat anomaly signals to detect collusion between neighbouring desks."""
from __future__ import annotations
import json, math
from typing import Dict, List, Optional, Sequence, Tuple
import numpy as np

EPS = 1e-6
WINDOW = 60
SYNC_THRESHOLD = 0.70
SPIKE_Z_THRESHOLD = 3.0
TIME_WINDOW_SECONDS = 1.5
DEFAULT_FPS = 30.0


def _seat_center(polygon: Sequence[Sequence[float]]) -> Tuple[float, float]:
    pts = np.asarray(polygon, dtype=np.float64)
    return float(pts[:, 0].mean()), float(pts[:, 1].mean())


class CheatSyncEngine:
    def __init__(self, seatmap_path: str = "backend/seatmap.json", fps: float = DEFAULT_FPS,
                 sync_threshold: float = SYNC_THRESHOLD, spike_z_threshold: float = SPIKE_Z_THRESHOLD,
                 time_window_seconds: float = TIME_WINDOW_SECONDS, neighbor_radius: float = 250.0) -> None:
        self.fps = fps
        self.sync_threshold = sync_threshold
        self.spike_z_threshold = spike_z_threshold
        self.time_window_frames = max(1, int(round(time_window_seconds * fps)))
        self.neighbor_radius = neighbor_radius
        self.seat_polygons: Dict[str, List[List[float]]] = {}
        self.seat_centers: Dict[str, Tuple[float, float]] = {}
        self.adjacency: Dict[str, List[str]] = {}
        self._load_seatmap(seatmap_path)

    def _load_seatmap(self, seatmap_path: str) -> None:
        try:
            with open(seatmap_path, "r") as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = {"seats": []}
        seats = data.get("seats", [])
        explicit_neighbors: Dict[str, List[str]] = {}
        for seat in seats:
            seat_id = seat["seat_id"]
            polygon = seat.get("polygon", [])
            self.seat_polygons[seat_id] = polygon
            if polygon:
                self.seat_centers[seat_id] = _seat_center(polygon)
            if "neighbors" in seat:
                explicit_neighbors[seat_id] = list(seat["neighbors"])
        if explicit_neighbors:
            self.adjacency = explicit_neighbors
        else:
            self.adjacency = self._infer_adjacency()

    def _infer_adjacency(self) -> Dict[str, List[str]]:
        adjacency: Dict[str, List[str]] = {sid: [] for sid in self.seat_centers}
        seat_ids = list(self.seat_centers.keys())
        for i, a in enumerate(seat_ids):
            ax, ay = self.seat_centers[a]
            for b in seat_ids[i + 1:]:
                bx, by = self.seat_centers[b]
                dist = math.hypot(ax - bx, ay - by)
                if dist <= self.neighbor_radius:
                    adjacency[a].append(b)
                    adjacency[b].append(a)
        return adjacency

    def _adjacent_pairs(self) -> List[Tuple[str, str]]:
        seen = set()
        pairs: List[Tuple[str, str]] = []
        for seat_a, neighbors in self.adjacency.items():
            for seat_b in neighbors:
                key = tuple(sorted((seat_a, seat_b)))
                if key not in seen:
                    seen.add(key)
                    pairs.append((seat_a, seat_b))
        return pairs

    @staticmethod
    def _pearson_sync(a: np.ndarray, b: np.ndarray) -> float:
        n = min(len(a), len(b))
        if n < 2:
            return 0.0
        a, b = a[-n:], b[-n:]
        a_mean, b_mean = a.mean(), b.mean()
        num = float(np.sum((a - a_mean) * (b - b_mean)))
        den = math.sqrt(float(np.sum((a - a_mean) ** 2)) * float(np.sum((b - b_mean) ** 2))) + EPS
        return num / den

    def _spike_frames(self, signal: np.ndarray) -> np.ndarray:
        if signal.size == 0:
            return np.array([], dtype=int)
        mean, std = signal.mean(), signal.std()
        z = np.abs(signal - mean) / (std + EPS)
        return np.where(z >= self.spike_z_threshold)[0]

    def _spikes_cooccur(self, spikes_a: np.ndarray, spikes_b: np.ndarray) -> bool:
        if spikes_a.size == 0 or spikes_b.size == 0:
            return False
        diffs = np.abs(spikes_a[:, None] - spikes_b[None, :])
        return bool(np.any(diffs <= self.time_window_frames))

    def _yaw_points_toward(self, seat_a: str, seat_b: str, yaw_vector_a) -> bool:
        if yaw_vector_a is None:
            return False
        center_a = self.seat_centers.get(seat_a)
        center_b = self.seat_centers.get(seat_b)
        if center_a is None or center_b is None:
            return False
        to_b = np.array([center_b[0] - center_a[0], center_b[1] - center_a[1]], dtype=np.float64)
        yaw_vec = np.array(yaw_vector_a, dtype=np.float64)
        norm_prod = (np.linalg.norm(to_b) * np.linalg.norm(yaw_vec)) + EPS
        if norm_prod <= EPS:
            return False
        cos_theta = float(np.dot(to_b, yaw_vec) / norm_prod)
        return cos_theta >= math.cos(math.radians(45))

    def evaluate_synchrony(self, all_seat_buffers: Dict[str, Sequence[float]],
                            yaw_vectors: Optional[Dict[str, Tuple[float, float]]] = None) -> List[Dict]:
        results: List[Dict] = []
        yaw_vectors = yaw_vectors or {}
        for seat_a, seat_b in self._adjacent_pairs():
            buf_a = all_seat_buffers.get(seat_a)
            buf_b = all_seat_buffers.get(seat_b)
            if buf_a is None or buf_b is None:
                continue
            arr_a = np.asarray(buf_a, dtype=np.float64)[-WINDOW:]
            arr_b = np.asarray(buf_b, dtype=np.float64)[-WINDOW:]
            sync_score = self._pearson_sync(arr_a, arr_b)
            spikes_a = self._spike_frames(arr_a)
            spikes_b = self._spike_frames(arr_b)
            cooccurring = self._spikes_cooccur(spikes_a, spikes_b)
            collusion = (sync_score >= self.sync_threshold) and cooccurring
            gaze_a_to_b = self._yaw_points_toward(seat_a, seat_b, yaw_vectors.get(seat_a))
            gaze_b_to_a = self._yaw_points_toward(seat_b, seat_a, yaw_vectors.get(seat_b))
            results.append({"seat_id": seat_a, "paired_seat_id": seat_b, "sync_score": float(sync_score),
                             "collusion_detected": bool(collusion), "gaze_a_to_b": bool(gaze_a_to_b),
                             "gaze_b_to_a": bool(gaze_b_to_a)})
        return results
