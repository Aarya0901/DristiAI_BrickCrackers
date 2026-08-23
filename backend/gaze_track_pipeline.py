"""
VIGIL backend - Phase 3: wires Gaze-LLE onto the tracked pipeline (Phase 2).

For each tracked person, derives a head bbox from RTMPose facial keypoints (nose/eyes/ears,
falling back to a top-of-bbox estimate for rear-view heads with no confident facial keypoints),
runs Gaze-LLE at a reduced keyframe cadence (4-6 Hz per spec §13A.5, not every frame - the scene
encode is the expensive part), and projects each person's gaze heatmap onto the seat polygons to
get per-seat gaze-mass (§13A.2): gaze_mass_i(seat) = fraction of person i's (normalized) attention
heatmap that falls inside that seat's polygon.

Between keyframes, the last computed gaze result for each track is carried forward for the overlay
(marked non_keyframe in the JSON) rather than faked with new inference.

Output: video with skeleton + seat zones + gaze beams, JSON event stream extended with gaze_mass /
peak_target / inout, and an end-of-run desk-leakage aggregate (proof-of-concept of §13A.3-D1: how
much *foreign* attention each seat received over the whole clip).

LICENSE: YOLO11 (ultralytics) is AGPL-3.0 - prototyping only, see PHASE1-2 report for the
production swap plan (RT-DETR, Apache-2.0). ByteTrack (MIT), RTMPose (Apache-2.0), Gaze-LLE (MIT).
"""
import json
import sys
import time
from collections import defaultdict

import cv2
import numpy as np
import supervision as sv
import torch
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR / "gazelle_repo"))
from gazelle.model import get_gazelle_model

VIDEO_IN = str(BACKEND_DIR / "test_video_raw.mp4")
VIDEO_OUT = str(BACKEND_DIR / "out_phase3_gaze.mp4")
JSON_OUT = str(BACKEND_DIR / "out_phase3_events.json")
SEATMAP_PATH = str(BACKEND_DIR / "seatmap.json")

RTMPOSE_M_URL = (
    "https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/"
    "rtmpose-m_simcc-body7_pt-body7_420e-256x192-e48f03d0_20230504.zip"
)
GAZELLE_CKPT_URL = "https://github.com/fkryan/gazelle/releases/download/v1.0.0/gazelle_dinov2_vitb14_inout.pt"

PERSON_CLASS_ID = 0
DET_CONF_THRES = 0.4
DEVICE = "cuda"
MIN_SEAT_OVERLAP_FRAC = 0.15
GAZE_STRIDE = 5  # ~5Hz on a 25fps video, per spec's 4-6Hz keyframe cadence recommendation
FACE_KPT_IDXS = [0, 1, 2, 3, 4]  # COCO: nose, l_eye, r_eye, l_ear, r_ear
SHOULDER_KPT_IDXS = [5, 6]

SEAT_COLORS = [(255, 128, 0), (0, 200, 255), (255, 0, 200), (128, 255, 0), (0, 128, 255)]


def load_seatmap(path):
    with open(path) as f:
        data = json.load(f)
    return [{"seat_id": s["seat_id"], "polygon": Polygon(s["polygon"]), "polygon_pts": s["polygon"]} for s in data["seats"]]


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
        frac = person_box.intersection(seat["polygon"]).area / person_area
        if frac > best_frac:
            best_frac, best_seat = frac, seat["seat_id"]
    if best_frac < MIN_SEAT_OVERLAP_FRAC:
        return None, best_frac
    return best_seat, best_frac


def seat_masks_64(seats, frame_w, frame_h, grid=64):
    """Rasterize each seat polygon into the 64x64 heatmap grid, once, at startup."""
    masks = {}
    sx, sy = grid / frame_w, grid / frame_h
    for seat in seats:
        pts = np.array([[x * sx, y * sy] for x, y in seat["polygon_pts"]], dtype=np.int32)
        m = np.zeros((grid, grid), dtype=np.uint8)
        cv2.fillPoly(m, [pts], 1)
        masks[seat["seat_id"]] = m.astype(bool)
    return masks


def head_bbox_from_keypoints(kpts, kscores, body_bbox, kpt_thr=0.3):
    """Head bbox from facial keypoints; falls back to top-of-bbox estimate for rear-view heads."""
    x1, y1, x2, y2 = body_bbox
    bw, bh = x2 - x1, y2 - y1

    face_pts = [kpts[i] for i in FACE_KPT_IDXS if kscores[i] > kpt_thr]
    if face_pts:
        face_pts = np.array(face_pts)
        cx, cy = face_pts.mean(axis=0)
        if kscores[5] > kpt_thr and kscores[6] > kpt_thr:
            shoulder_w = abs(kpts[5][0] - kpts[6][0])
            head_r = max(shoulder_w * 0.45, bh * 0.08)
        else:
            head_r = bh * 0.12
        return [cx - head_r, cy - head_r, cx + head_r, cy + head_r], "keypoints"

    # rear-view fallback: top ~20% of body bbox, narrowed to ~55% of body width, centered
    head_h = bh * 0.20
    head_w = bw * 0.55
    cx = (x1 + x2) / 2
    return [cx - head_w / 2, y1, cx + head_w / 2, y1 + head_h], "fallback_top"


def main():
    seats = load_seatmap(SEATMAP_PATH)
    print(f"loaded {len(seats)} seats")

    print("loading YOLO11-s (AGPL-3.0)...")
    yolo_weights = str(BACKEND_DIR / "yolo11s.pt") if (BACKEND_DIR / "yolo11s.pt").exists() else "yolo11s.pt"
    yolo = YOLO(yolo_weights)
    print("loading RTMPose-m (Apache-2.0)...")
    pose_model = RTMPose(onnx_model=RTMPOSE_M_URL, model_input_size=(192, 256), backend="onnxruntime", device=DEVICE)
    tracker = sv.ByteTrack()

    print("loading Gaze-LLE ViT-B (MIT)...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    gaze_model, gaze_transform = get_gazelle_model("gazelle_dinov2_vitb14_inout")
    state_dict = torch.hub.load_state_dict_from_url(GAZELLE_CKPT_URL, map_location=device)
    gaze_model.load_gazelle_state_dict(state_dict)
    gaze_model.to(device).eval()

    cap = cv2.VideoCapture(VIDEO_IN)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"input: {w}x{h} @ {fps}fps, {n_frames} frames, gaze every {GAZE_STRIDE} frames (~{fps/GAZE_STRIDE:.1f}Hz)")

    seat_masks = seat_masks_64(seats, w, h)
    seat_ids_order = list(seat_masks.keys())

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(VIDEO_OUT, fourcc, fps, (w, h))

    last_gaze_by_track = {}  # track_id -> {"peak_px":[x,y], "gaze_mass":{seat:val}, "inout":float}
    desk_leakage = defaultdict(float)  # seat_id -> cumulative foreign gaze-mass over the whole clip
    event_stream = []
    frame_idx = 0
    t_start = time.time()

    while cap.isOpened():
        ok, frame = cap.read()
        if not ok:
            break
        timestamp_s = frame_idx / fps

        det = yolo.predict(frame, classes=[PERSON_CLASS_ID], conf=DET_CONF_THRES, verbose=False)[0]
        if len(det.boxes):
            xyxy, confs = det.boxes.xyxy.cpu().numpy(), det.boxes.conf.cpu().numpy()
        else:
            xyxy, confs = np.empty((0, 4)), np.empty((0,))

        detections = sv.Detections(xyxy=xyxy, confidence=confs, class_id=np.zeros(len(xyxy), dtype=int))
        tracked = tracker.update_with_detections(detections)

        if len(tracked) > 0:
            keypoints, kscores = pose_model(frame, bboxes=tracked.xyxy)
        else:
            keypoints, kscores = np.empty((0, 17, 2)), np.empty((0, 17))

        is_keyframe = (frame_idx % GAZE_STRIDE == 0) and len(tracked) > 0
        head_bboxes, head_sources, seat_ids, overlap_fracs = [], [], [], []

        for i in range(len(tracked)):
            hb, src = head_bbox_from_keypoints(keypoints[i], kscores[i], tracked.xyxy[i])
            head_bboxes.append(hb)
            head_sources.append(src)
            seat_id, frac = snap_to_seat(tracked.xyxy[i], seats)
            seat_ids.append(seat_id)
            overlap_fracs.append(frac)

        if is_keyframe:
            norm_boxes = [(x1 / w, y1 / h, x2 / w, y2 / h) for x1, y1, x2, y2 in head_bboxes]
            img_tensor = gaze_transform(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).unsqueeze(0).to(device)
            with torch.no_grad():
                gaze_out = gaze_model({"images": img_tensor, "bboxes": [norm_boxes]})

            for i in range(len(tracked)):
                heatmap = gaze_out["heatmap"][0][i].cpu().numpy()
                heatmap = heatmap / (heatmap.sum() + 1e-8)
                inout = float(gaze_out["inout"][0][i]) if gaze_out["inout"] is not None else None

                peak_idx = int(np.argmax(heatmap))
                py, px = divmod(peak_idx, heatmap.shape[1])
                peak_px = [round(px / heatmap.shape[1] * w, 1), round(py / heatmap.shape[0] * h, 1)]

                gaze_mass = {sid: round(float(heatmap[seat_masks[sid]].sum()), 4) for sid in seat_ids_order}

                track_id = int(tracked.tracker_id[i])
                last_gaze_by_track[track_id] = {"peak_px": peak_px, "gaze_mass": gaze_mass, "inout": inout}

                own_seat = seat_ids[i]
                for sid, mass in gaze_mass.items():
                    if sid != own_seat:
                        desk_leakage[sid] += mass

        img_show = frame.copy()
        overlay = img_show.copy()
        for si, seat in enumerate(seats):
            pts = np.array(seat["polygon_pts"], dtype=np.int32)
            color = SEAT_COLORS[si % len(SEAT_COLORS)]
            cv2.fillPoly(overlay, [pts], color)
            cv2.polylines(img_show, [pts], True, color, 2)
            cx, cy = pts.mean(axis=0).astype(int)
            cv2.putText(img_show, f"seat {seat['seat_id']}", (cx - 40, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2, cv2.LINE_AA)
        cv2.addWeighted(overlay, 0.10, img_show, 0.90, 0, dst=img_show)

        img_show = draw_skeleton(img_show, keypoints, kscores, kpt_thr=0.3)

        frame_people = []
        for i in range(len(tracked)):
            track_id = int(tracked.tracker_id[i])
            bbox = tracked.xyxy[i]
            x1, y1, x2, y2 = bbox.astype(int)
            seat_id = seat_ids[i]

            cv2.rectangle(img_show, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"id{track_id}" + (f" -> {seat_id}" if seat_id else " (unassigned)")
            cv2.putText(img_show, label, (x1, max(0, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2, cv2.LINE_AA)

            hb = head_bboxes[i]
            head_cx, head_cy = (hb[0] + hb[2]) / 2, (hb[1] + hb[3]) / 2
            gaze_info = last_gaze_by_track.get(track_id)
            if gaze_info:
                px, py = gaze_info["peak_px"]
                cv2.line(img_show, (int(head_cx), int(head_cy)), (int(px), int(py)), (0, 0, 255), 2)
                cv2.circle(img_show, (int(px), int(py)), 5, (0, 0, 255), 2)

            frame_people.append({
                "frame_idx": frame_idx,
                "timestamp_s": round(timestamp_s, 3),
                "track_id": track_id,
                "seat_id": seat_id,
                "seat_overlap_frac": round(float(overlap_fracs[i]), 3),
                "bbox_xyxy": [round(float(v), 1) for v in bbox],
                "head_bbox_xyxy": [round(v, 1) for v in hb],
                "head_bbox_source": head_sources[i],
                "keypoints": [[round(float(x), 1), round(float(y), 1)] for x, y in keypoints[i]],
                "keypoint_scores": [round(float(s), 3) for s in kscores[i]],
                "gaze": {
                    "is_keyframe": is_keyframe,
                    **(gaze_info if gaze_info else {}),
                },
            })

        event_stream.extend(frame_people)
        writer.write(img_show)

        frame_idx += 1
        if frame_idx % 25 == 0:
            print(f"  frame {frame_idx}/{n_frames}")

    cap.release()
    writer.release()

    elapsed = time.time() - t_start
    processed_fps = frame_idx / elapsed if elapsed > 0 else 0
    print(f"\ndone: {frame_idx} frames in {elapsed:.1f}s ({processed_fps:.2f} fps)")

    leakage_sorted = sorted(desk_leakage.items(), key=lambda kv: -kv[1])
    print("desk-leakage aggregate (cumulative foreign gaze-mass received per seat, whole clip):")
    for sid, val in leakage_sorted:
        print(f"  seat {sid}: {val:.2f}")

    with open(JSON_OUT, "w") as f:
        json.dump({
            "source_video": VIDEO_IN,
            "seatmap": SEATMAP_PATH,
            "fps": fps,
            "resolution": [w, h],
            "total_frames": frame_idx,
            "pipeline_fps_measured": round(processed_fps, 2),
            "gaze_stride_frames": GAZE_STRIDE,
            "desk_leakage_aggregate": dict(leakage_sorted),
            "events": event_stream,
        }, f, indent=2)
    print(f"wrote {VIDEO_OUT}")
    print(f"wrote {JSON_OUT}")


if __name__ == "__main__":
    main()
