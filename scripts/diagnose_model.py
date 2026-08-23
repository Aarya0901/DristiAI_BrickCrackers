# -*- coding: utf-8 -*-
import argparse
import random
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

NAMES_4CLS = {0: "person", 1: "leaning_forward", 2: "hand_signal", 3: "normal_exam_activity"}
NAMES_6CLS = {0: "person", 1: "looking_left", 2: "leaning_forward", 3: "talking", 4: "hand_signal", 5: "normal_exam_activity"}

VAL_IMG_DIR = ROOT / "datasets" / "vigil_exam" / "images" / "val"
VAL_LBL_DIR = ROOT / "datasets" / "vigil_exam" / "labels" / "val"


def parse_args():
    p = argparse.ArgumentParser(description="VIGIL model diagnostic on val split")
    p.add_argument("--weights", required=True, help="Path to .pt weights file")
    p.add_argument("--n", type=int, default=10, help="Number of val images to sample")
    p.add_argument("--conf", type=float, default=0.01,
                   help="Detection conf threshold -- set LOW (0.01) to see suppressed boxes")
    p.add_argument("--device", default="cpu", help="cuda or cpu")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--out-dir", default="diagnose_out")
    p.add_argument("--class-names", choices=["4cls", "6cls"], default="4cls")
    return p.parse_args()


def load_gt(label_path, names):
    rows = []
    if not label_path.exists():
        return rows
    for line in label_path.read_text(encoding="utf-8").strip().splitlines():
        parts = line.strip().split()
        if not parts:
            continue
        cls_id = int(parts[0])
        rows.append({
            "cls_id": cls_id,
            "cls_name": names.get(cls_id, "cls" + str(cls_id)),
            "cx": float(parts[1]), "cy": float(parts[2]),
            "w": float(parts[3]), "h": float(parts[4]),
        })
    return rows


def main():
    args = parse_args()
    random.seed(args.seed)

    import cv2
    from ultralytics import YOLO

    weights = Path(args.weights)
    if not weights.is_absolute():
        weights = ROOT / weights
    if not weights.exists():
        sys.exit("ERROR: weights not found at " + str(weights))

    names = NAMES_4CLS if args.class_names == "4cls" else NAMES_6CLS

    print("=" * 60)
    print("VIGIL MODEL DIAGNOSTIC")
    print("=" * 60)
    print("weights  : " + str(weights))
    print("classes  : " + str(names))
    print("conf thr : " + str(args.conf) + "  (LOW -- catches suppressed boxes)")
    print("device   : " + args.device)
    print("val imgs : " + str(VAL_IMG_DIR))
    print()

    all_imgs = sorted(VAL_IMG_DIR.glob("*.jpg")) + sorted(VAL_IMG_DIR.glob("*.png"))
    if not all_imgs:
        sys.exit("ERROR: no images found in " + str(VAL_IMG_DIR))
    sample = random.sample(all_imgs, min(args.n, len(all_imgs)))
    print("Sampled " + str(len(sample)) + " / " + str(len(all_imgs)) + " val images")

    print("Loading model...")
    model = YOLO(str(weights))
    model_names = dict(model.names)
    print("model.names: " + str(model_names))

    if model_names != names:
        print()
        print("!!! WARNING: model.names does not match expected " + args.class_names + " taxonomy !!!")
        print("    model:    " + str(model_names))
        print("    expected: " + str(names))
        print("    This class-ID mismatch is a top suspect for wrong predictions!")
    print()

    out_dir = ROOT / args.out_dir
    out_dir.mkdir(exist_ok=True)

    gt_cls_counter = Counter()
    pred_cls_counter = Counter()
    conf_values = []
    max_conf_per_image = []

    for i, img_path in enumerate(sample):
        lbl_path = VAL_LBL_DIR / (img_path.stem + ".txt")
        gt_boxes = load_gt(lbl_path, names)

        results = model.predict(str(img_path), conf=args.conf, device=args.device, verbose=False)[0]
        boxes_obj = results.boxes
        preds = []
        if boxes_obj is not None and len(boxes_obj):
            for b in boxes_obj:
                cls_id = int(b.cls.item())
                conf = float(b.conf.item())
                xyxy = b.xyxy[0].tolist()
                cls_name = model_names.get(cls_id, "cls" + str(cls_id))
                preds.append({"cls_id": cls_id, "cls_name": cls_name, "conf": conf, "xyxy": xyxy})
                conf_values.append(conf)
                pred_cls_counter[cls_name] += 1

        for g in gt_boxes:
            gt_cls_counter[g["cls_name"]] += 1

        max_conf = max((p["conf"] for p in preds), default=0.0)
        max_conf_per_image.append(max_conf)

        gt_dist = dict(Counter(g["cls_name"] for g in gt_boxes))
        pred_dist = dict(Counter(p["cls_name"] for p in preds))

        print("[" + str(i + 1).zfill(2) + "] " + img_path.name)
        print("      GT   (" + str(len(gt_boxes)) + " boxes): " + str(gt_dist))
        print("      PRED (" + str(len(preds)) + " boxes, conf>=" + str(round(args.conf, 2)) + "): " + str(pred_dist))
        if preds:
            sorted_preds = sorted(preds, key=lambda x: -x["conf"])
            top = ", ".join(p["cls_name"] + "@" + str(round(p["conf"], 3)) for p in sorted_preds)
            print("      confs: " + top)
        else:
            print("      *** NO detections at conf>=" + str(args.conf) + " ***")
        print()

        img = cv2.imread(str(img_path))
        if img is None:
            continue
        H, W = img.shape[:2]
        for g in gt_boxes:
            cx, cy, bw, bh = g["cx"], g["cy"], g["w"], g["h"]
            x1 = int((cx - bw / 2) * W)
            y1 = int((cy - bh / 2) * H)
            x2 = int((cx + bw / 2) * W)
            y2 = int((cy + bh / 2) * H)
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 200, 0), 2)
            cv2.putText(img, "GT:" + g["cls_name"], (x1, max(0, y1 - 6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 200, 0), 1)
        for p in preds:
            x1, y1, x2, y2 = [int(v) for v in p["xyxy"]]
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 80, 255), 2)
            cv2.putText(img, p["cls_name"] + "@" + str(round(p["conf"], 2)),
                        (x1, max(0, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 80, 255), 1)
        cv2.imwrite(str(out_dir / ("diag_" + str(i + 1).zfill(2) + "_" + img_path.stem + ".jpg")), img)

    # ---- aggregate summary ----
    print("=" * 60)
    print("AGGREGATE SUMMARY")
    print("=" * 60)
    print()
    print("GT class distribution across sampled images:")
    for cls, cnt in sorted(gt_cls_counter.items(), key=lambda x: -x[1]):
        print("  " + cls.ljust(32) + str(cnt))

    print()
    print("Predicted class distribution (conf>=" + str(args.conf) + "):")
    if pred_cls_counter:
        for cls, cnt in sorted(pred_cls_counter.items(), key=lambda x: -x[1]):
            print("  " + cls.ljust(32) + str(cnt))
    else:
        print("  *** ZERO boxes predicted across all sampled images! ***")

    if conf_values:
        mn = min(conf_values)
        mx = max(conf_values)
        mean = sum(conf_values) / len(conf_values)
        print()
        print("Conf stats: min=" + str(round(mn, 4)) + "  max=" + str(round(mx, 4)) + "  mean=" + str(round(mean, 4)))
        print("Conf histogram:")
        buckets = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        for lo, hi in zip(buckets, buckets[1:]):
            count = sum(1 for c in conf_values if lo <= c < hi)
            bar = "#" * (count // max(1, len(conf_values) // 40))
            print("  [" + str(round(lo, 1)) + "," + str(round(hi, 1)) + "): " + str(count).rjust(4) + "  " + bar)
    else:
        print()
        print("Conf histogram: EMPTY (no boxes predicted)")
        print()
        print("Possible causes:")
        print("  1. Domain shift: model trained on SCB classroom, tested on Kaggle CCTV exam video")
        print("  2. Class-ID mismatch: model outputs IDs that dont match the val label set")
        print("  3. Scale/resolution mismatch: very different image sizes between datasets")
        print("  4. Model collapsed: trained to predict only normal_exam_activity everywhere")
        print("  5. NMS / conf threshold filtering out all real detections")

    print()
    zero = sum(1 for v in max_conf_per_image if v == 0.0)
    print("Max conf per image: " + str([str(round(v, 3)) for v in max_conf_per_image]))
    print("Images with zero preds: " + str(zero) + "/" + str(len(sample)))
    print()
    print("Annotated images saved to: " + str(out_dir) + "/  (green=GT, red=pred)")
    print()
    print("DIAGNOSIS HINTS:")
    print("  * All preds = normal_exam_activity -> model collapsed to that class")
    print("  * Zero preds at conf=0.01 -> backbone not activating on these frames")
    print("  * model.names mismatch -> class-ID offset causing all wrong class labels")
    print("  * Sanity test: --weights yolo11s.pt --conf 0.3 -> should detect persons")


if __name__ == "__main__":
    main()
