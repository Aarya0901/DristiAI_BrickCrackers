#!/usr/bin/env bash
# =============================================================================
# download_datasets.sh — Vigil exam-hall surveillance dataset downloader
# =============================================================================
#
# Downloads all priority datasets for the Vigil project.
# Credentials are read from environment variables or ~/.kaggle/kaggle.json.
# This script does NOT embed private API keys.
#
# Usage:
#   bash scripts/download_datasets.sh            # download all
#   bash scripts/download_datasets.sh --dry-run  # show what would be downloaded
#   bash scripts/download_datasets.sh --dataset oep  # download only one
#   bash scripts/download_datasets.sh --help
#
# Required environment variables / config:
#   KAGGLE_USERNAME / KAGGLE_KEY   (or ~/.kaggle/kaggle.json)
#   ROBOTFLOW_API_KEY              (for Roboflow export)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DATASETS_DIR="$ROOT_DIR/datasets"

DRY_RUN=false
TARGET_DATASET="all"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --dry-run         Print download commands without executing them
  --dataset NAME    Download only one dataset (oep|cctv|cheating|roboflow|scb)
  --help            Show this message

Datasets:
  oep         MSU Online Exam Proctoring (Kaggle: raajanwankhade/oep-dataset)
  cctv        CCTV Exam Monitor Dataset (Kaggle: cctvdataset/cctv-exam-monitor-dataset)
  cheating    Cheating Scenario Dataset (Mendeley: 10.17632/mjrfmvsh7d.1)
  roboflow    Online Exam Cheating Detection (Roboflow)
  scb         SCB-Dataset5 (Whiffe/SCB-dataset)

Credentials:
  Kaggle: set KAGGLE_USERNAME and KAGGLE_KEY environment variables,
          or ensure ~/.kaggle/kaggle.json exists
  Roboflow: set ROBOTFLOW_API_KEY environment variable
EOF
    exit 0
}

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*" >&2; }
fail() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; exit 1; }

check_kaggle() {
    if ! command -v kaggle &>/dev/null; then
        fail "kaggle CLI not found. Install with: pip install kaggle"
    fi
    # Verify credentials silently
    if ! kaggle datasets list --max-size 1 &>/dev/null; then
        warn "Kaggle credentials may not be configured."
        warn "Set KAGGLE_USERNAME and KAGGLE_KEY, or create ~/.kaggle/kaggle.json"
        warn "Visit: https://www.kaggle.com/settings/account → Create New API Token"
    fi
}

# ---------------------------------------------------------------------------
# Dataset A: MSU Online Exam Proctoring (OEP)
# ---------------------------------------------------------------------------
download_oep() {
    local dest="$DATASETS_DIR/raw/oep"
    local kaggle_id="raajanwankhade/oep-dataset"

    log "Dataset A: MSU Online Exam Proctoring Dataset"
    log "  Kaggle: $kaggle_id"
    log "  Destination: $dest"

    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] kaggle datasets download -d $kaggle_id -p \"$dest\" --unzip"
        return
    fi

    mkdir -p "$dest"
    kaggle datasets download -d "$kaggle_id" -p "$dest" --unzip
    log "  Download complete."

    # Check for license file
    if [ -f "$dest/LICENSE" ] || [ -f "$dest/license.txt" ] || [ -f "$dest/README.md" ]; then
        log "  License/readme found in dataset root."
    else
        warn "  No LICENSE file found. Mark as research-only until usage terms confirmed."
    fi
}

# ---------------------------------------------------------------------------
# Dataset B: CCTV Exam Monitor Dataset
# ---------------------------------------------------------------------------
download_cctv() {
    local dest="$DATASETS_DIR/raw/cctv_exam_monitor"
    local kaggle_id="cctvdataset/cctv-exam-monitor-dataset"

    log "Dataset B: CCTV Exam Monitor Dataset"
    log "  Kaggle: $kaggle_id"
    log "  Destination: $dest"
    log "  License: CC0 — Public Domain (confirmed)"

    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] kaggle datasets download -d $kaggle_id -p \"$dest\" --unzip"
        return
    fi

    mkdir -p "$dest"
    kaggle datasets download -d "$kaggle_id" -p "$dest" --unzip
    log "  Download complete."
}

# ---------------------------------------------------------------------------
# Dataset C: Cheating Scenario Dataset (Mendeley)
# ---------------------------------------------------------------------------
download_cheating() {
    local dest="$DATASETS_DIR/raw/cheating_scenarios"
    local doi="10.17632/mjrfmvsh7d.1"
    local mendeley_url="https://data.mendeley.com/datasets/mjrfmvsh7d/1"

    log "Dataset C: Cheating Scenario Dataset in Online Exam"
    log "  Mendeley DOI: $doi"
    log "  License: CC BY 4.0 (confirmed)"
    log "  Destination: $dest"

    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Manual download from $mendeley_url → extract to $dest"
        return
    fi

    warn "Mendeley Data does not support direct CLI download."
    warn "Manual download required: open $mendeley_url in a browser."
    warn "After downloading, extract the archive to: $dest"
}

# ---------------------------------------------------------------------------
# Dataset D: Online Exam Cheating Detection (Roboflow)
# ---------------------------------------------------------------------------
download_roboflow() {
    local dest="$DATASETS_DIR/raw/roboflow_exam"
    local project="fraud-detection-using-cnn/online-exam-cheating-detection"

    log "Dataset D: Online Exam Cheating Detection (Roboflow)"
    log "  Project: $project"
    log "  Destination: $dest"

    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Roboflow export of $project → $dest (YOLO format preferred)"
        return
    fi

    if [ -z "${ROBOTFLOW_API_KEY:-}" ]; then
        warn "ROBOTFLOW_API_KEY not set. Skipping Roboflow download."
        warn "  Set it in your environment or visit: https://universe.roboflow.com/$project"
        return
    fi

    warn "Automated Roboflow download requires the roboflow Python package."
    warn "Install with: pip install roboflow"
    warn "Then run:"
    warn "  python -c \"from roboflow import Roboflow; rf = Roboflow(api_key='\$ROBOTFLOW_API_KEY');"
    warn "  project = rf.workspace('fraud-detection-using-cnn').project('online-exam-cheating-detection');"
    warn "  dataset = project.version(1).download('yolov11', location='$dest')\""
}

# ---------------------------------------------------------------------------
# Dataset E: SCB-Dataset5
# ---------------------------------------------------------------------------
download_scb() {
    local dest="$DATASETS_DIR/raw/scb_dataset"
    local repo_url="https://github.com/Whiffe/SCB-dataset"
    local hf_url="https://huggingface.co/datasets/Whiffe/SCB-dataset"

    log "Dataset E: SCB-Dataset5"
    log "  GitHub: $repo_url"
    log "  HuggingFace: $hf_url"
    log "  Destination: $dest"

    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] git clone $repo_url \"$dest/repo\""
        return
    fi

    warn "SCB-Dataset5 requires manual inspection of usage terms before download."
    warn "Repository: $repo_url"
    warn "HuggingFace mirror: $hf_url"
    warn ""
    warn "To clone: git clone $repo_url \"$dest/repo\""
    warn "Treat as academic/non-commercial unless written permission obtained."
}

# ===========================================================================
# Main
# ===========================================================================

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        --dataset) TARGET_DATASET="$2"; shift 2 ;;
        --help|-h) usage ;;
        *) fail "Unknown option: $1. Use --help for usage." ;;
    esac
done

log "===== Vigil Dataset Download ====="
log "Root: $ROOT_DIR"
log "Dry run: $DRY_RUN"
log "Target: $TARGET_DATASET"

check_kaggle

case "$TARGET_DATASET" in
    all)
        download_oep
        download_cctv
        download_cheating
        download_roboflow
        download_scb
        ;;
    oep)       download_oep ;;
    cctv)      download_cctv ;;
    cheating)  download_cheating ;;
    roboflow)  download_roboflow ;;
    scb)       download_scb ;;
    *) fail "Unknown dataset: $TARGET_DATASET. Valid: oep, cctv, cheating, roboflow, scb, all" ;;
esac

log "===== Download phase complete ====="
log "Next: run scripts/prepare_vigil_dataset.py"
