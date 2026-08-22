"""
modal_train.py — Train VIGIL YOLO11-s on Modal (T4 GPU, ~$0.59/hr).

Step 1: Upload dataset (runs locally):
  python modal_train.py --upload

Step 2: Train on GPU:
  modal run modal_train.py::train

Step 3: Download results:
  modal volume get vigil-results .    (gets best.pt and run dir)

Cost estimate for 100 epochs on ~10k labeled images: $1–3 (T4).
"""

import argparse
import os
import sys
from pathlib import Path

import modal

ROOT = Path(__file__).resolve().parent

DATASET_VOLUME = modal.Volume.from_name("vigil-dataset", create_if_missing=True)
RESULTS_VOLUME = modal.Volume.from_name("vigil-results", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0", "libsm6", "libxext6", "libxrender-dev", "libgomp1")
    .pip_install(
        "ultralytics>=8.3.0",
        "torch>=2.0.0",
        "opencv-python-headless>=4.8.0",
        "numpy>=1.24.0",
        "PyYAML>=6.0",
        "tqdm>=4.65.0",
        "Pillow>=10.0.0",
    )
)

app = modal.App("vigil-yolo-train", image=image)


def upload_dataset_local():
    """Upload local datasets/vigil_exam/ to Modal Volume (runs LOCALLY)."""
    import yaml as _yaml_module

    local = ROOT / "datasets" / "vigil_exam"
    if not local.exists():
        print(f"ERROR: {local} not found.", flush=True)
        print("Run scripts/build_vigil_dataset.py first.", flush=True)
        sys.exit(1)

    total_files = 0

    for subdir in ("images", "labels"):
        src = local / subdir
        if not src.exists():
            continue
        for split in ("train", "val", "test"):
            s = src / split
            if not s.exists():
                continue
            files_to_upload = []
            for f in sorted(s.iterdir()):
                if f.is_file():
                    remote_path = f"datasets/vigil_exam/{subdir}/{split}/{f.name}"
                    files_to_upload.append((str(f), remote_path))
            if files_to_upload:
                print(f"Uploading {len(files_to_upload)} files: {subdir}/{split} ...", flush=True)
                with DATASET_VOLUME.batch_upload() as batch:
                    for local_path, remote_path in files_to_upload:
                        batch.put_file(local_path, remote_path)
                        total_files += 1
                        if total_files % 200 == 0:
                            print(f"  ... {total_files} files staged so far", flush=True)
                print(f"  {split}: done ({len(files_to_upload)} files)", flush=True)

    print(f"Total files uploaded: {total_files}", flush=True)

    yaml_src = local / "vigil_exam.yaml"
    cfg = _yaml_module.safe_load(yaml_src.read_text())
    cfg["path"] = "/data/datasets/vigil_exam"
    tmp_yaml = local.parent / ".tmp_vigil_exam.yaml"
    tmp_yaml.write_text(_yaml_module.dump(cfg))
    try:
        with DATASET_VOLUME.batch_upload() as batch:
            batch.put_file(str(tmp_yaml), "datasets/vigil_exam/vigil_exam.yaml")
        print("YAML config uploaded.", flush=True)
    finally:
        tmp_yaml.unlink(missing_ok=True)

    weights_src = ROOT / "yolo11s.pt"
    if weights_src.exists():
        with DATASET_VOLUME.batch_upload() as batch:
            batch.put_file(str(weights_src), "yolo11s.pt")
        print("yolo11s.pt uploaded.", flush=True)

    print("Dataset upload complete.", flush=True)


@app.function(
    gpu="t4",
    cpu=4.0,
    memory=16384,
    timeout=86400,
    volumes={
        "/data": DATASET_VOLUME,
        "/results": RESULTS_VOLUME,
    },
)
def train(
    epochs: int = 100,
    batch: int = 16,
    imgsz: int = 640,
    resume_run: str = "",
    data_yaml_path: str = "/data/datasets/vigil_exam/vigil_exam.yaml",
):
    """Train YOLO11-s on the Vigil dataset using a T4 GPU.
    
    Set resume_run to a previous run name to resume from its last.pt checkpoint.
    """
    from datetime import datetime
    from ultralytics import YOLO
    import traceback
    import shutil

    data_yaml = Path(data_yaml_path)
    weights_path = Path("/data/yolo11s.pt")
    results_dir = Path("/results")

    if not data_yaml.exists():
        print(f"ERROR: {data_yaml} not found. Run: python modal_train.py --upload", flush=True)
        return

    resume_pt = None
    if resume_run:
        resume_pt = Path(f"/results/runs/{resume_run}/weights/last.pt")
        if resume_pt.exists():
            print(f"Resuming from: {resume_pt}", flush=True)
        else:
            print(f"WARNING: resume checkpoint not found at {resume_pt}", flush=True)
            resume_pt = None

    if resume_pt is None and not weights_path.exists():
        print("WARNING: yolo11s.pt not found in volume, downloading from ultralytics...", flush=True)
        weights_path = "yolo11s.pt"

    run_name = f"vigil_yolo_{datetime.now():%Y%m%d_%H%M%S}"
    print(f"Experiment: {run_name}", flush=True)
    if resume_pt:
        print(f"Resuming from: {resume_pt}", flush=True)
    print(f"Epochs: {epochs}, Batch: {batch}, ImgSz: {imgsz}", flush=True)
    print(f"Data: {data_yaml}", flush=True)

    import yaml
    with open(data_yaml) as f:
        cfg = yaml.safe_load(f)
    print(f"Classes: {cfg['nc']} — {list(cfg['names'].values())}", flush=True)

    for split in ("train", "val", "test"):
        img_dir = data_yaml.parent / "images" / split
        if img_dir.exists():
            n = len(list(img_dir.glob("*")))
            print(f"  {split}: {n} images", flush=True)

    if resume_pt:
        print("Loading model from checkpoint...", flush=True)
        model = YOLO(str(resume_pt))
    else:
        print("Loading YOLO11-s...", flush=True)
        model = YOLO(str(weights_path))

    print("Starting training...", flush=True)
    try:
        results = model.train(
            data=str(data_yaml),
            epochs=epochs,
            batch=batch,
            imgsz=imgsz,
            device=0,
            name=run_name,
            project="/results/runs",
            workers=4,
            pretrained=not bool(resume_pt),
            resume=True if resume_pt else False,
            save=True,
            save_period=10,
            plots=True,
            exist_ok=True,
            patience=20,
            lr0=0.01,
            lrf=0.01,
            momentum=0.937,
            weight_decay=0.0005,
            warmup_epochs=3,
            box=7.5,
            cls=0.5,
            dfl=1.5,
            hsv_h=0.015,
            hsv_s=0.7,
            hsv_v=0.4,
            degrees=0.0,
            translate=0.1,
            scale=0.5,
            shear=0.0,
            flipud=0.0,
            fliplr=0.5,
            mosaic=1.0,
            mixup=0.0,
            erasing=0.0,
        )
    except Exception as e:
        print(f"TRAINING ERROR: {e}", flush=True)
        traceback.print_exc()
        (results_dir / f"{run_name}_ERROR.txt").write_text(f"{e}\n{traceback.format_exc()}")
        RESULTS_VOLUME.commit()
        return

    print(f"Training complete.", flush=True)

    run_dir = Path("/results/runs") / run_name
    best_pt = run_dir / "weights" / "best.pt"
    last_pt = run_dir / "weights" / "last.pt"

    if best_pt.exists():
        best_dst = results_dir / f"{run_name}_best.pt"
        best_dst.write_bytes(best_pt.read_bytes())
        print(f"Best weights copied to /results/{run_name}_best.pt ({best_dst.stat().st_size} bytes)", flush=True)
    if last_pt.exists():
        last_dst = results_dir / f"{run_name}_last.pt"
        last_dst.write_bytes(last_pt.read_bytes())
        print(f"Last weights copied to /results/{run_name}_last.pt", flush=True)

    print("--- Final metrics ---", flush=True)
    if hasattr(results, 'results_dict'):
        for key in ("metrics/mAP50(B)", "metrics/mAP50-95(B)",
                    "metrics/precision(B)", "metrics/recall(B)"):
            val = results.results_dict.get(key)
            if val is not None:
                print(f"  {key}: {val:.4f}", flush=True)

    RESULTS_VOLUME.commit()
    print("Results volume committed.", flush=True)

    print("\n=== TRAINING COMPLETE ===", flush=True)
    print(f"Run name: {run_name}", flush=True)
    print("Download: modal volume get vigil-results .", flush=True)


@app.function(
    cpu=4.0,
    memory=16384,
    timeout=3600,
    volumes={"/data": DATASET_VOLUME},
)
def remap_dataset_4cls():
    """Create /data/datasets/vigil_exam_4cls: drop looking_left & talking,
    reindex to 4 classes. Runs server-side (volume mounted as FS)."""
    import shutil

    SRC = Path("/data/datasets/vigil_exam")
    DST = Path("/data/datasets/vigil_exam_4cls")

    # old_id -> new_id (None = drop)
    REMAP = {0: 0, 1: None, 2: 1, 3: None, 4: 2, 5: 3}
    NAMES = {0: "person", 1: "leaning_forward", 2: "hand_signal", 3: "normal_exam_activity"}

    for split in ("train", "val", "test"):
        # images: copy tree (fast, server-side)
        src_img = SRC / "images" / split
        dst_img = DST / "images" / split
        if src_img.exists() and not dst_img.exists():
            print(f"Copying images/{split} ...", flush=True)
            shutil.copytree(str(src_img), str(dst_img))
        elif dst_img.exists():
            print(f"images/{split} exists, skipping", flush=True)

        # labels: remap
        src_lbl = SRC / "labels" / split
        dst_lbl = DST / "labels" / split
        dst_lbl.mkdir(parents=True, exist_ok=True)
        n_files, n_kept, n_dropped = 0, 0, 0
        for f in src_lbl.glob("*.txt"):
            out_lines = []
            for line in f.read_text().splitlines():
                parts = line.strip().split()
                if not parts:
                    continue
                old_id = int(parts[0])
                new_id = REMAP.get(old_id)
                if new_id is None:
                    n_dropped += 1
                    continue
                parts[0] = str(new_id)
                out_lines.append(" ".join(parts))
                n_kept += 1
            (dst_lbl / f.name).write_text("\n".join(out_lines) + ("\n" if out_lines else ""))
            n_files += 1
        print(f"labels/{split}: {n_files} files, kept {n_kept} boxes, dropped {n_dropped}", flush=True)

    # YAML
    yaml_text = (
        f"path: {DST}\n"
        "train: images/train\n"
        "val: images/val\n"
        "test: images/test\n"
        f"nc: {len(NAMES)}\n"
        "names:\n"
        + "".join(f"  {k}: {v}\n" for k, v in NAMES.items())
    )
    (DST / "vigil_exam_4cls.yaml").write_text(yaml_text)
    print(f"YAML written:\n{yaml_text}", flush=True)

    DATASET_VOLUME.commit()
    print("Remap complete.", flush=True)


@app.function(
    gpu="t4",
    cpu=4.0,
    memory=16384,
    timeout=3600,
    volumes={
        "/data": DATASET_VOLUME,
        "/results": RESULTS_VOLUME,
    },
)
def validate(
    weights: str = "runs/vigil_yolo_20260722_190139/weights/best.pt",
    data_yaml_path: str = "/data/datasets/vigil_exam/vigil_exam.yaml",
):
    """Validate a trained model on the test split and print per-class AP."""
    from ultralytics import YOLO
    import yaml as _yaml

    data_yaml = Path(data_yaml_path)
    weights_path = Path("/results") / weights

    if not weights_path.exists():
        print(f"ERROR: weights not found at /results/{weights}", flush=True)
        return

    with open(data_yaml) as f:
        names = {int(k): v for k, v in _yaml.safe_load(f)["names"].items()}

    print(f"Validating: {weights_path}", flush=True)
    model = YOLO(str(weights_path))

    print("\n=== TEST SET RESULTS ===", flush=True)
    metrics = model.val(data=str(data_yaml), split="test", plots=False)

    print("\n--- PER-CLASS mAP50-95 (test) ---", flush=True)
    if hasattr(metrics, "box") and hasattr(metrics.box, "maps"):
        for i, cid in enumerate(metrics.box.ap_class_index):
            name = names.get(int(cid), f"class_{cid}")
            ap = metrics.box.maps[i] if i < len(metrics.box.maps) else -1
            print(f"  {int(cid)} {name}: {ap:.4f}", flush=True)

    print("\n--- OVERALL (test) ---", flush=True)
    rd = metrics.results_dict
    for k in ["metrics/precision(B)", "metrics/recall(B)",
              "metrics/mAP50(B)", "metrics/mAP50-95(B)"]:
        v = rd.get(k)
        if v is not None:
            print(f"  {k}: {v:.4f}", flush=True)

    print("\n=== DONE ===", flush=True)


@app.local_entrypoint()
def main():
    """Entrypoint with CLI args (for `modal run modal_train.py`)."""
    p = argparse.ArgumentParser()
    p.add_argument("--upload", action="store_true", help="Upload dataset to Modal Volume first")
    p.add_argument("--epochs", type=int, default=100)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--resume-run", type=str, default="")
    p.add_argument("--validate", type=str, default="")
    args = p.parse_args()

    if args.upload:
        upload_dataset_local()

    if args.validate:
        validate.remote(weights=args.validate)
    else:
        train.remote(epochs=args.epochs, batch=args.batch, resume_run=args.resume_run)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--upload", action="store_true", help="Upload dataset to Modal Volume")
    p.add_argument("--epochs", type=int, default=100)
    p.add_argument("--batch", type=int, default=16)
    args = p.parse_args()

    if args.upload:
        upload_dataset_local()
    else:
        print("Usage: python modal_train.py --upload")
        print("Then:  modal run modal_train.py::train")
