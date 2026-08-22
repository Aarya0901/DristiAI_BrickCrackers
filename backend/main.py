"""
backend/main.py

FastAPI streaming server for the Drishti AI / VIGIL exam-proctoring demo.

- GET  /api/seats     -> seat polygons + metadata from seatmap.json
- GET  /api/health     -> pipeline status / FPS / active seat count
- WS   /ws/alerts      -> live Explainable Behaviour Card broadcast
- Background worker    -> replays demo events (or consumes live pipeline
                          events via backend.behavior_pipeline.stream_events)
                          through memory_engine -> cheat_sync -> risk_engine
                          and broadcasts validated alerts.
- SQLite persistence   -> every broadcast alert is logged to drishti.db.
"""
from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import time
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.memory_engine import SeatMemoryEngine
from backend.cheat_sync import CheatSyncEngine
from backend.risk_engine import MultiEvidenceRiskEngine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEATMAP_PATH = os.path.join(BASE_DIR, "seatmap.json")
DEMO_EVENTS_PATH = os.path.join(BASE_DIR, "out_phase4_events.json")
DB_PATH = os.path.join(BASE_DIR, "drishti.db")

TARGET_FPS = 30.0
FRAME_INTERVAL = 1.0 / TARGET_FPS


def init_db(db_path: str = DB_PATH) -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY, created_at REAL NOT NULL, seat TEXT NOT NULL,
                paired_seat TEXT, behaviour TEXT, severity TEXT, risk_score REAL,
                confidence REAL, video_timestamp TEXT, counterfactual TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def log_alert(card: Dict[str, Any], db_path: str = DB_PATH) -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO alerts
                (id, created_at, seat, paired_seat, behaviour, severity,
                 risk_score, confidence, video_timestamp, counterfactual)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (card["id"], time.time(), card["seat"], card.get("pairedSeat"), card.get("behaviour"),
             card.get("severity"), card.get("riskScore"), card.get("confidence"),
             card.get("timestamp"), card.get("counterfactual")),
        )
        conn.commit()
    finally:
        conn.close()


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        message = json.dumps(payload)
        dead: List[WebSocket] = []
        async with self._lock:
            targets = list(self._connections)
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)


manager = ConnectionManager()


class PipelineState:
    def __init__(self) -> None:
        self.memory_engine = SeatMemoryEngine()
        self.cheat_sync_engine: Optional[CheatSyncEngine] = None
        self.risk_engine = MultiEvidenceRiskEngine()
        self.mode = "demo"
        self.running = False
        self.fps = 0.0
        self.active_seats: Set[str] = set()
        self.frames_processed = 0
        self.last_frame_time = time.time()
        self._fusion_signal_buffers: Dict[str, List[float]] = {}

    def load_seatmap(self) -> Dict[str, Any]:
        try:
            with open(SEATMAP_PATH, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {"seats": []}

    def record_fps(self) -> None:
        now = time.time()
        dt = now - self.last_frame_time
        self.last_frame_time = now
        if dt > 0:
            instantaneous = 1.0 / dt
            self.fps = (0.9 * self.fps) + (0.1 * instantaneous) if self.fps else instantaneous
        self.frames_processed += 1


state = PipelineState()


def _load_demo_events() -> List[Dict[str, Any]]:
    try:
        with open(DEMO_EVENTS_PATH, "r") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data.get("events", [])
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        return []


async def _live_event_source():
    """
    Yields live camera events if a camera/video source is actually openable.
    Falls back to nothing (caller drops to demo mode) if stream_events can't
    open a source -- importing the module successfully is not the same as a
    camera being present, so this guards on the runtime error, not just the
    import.
    """
    try:
        from backend.behavior_pipeline import stream_events  # type: ignore
    except ImportError:
        return
    try:
        async for event in stream_events():
            yield event
    except RuntimeError:
        return


async def _demo_event_source():
    events = _load_demo_events()
    if not events:
        seatmap = state.load_seatmap()
        seat_ids = [s["seat_id"] for s in seatmap.get("seats", [])] or ["A1", "A2"]
        t = 0
        while True:
            for sid in seat_ids:
                yield {"seat_id": sid, "timestamp": t / TARGET_FPS, "keypoints": {},
                       "yolo": {"class": None, "conf": 0.0}}
            t += 1
            await asyncio.sleep(FRAME_INTERVAL)
    else:
        while True:
            for event in events:
                yield event
                await asyncio.sleep(FRAME_INTERVAL)


def _fused_signal(z_yaw: float, z_lean: float) -> float:
    return max(z_yaw, z_lean)


async def _process_event(event: Dict[str, Any]) -> None:
    seat_id = event.get("seat_id")
    if not seat_id:
        return

    state.active_seats.add(seat_id)
    timestamp = event.get("timestamp", time.time())
    keypoints = event.get("keypoints", {}) or {}
    yolo = event.get("yolo", {}) or {}

    pose_result = state.memory_engine.process_frame(seat_id, keypoints, timestamp)

    buf = state._fusion_signal_buffers.setdefault(seat_id, [])
    buf.append(_fused_signal(pose_result["z_yaw"], pose_result["z_lean"]))
    if len(buf) > 90:
        del buf[: len(buf) - 90]

    sync_results = []
    if state.cheat_sync_engine is not None:
        sync_results = state.cheat_sync_engine.evaluate_synchrony(state._fusion_signal_buffers)

    best_sync = 0.0
    paired_seat = None
    for r in sync_results:
        if r["seat_id"] == seat_id or r["paired_seat_id"] == seat_id:
            if r["sync_score"] > best_sync:
                best_sync = r["sync_score"]
                paired_seat = r["paired_seat_id"] if r["seat_id"] == seat_id else r["seat_id"]

    yolo_conf = float(yolo.get("conf", 0.0) or 0.0)
    yolo_class = yolo.get("class")
    z_pose = max(pose_result["z_yaw"], pose_result["z_lean"])

    card = state.risk_engine.evaluate(
        seat=seat_id, z_pose=z_pose, cheat_sync_score=best_sync, yolo_conf=yolo_conf,
        paired_seat=paired_seat, yolo_class=yolo_class, elapsed_seconds=timestamp,
    )

    if card is not None:
        log_alert(card)
        await manager.broadcast({"type": "alert", "data": card})

    state.record_fps()


async def _pipeline_worker() -> None:
    state.running = True
    try:
        state.cheat_sync_engine = CheatSyncEngine(seatmap_path=SEATMAP_PATH)
    except Exception:
        state.cheat_sync_engine = None

    live_available = False
    try:
        from backend.behavior_pipeline import stream_events  # noqa: F401
        live_available = True
    except ImportError:
        live_available = False

    try:
        if live_available:
            state.mode = "live"
            got_any_live_event = False
            async for event in _live_event_source():
                got_any_live_event = True
                await _process_event(event)
            if not got_any_live_event:
                # No camera/video source was actually openable -- drop to demo.
                state.mode = "demo"
                async for event in _demo_event_source():
                    await _process_event(event)
        else:
            state.mode = "demo"
            async for event in _demo_event_source():
                await _process_event(event)
    except asyncio.CancelledError:
        pass
    finally:
        state.running = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    worker_task = asyncio.create_task(_pipeline_worker())
    try:
        yield
    finally:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="VIGIL / Drishti AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    mode: str
    fps: float
    active_seats: int
    frames_processed: int


@app.get("/api/seats")
async def get_seats() -> Dict[str, Any]:
    return state.load_seatmap()


@app.get("/api/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    return HealthResponse(
        status="running" if state.running else "stopped", mode=state.mode,
        fps=round(state.fps, 2), active_seats=len(state.active_seats),
        frames_processed=state.frames_processed,
    )


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
