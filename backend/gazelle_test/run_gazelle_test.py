"""
Gaze-LLE go/no-go test (VIGIL backend, Phase 0).
Loads gazelle_dinov2_vitb14_inout on manually-boxed heads at simulated
front/mid/back row distances, saves heatmap overlays + a summary JSON.
"""
import json
import os
import sys

import torch
from PIL import Image, ImageDraw

sys.path.insert(0, "V:/backend/gazelle_repo")
from gazelle.model import get_gazelle_model

IMG_DIR = "V:/backend/gazelle_test"
OUT_DIR = "V:/backend/gazelle_test/out"
os.makedirs(OUT_DIR, exist_ok=True)

CKPT_URL = "https://github.com/fkryan/gazelle/releases/download/v1.0.0/gazelle_dinov2_vitb14_inout.pt"

# (image, [(tier_label, x1, y1, x2, y2), ...]) -- pixel coords, eyeballed from grid overlays
ANNOTATIONS = {
    "tier_front_1.jpg": [
        ("front", 250, 180, 330, 280),
        ("mid", 430, 130, 490, 190),
        ("back", 330, 100, 390, 150),
    ],
    "tier_front_2.jpg": [
        ("front", 130, 250, 210, 330),
        ("mid", 280, 150, 340, 210),
        ("back", 250, 90, 300, 140),
    ],
    "tier_mixed_1.jpg": [
        ("front", 130, 340, 220, 410),
        ("mid", 280, 270, 350, 330),
        ("back", 290, 210, 330, 240),
    ],
    "tier_mixed_2.jpg": [
        ("front", 340, 225, 400, 290),
        ("mid", 210, 150, 260, 195),
        ("back", 480, 110, 520, 148),
    ],
    "tier_mixed_3.jpg": [
        ("near_rear_1", 130, 700, 230, 800),
        ("near_rear_2", 700, 650, 800, 740),
        ("near_frontal_teacher", 500, 470, 590, 560),
    ],
}


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device: {device}")

    model, transform = get_gazelle_model("gazelle_dinov2_vitb14_inout")
    print("downloading/loading checkpoint...")
    state_dict = torch.hub.load_state_dict_from_url(CKPT_URL, map_location=device)
    model.load_gazelle_state_dict(state_dict)
    model.to(device).eval()
    print("model loaded OK")

    summary = []

    for fname, boxes in ANNOTATIONS.items():
        path = os.path.join(IMG_DIR, fname)
        image = Image.open(path).convert("RGB")
        w, h = image.size

        norm_boxes = [
            (x1 / w, y1 / h, x2 / w, y2 / h) for (_, x1, y1, x2, y2) in boxes
        ]
        img_tensor = transform(image).unsqueeze(0).to(device)
        input_dict = {"images": img_tensor, "bboxes": [norm_boxes]}

        with torch.no_grad():
            output = model(input_dict)

        overlay = image.copy()
        draw = ImageDraw.Draw(overlay, "RGBA")

        for i, (label, x1, y1, x2, y2) in enumerate(boxes):
            heatmap = output["heatmap"][0][i]  # [64,64]
            inout_score = (
                float(output["inout"][0][i]) if output["inout"] is not None else None
            )
            hm = heatmap.cpu()
            peak_idx = torch.argmax(hm).item()
            py, px = divmod(peak_idx, hm.shape[1])
            peak_x = px / hm.shape[1] * w
            peak_y = py / hm.shape[0] * h
            peak_val = float(hm[py, px])

            # head box
            draw.rectangle([x1, y1, x2, y2], outline=(0, 255, 0, 255), width=3)
            head_cx, head_cy = (x1 + x2) / 2, (y1 + y2) / 2
            # gaze target point + beam
            draw.line(
                [(head_cx, head_cy), (peak_x, peak_y)], fill=(255, 0, 0, 255), width=3
            )
            draw.ellipse(
                [peak_x - 8, peak_y - 8, peak_x + 8, peak_y + 8],
                outline=(255, 0, 0, 255),
                width=3,
            )
            draw.text((x1, max(0, y1 - 15)), label, fill=(0, 255, 0, 255))

            head_px_size = ((x2 - x1) + (y2 - y1)) / 2
            summary.append(
                {
                    "image": fname,
                    "label": label,
                    "head_bbox_px": [x1, y1, x2, y2],
                    "head_px_size_approx": round(head_px_size, 1),
                    "peak_heatmap_value": round(peak_val, 4),
                    "peak_target_px": [round(peak_x, 1), round(peak_y, 1)],
                    "inout_score": round(inout_score, 4)
                    if inout_score is not None
                    else None,
                }
            )
            print(
                f"{fname:20s} {label:22s} head~{head_px_size:5.0f}px  "
                f"peak={peak_val:.3f}  inout={inout_score}"
            )

        out_path = os.path.join(OUT_DIR, f"overlay_{fname}")
        overlay.save(out_path, quality=92)

    with open(os.path.join(OUT_DIR, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved overlays + summary.json to {OUT_DIR}")


if __name__ == "__main__":
    main()
