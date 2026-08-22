"""backend/risk_engine.py — MultiEvidenceRiskEngine: fuses pose-anomaly,
collusion-sync, and YOLO detector evidence into a persistence-gated risk
score, emitting explainable Behaviour Cards."""
from __future__ import annotations
import time, uuid
from dataclasses import dataclass, field
from typing import Dict, Optional

W_POSE = 0.45
W_SYNC = 0.35
W_YOLO = 0.20
RISK_THRESHOLD = 0.70
PERSISTENCE_SECONDS = 1.5
POSE_Z_CAP = 6.0
SEVERITY_HIGH = 0.85
SEVERITY_MEDIUM = 0.70


@dataclass
class _PendingAlert:
    seat: str
    paired_seat: Optional[str]
    first_seen: float
    last_seen: float
    peak_risk: float
    peak_evidence: Dict[str, float] = field(default_factory=dict)
    validated: bool = False


def _normalize_pose_z(z_pose: float, cap: float = POSE_Z_CAP) -> float:
    if z_pose <= 0:
        return 0.0
    return min(z_pose / cap, 1.0)


def _severity_from_risk(risk: float) -> str:
    if risk >= SEVERITY_HIGH:
        return "high"
    if risk >= SEVERITY_MEDIUM:
        return "medium"
    return "low"


def _format_timestamp(seconds: float) -> str:
    seconds = max(0, int(seconds))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _behaviour_label(sync_score: float, z_pose: float, yolo_class: Optional[str]) -> str:
    if yolo_class == "hand_signal" and sync_score >= 0.70:
        return "Reciprocal attention / Reaching pattern"
    if yolo_class == "hand_signal":
        return "Hand-signal gesture detected"
    if yolo_class == "leaning_forward":
        return "Sustained forward lean toward neighbor"
    if sync_score >= 0.70:
        return "Reciprocal attention / Synchronized anomaly"
    if z_pose >= 3.0:
        return "Sustained behavioural deviation from personal baseline"
    return "Elevated attention anomaly"


class MultiEvidenceRiskEngine:
    def __init__(self, w_pose: float = W_POSE, w_sync: float = W_SYNC, w_yolo: float = W_YOLO,
                 risk_threshold: float = RISK_THRESHOLD, persistence_seconds: float = PERSISTENCE_SECONDS) -> None:
        self.w_pose = w_pose
        self.w_sync = w_sync
        self.w_yolo = w_yolo
        self.risk_threshold = risk_threshold
        self.persistence_seconds = persistence_seconds
        self._pending: Dict[str, _PendingAlert] = {}

    def compute_risk(self, z_pose: float, cheat_sync_score: float, yolo_conf: float) -> float:
        z_pose_norm = _normalize_pose_z(z_pose)
        sync_norm = max(0.0, min(cheat_sync_score, 1.0))
        yolo_norm = max(0.0, min(yolo_conf, 1.0))
        risk = self.w_pose * z_pose_norm + self.w_sync * sync_norm + self.w_yolo * yolo_norm
        return float(risk)

    def evaluate(self, seat: str, z_pose: float, cheat_sync_score: float, yolo_conf: float,
                 paired_seat: Optional[str] = None, yolo_class: Optional[str] = None,
                 counterfactual_hint: Optional[str] = None, now: Optional[float] = None,
                 elapsed_seconds: Optional[float] = None) -> Optional[Dict]:
        now = time.time() if now is None else now
        elapsed_seconds = now if elapsed_seconds is None else elapsed_seconds
        risk = self.compute_risk(z_pose, cheat_sync_score, yolo_conf)
        pending = self._pending.get(seat)

        if risk < self.risk_threshold:
            self._pending.pop(seat, None)
            return None

        if pending is None:
            pending = _PendingAlert(seat=seat, paired_seat=paired_seat, first_seen=now, last_seen=now, peak_risk=risk)
            self._pending[seat] = pending
        else:
            pending.last_seen = now
            pending.paired_seat = paired_seat or pending.paired_seat

        if risk > pending.peak_risk:
            pending.peak_risk = risk
            pending.peak_evidence = {"z_pose": z_pose, "cheat_sync_score": cheat_sync_score,
                                      "yolo_conf": yolo_conf, "yolo_class": yolo_class}

        duration = pending.last_seen - pending.first_seen
        if duration < self.persistence_seconds or pending.validated:
            return None

        pending.validated = True
        return self._build_card(pending, elapsed_seconds, duration, counterfactual_hint)

    def _build_card(self, pending: _PendingAlert, elapsed_seconds: float, duration: float,
                     counterfactual_hint: Optional[str]) -> Dict:
        evidence = pending.peak_evidence or {}
        z_pose = evidence.get("z_pose", 0.0)
        sync_score = evidence.get("cheat_sync_score", 0.0)
        yolo_conf = evidence.get("yolo_conf", 0.0)
        yolo_class = evidence.get("yolo_class")
        risk = pending.peak_risk
        severity = _severity_from_risk(risk)
        confidence = max(0.0, min(1.0, (0.6 * (1 - 1 / (1 + z_pose))) + (0.4 * yolo_conf) + 0.1))
        confidence = max(0.0, min(confidence, 1.0))
        counterfactual = counterfactual_hint or (
            f"Sustained head yaw toward neighbor exceeded personal baseline by {z_pose:.1f} sigma for {duration:.1f}s.")
        return {
            "id": f"alert-{uuid.uuid4()}", "seat": pending.seat, "pairedSeat": pending.paired_seat,
            "behaviour": _behaviour_label(sync_score, z_pose, yolo_class), "severity": severity,
            "riskScore": round(risk, 2), "confidence": round(confidence, 2),
            "timestamp": _format_timestamp(elapsed_seconds), "counterfactual": counterfactual,
        }

    def reset_seat(self, seat: str) -> None:
        self._pending.pop(seat, None)
