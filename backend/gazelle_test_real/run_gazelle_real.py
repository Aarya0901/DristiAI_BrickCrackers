"""
Gaze-LLE re-validation on REAL exam-hall CCTV frames (CC0 dataset), replacing the
Phase 0 proxy test (which used borrowed classroom photos, not real hall geometry).
"""
import json
import os
import sys

import torch
from PIL import Image, ImageDraw

sys.path.insert(0, "V:/backend/gazelle_repo")
from gazelle.model import get_gazelle_model

IMG_DIR = "V:/backend/gazelle_test_real"
OUT_DIR = "V:/backend/gazelle_test_real/out"
os.makedirs(OUT_DIR, exist_ok=True)

CKPT_URL = "https://github.com/fkryan/gazelle/releases/download/v1.0.0/gazelle_dinov2_vitb14_inout.pt"

ANNOTATIONS = {
    "hall_00.jpg": [  # computer lab exam, mostly rear-view heads
        ("front", 100, 420, 170, 490),
        ("mid", 200, 300, 260, 360),
        ("back", 150, 180, 220, 230),
        ("teacher_frontal", 150, 100, 210, 190),
    ],
    "hall_02.jpg": [  # lecture hall, rows of hijab-wearing students, rear-view
        ("front", 230, 360, 310, 440),
        ("mid", 250, 230, 320, 280),
        ("back", 170, 100, 240, 140),
    ],
    "hall_12.jpg": [  # deepest hall, lap-board exam, real distance range
        ("front", 130, 400, 200, 460),
        ("mid", 230, 280, 290, 330),
        ("back", 270, 170, 320, 210),
    ],
}


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, transform = get_gazelle_model("gazelle_dinov2_vitb14_inout")
    state_dict = torch.hub.load_state_dict_from_url(CKPT_URL, map_location=device)
    model.load_gazelle_state_dict(state_dict)
    model.to(device).eval()
    print("model loaded OK, device:", device)

    summary = []
    for fname, boxes in ANNOTATIONS.items():
        path = os.path.join(IMG_DIR, fname)
        image = Image.open(path).convert("RGB")
        w, h = image.size
        norm_boxes = [(x1 / w, y1 / h, x2 / w, y2 / h) for (_, x1, y1, x2, y2) in boxes]
        img_tensor = transform(image).unsqueeze(0).to(device)
        with torch.no_grad():
            output = model({"images": img_tensor, "bboxes": [norm_boxes]})

        overlay = image.copy()
        draw = ImageDraw.Draw(overlay, "RGBA")
        for i, (label, x1, y1, x2, y2) in enumerate(boxes):
            heatmap = output["heatmap"][0][i].cpu()
            inout_score = float(output["inout"][0][i]) if output["inout"] is not None else None
            peak_idx = torch.argmax(heatmap).item()
            py, px = divmod(peak_idx, heatmap.shape[1])
            peak_x, peak_y = px / heatmap.shape[1] * w, py / heatmap.shape[0] * h
            peak_val = float(heatmap[py, px])

            draw.rectangle([x1, y1, x2, y2], outline=(0, 255, 0, 255), width=2)
            head_cx, head_cy = (x1 + x2) / 2, (y1 + y2) / 2
            draw.line([(head_cx, head_cy), (peak_x, peak_y)], fill=(255, 0, 0, 255), width=2)
            draw.ellipse([peak_x - 5, peak_y - 5, peak_x + 5, peak_y + 5], outline=(255, 0, 0, 255), width=2)
            draw.text((x1, max(0, y1 - 12)), label, fill=(0, 255, 0, 255))

            head_px = ((x2 - x1) + (y2 - y1)) / 2
            summary.append({
                "image": fname, "label": label, "head_px_size_approx": round(head_px, 1),
                "peak_heatmap_value": round(peak_val, 4),
                "inout_score": round(inout_score, 4) if inout_score is not None else None,
            })
            print(f"{fname:14s} {label:16s} head~{head_px:4.0f}px  peak={peak_val:.3f}  inout={inout_score}")

        overlay.save(os.path.join(OUT_DIR, f"overlay_{fname}"), quality=92)

    with open(os.path.join(OUT_DIR, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nsaved overlays + summary to {OUT_DIR}")


if __name__ == "__main__":
    main()
