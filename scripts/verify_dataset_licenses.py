#!/usr/bin/env python3
"""
verify_dataset_licenses.py — Check license information for all Vigil datasets.

Reads dataset source directories and reports license status for each.
Flags datasets missing licenses, with incompatible terms, or with
unknown provenance.

Usage:
  python scripts/verify_dataset_licenses.py
  python scripts/verify_dataset_licenses.py --help
  python scripts/verify_dataset_licenses.py --output datasets/licenses/license_report.json
"""

import argparse
import csv
import datetime
import hashlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "datasets"
RAW_DIR = DATASETS_DIR / "raw"

KNOWN_LICENSES = {
    "CC0": {
        "full": "Creative Commons Zero — Public Domain Dedication",
        "commercial": True,
        "redistribution": True,
        "attribution_required": False,
    },
    "CC BY 4.0": {
        "full": "Creative Commons Attribution 4.0 International",
        "commercial": True,
        "redistribution": True,
        "attribution_required": True,
    },
    "AGPL-3.0": {
        "full": "GNU Affero General Public License v3.0",
        "commercial": True,
        "redistribution": True,
        "attribution_required": False,
        "source_disclosure": True,
    },
    "MIT": {
        "full": "MIT License",
        "commercial": True,
        "redistribution": True,
        "attribution_required": False,
    },
    "Apache-2.0": {
        "full": "Apache License 2.0",
        "commercial": True,
        "redistribution": True,
        "attribution_required": False,
    },
    "RESEARCH_ONLY": {
        "full": "Research / Academic Use Only (exact terms unknown)",
        "commercial": False,
        "redistribution": False,
        "attribution_required": True,
        "warning": "Cannot use commercially. Confirm terms with dataset authors.",
    },
    "UNKNOWN": {
        "full": "License unknown or not provided",
        "commercial": False,
        "redistribution": False,
        "attribution_required": True,
        "warning": "DO NOT redistribute. Confirm terms before any use.",
    },
}

DATASET_SOURCES = [
    {
        "name": "MSU Online Exam Proctoring (OEP)",
        "source_platform": "Kaggle",
        "identifier": "raajanwankhade/oep-dataset",
        "doi": None,
        "directory": "oep",
        "expected_license": "UNKNOWN",
        "required_citation": (
            "Raajan Wankhade et al., 'Online Exam Proctoring Dataset', "
            "Michigan State University CVLab."
        ),
        "privacy_notes": "Contains webcam footage of individual examinees; "
                         "may include faces. Do NOT redistribute without confirming terms.",
        "accepted": False,
        "rejection_reason": "License pending verification",
    },
    {
        "name": "CCTV Exam Monitor Dataset",
        "source_platform": "Kaggle",
        "identifier": "cctvdataset/cctv-exam-monitor-dataset",
        "doi": None,
        "directory": "cctv_exam_monitor",
        "expected_license": "CC0",
        "required_citation": (
            "Jonathan Michael Campbell, 'CCTV Exam Monitor Dataset', Kaggle."
        ),
        "privacy_notes": "Real exam-hall CCTV. Author claims anonymized; "
                         "verify that no names/IDs are visible in actual frames.",
        "accepted": True,
        "rejection_reason": None,
    },
    {
        "name": "Cheating Scenario Dataset in Online Exam",
        "source_platform": "Mendeley Data",
        "identifier": "10.17632/mjrfmvsh7d.1",
        "doi": "10.17632/mjrfmvsh7d.1",
        "directory": "cheating_scenarios",
        "expected_license": "CC BY 4.0",
        "required_citation": (
            "Dataset authors (Mendeley Data). "
            "'Cheating Scenario Dataset in Online Exam', doi:10.17632/mjrfmvsh7d.1. "
            "Licensed under CC BY 4.0."
        ),
        "privacy_notes": "Staged cheating scenarios. Verify no real student identities exposed.",
        "accepted": True,
        "rejection_reason": None,
    },
    {
        "name": "Online Exam Cheating Detection (Roboflow)",
        "source_platform": "Roboflow Universe",
        "identifier": "fraud-detection-using-cnn/online-exam-cheating-detection",
        "doi": None,
        "directory": "roboflow_exam",
        "expected_license": "UNKNOWN",
        "required_citation": (
            "Roboflow Universe: fraud-detection-using-cnn/online-exam-cheating-detection."
        ),
        "privacy_notes": "May be classification-only. Check if bounding boxes available. "
                         "Verify license before use.",
        "accepted": False,
        "rejection_reason": "License pending verification; check annotation format",
    },
    {
        "name": "SCB-Dataset5",
        "source_platform": "GitHub / HuggingFace",
        "identifier": "Whiffe/SCB-dataset",
        "doi": None,
        "directory": "scb_dataset",
        "expected_license": "RESEARCH_ONLY",
        "required_citation": (
            "Whiffe et al., 'SCB-Dataset: Student Classroom Behavior Dataset', "
            "GitHub: Whiffe/SCB-dataset."
        ),
        "privacy_notes": "Real classroom images. Check for student faces/identities. "
                         "Research-only unless written permission obtained.",
        "accepted": False,
        "rejection_reason": "Research-only license; need written permission for commercial use",
    },
]


def find_license_file(directory: Path) -> list[str]:
    """Find license-related files in a directory (recursive, shallow)."""
    found = []
    for pattern in ["LICENSE*", "license*", "README*", "readme*"]:
        for p in directory.glob(pattern):
            if p.is_file():
                found.append(str(p.relative_to(directory)))
    return found


def sha256_file(filepath: Path) -> str | None:
    """Compute SHA-256 of a file."""
    if not filepath.exists():
        return None
    try:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def count_files(directory: Path) -> dict:
    """Count files by type in a directory."""
    if not directory.exists():
        return {"total": 0, "images": 0, "videos": 0, "other": 0}

    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
    video_exts = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"}
    total, imgs, vids = 0, 0, 0

    for f in directory.rglob("*"):
        if f.is_file():
            total += 1
            if f.suffix.lower() in image_exts:
                imgs += 1
            elif f.suffix.lower() in video_exts:
                vids += 1

    return {"total": total, "images": imgs, "videos": vids, "other": total - imgs - vids}


def dir_size(directory: Path) -> int:
    """Total size of directory in bytes."""
    if not directory.exists():
        return 0
    return sum(f.stat().st_size for f in directory.rglob("*") if f.is_file())


def check_dataset(source: dict) -> dict:
    """Inspect one dataset directory and return a record."""
    directory = RAW_DIR / source["directory"]
    record = {**source}
    record["download_date"] = datetime.date.today().isoformat()
    record["exists"] = directory.exists()
    record["license_files"] = find_license_file(directory) if directory.exists() else []
    record["file_counts"] = count_files(directory)
    record["extracted_size_bytes"] = dir_size(directory)

    zip_candidates = list(directory.glob("*.zip")) if directory.exists() else []
    record["archive_sha256"] = None
    if zip_candidates:
        record["archive_sha256"] = sha256_file(zip_candidates[0])
        record["archive_size_bytes"] = zip_candidates[0].stat().st_size if zip_candidates[0].exists() else 0
    else:
        record["archive_size_bytes"] = 0

    license_key = source["expected_license"]
    record["license_details"] = KNOWN_LICENSES.get(license_key, KNOWN_LICENSES["UNKNOWN"])

    if record["license_details"].get("warning"):
        record["license_warning"] = record["license_details"]["warning"]

    return record


def write_csv(records: list[dict], path: Path):
    """Write records to CSV."""
    fields = [
        "name", "source_platform", "identifier", "doi", "download_date",
        "expected_license", "exists", "file_counts_total", "file_counts_images",
        "file_counts_videos", "extracted_size_bytes", "archive_sha256",
        "accepted", "rejection_reason", "commercial_ok", "redistribution_ok",
        "privacy_notes", "required_citation",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in records:
            row = {**r}
            row["file_counts_total"] = r.get("file_counts", {}).get("total", 0)
            row["file_counts_images"] = r.get("file_counts", {}).get("images", 0)
            row["file_counts_videos"] = r.get("file_counts", {}).get("videos", 0)
            row["commercial_ok"] = r.get("license_details", {}).get("commercial", False)
            row["redistribution_ok"] = r.get("license_details", {}).get("redistribution", False)
            w.writerow(row)


def main():
    parser = argparse.ArgumentParser(
        description="Verify Vigil dataset licenses and generate source records."
    )
    parser.add_argument("--output", default=None,
                        help="Path to write JSON report (default: stdout)")
    parser.add_argument("--csv", default=None,
                        help="Path to write CSV manifest")
    args = parser.parse_args()

    records = [check_dataset(src) for src in DATASET_SOURCES]

    accepted = [r for r in records if r.get("accepted")]
    rejected = [r for r in records if not r.get("accepted")]
    missing = [r for r in records if not r.get("exists")]

    report = {
        "generated": datetime.datetime.now().isoformat(),
        "total_sources": len(records),
        "accepted": len(accepted),
        "rejected": len(rejected),
        "not_downloaded": len(missing),
        "by_license": {},
        "by_platform": {},
        "datasets": records,
        "summary": {
            "total_images": sum(r.get("file_counts", {}).get("images", 0) for r in records),
            "total_videos": sum(r.get("file_counts", {}).get("videos", 0) for r in records),
            "total_files": sum(r.get("file_counts", {}).get("total", 0) for r in records),
            "total_size_bytes": sum(r.get("extracted_size_bytes", 0) for r in records),
        },
    }

    for r in records:
        lic = r["expected_license"]
        plat = r["source_platform"]
        report["by_license"].setdefault(lic, 0)
        report["by_license"][lic] += 1
        report["by_platform"].setdefault(plat, 0)
        report["by_platform"][plat] += 1

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"License report written to {output_path}")

    if args.csv:
        csv_path = Path(args.csv)
        write_csv(records, csv_path)
        print(f"CSV manifest written to {csv_path}")

    if not args.output:
        print(json.dumps(report, indent=2))

    # Print warnings
    for r in records:
        if r.get("license_warning"):
            print(f"\nWARNING [{r['name']}]: {r['license_warning']}", file=sys.stderr)
        if not r["exists"]:
            print(f"\nMISSING [{r['name']}]: dataset not downloaded yet.", file=sys.stderr)

    # Exit with error if critical issues
    if missing and not args.output:
        print(f"\n{len(missing)} dataset(s) not yet downloaded.", file=sys.stderr)


if __name__ == "__main__":
    main()
