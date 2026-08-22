"""backend/calibrated_abstention.py — CalibratedAbstentionGate: composite
visibility scoring; forces ABSTAIN instead of alerting under occlusion,
low resolution, or poor camera perspective."""
from __future__ import annotations
from typing import Dict, List, Optional, Tuple

W_KEYPOINT_COMPLETENESS = 0.40
W_BBOX_QUALITY = 0.30
W_RESOLUTION_TIER = 0.30
VISIBILITY_THRESHOLD = 0.40
KEYPOINT_CONF_THRESHOLD = 0.35

UPPER_BODY_KEYPOINTS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist",
]

REFERENCE_BBOX_AREA = 220.0 * 440.0
MIN_FACE_WIDTH_PX = 20.0
TIER_BASE_PENALTY = {"A": 1.00, "B": 0.85, "C": 0.65}
OCCLUSION_OVERLAP_THRESHOLD = 0.50

STATUS_ABSTAIN = "ABSTAIN"
STATUS_PROCEED = "PROCEED"
REASON_VISIBILITY_INSUFFICIENT = "VISIBILITY_INSUFFICIENT"
REASON_TRANSIENT_OCCLUSION = "TRANSIENT_OCCLUSION"
REASON_NONE = "NONE"


def _bbox_area(bbox: List[float]) -> float:
    x1, y1, x2, y2 = bbox
    return max(0.0, x2 - x1) * max(0.0, y2 - y1)


def _bbox_overlap_ratio(bbox: List[float], other_bbox: List[float]) -> float:
    ax1, ay1, ax2, ay2 = bbox
    bx1, by1, bx2, by2 = other_bbox
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
    inter = iw * ih
    own_area = _bbox_area(bbox)
    if own_area <= 0:
        return 0.0
    return inter / own_area


def _keypoint_completeness(keypoints, conf_threshold: float = KEYPOINT_CONF_THRESHOLD) -> float:
    if not UPPER_BODY_KEYPOINTS:
        return 0.0
    visible = 0
    for name in UPPER_BODY_KEYPOINTS:
        kp = keypoints.get(name)
        if kp is not None and len(kp) >= 3 and kp[2] >= conf_threshold:
            visible += 1
    return visible / len(UPPER_BODY_KEYPOINTS)


def _resolution_tier_score(bbox: List[float], tier: str) -> float:
    area = _bbox_area(bbox)
    area_ratio = min(area / (REFERENCE_BBOX_AREA + 1e-9), 1.0)
    bbox_width = max(0.0, bbox[2] - bbox[0])
    approx_face_width = bbox_width * 0.35
    face_penalty = 1.0 if approx_face_width >= MIN_FACE_WIDTH_PX else max(0.0, approx_face_width / MIN_FACE_WIDTH_PX)
    tier_base = TIER_BASE_PENALTY.get(tier, 0.75)
    return float(area_ratio * face_penalty * tier_base)


class CalibratedAbstentionGate:
    def __init__(self, w_keypoint: float = W_KEYPOINT_COMPLETENESS, w_bbox: float = W_BBOX_QUALITY,
                 w_resolution: float = W_RESOLUTION_TIER, visibility_threshold: float = VISIBILITY_THRESHOLD,
                 occlusion_overlap_threshold: float = OCCLUSION_OVERLAP_THRESHOLD) -> None:
        self.w_keypoint = w_keypoint
        self.w_bbox = w_bbox
        self.w_resolution = w_resolution
        self.visibility_threshold = visibility_threshold
        self.occlusion_overlap_threshold = occlusion_overlap_threshold

    def compute_visibility_score(self, bbox, conf, keypoints, tier) -> float:
        completeness = _keypoint_completeness(keypoints)
        bbox_quality = max(0.0, min(conf, 1.0))
        resolution_score = _resolution_tier_score(bbox, tier)
        score = self.w_keypoint * completeness + self.w_bbox * bbox_quality + self.w_resolution * resolution_score
        return float(max(0.0, min(score, 1.0)))

    def _detect_transient_occlusion(self, bbox, occluder_bboxes: Optional[List[List[float]]]) -> bool:
        if not occluder_bboxes:
            return False
        for occluder in occluder_bboxes:
            if _bbox_overlap_ratio(bbox, occluder) >= self.occlusion_overlap_threshold:
                return True
        return False

    def evaluate_visibility(self, seat_id: str, bbox: List[float], keypoints, tier: str, conf: float = 1.0,
                             occluder_bboxes: Optional[List[List[float]]] = None) -> Dict:
        if self._detect_transient_occlusion(bbox, occluder_bboxes):
            return {"seat_id": seat_id, "decision": STATUS_ABSTAIN, "visibility_score": 0.0,
                    "suppress_alert": True, "reason": REASON_TRANSIENT_OCCLUSION}

        visibility_score = self.compute_visibility_score(bbox, conf, keypoints, tier)

        if visibility_score < self.visibility_threshold:
            return {"seat_id": seat_id, "decision": STATUS_ABSTAIN, "visibility_score": visibility_score,
                    "suppress_alert": True, "reason": REASON_VISIBILITY_INSUFFICIENT}

        return {"seat_id": seat_id, "decision": STATUS_PROCEED, "visibility_score": visibility_score,
                "suppress_alert": False, "reason": REASON_NONE}
