#requires -Version 5.1
<#
.SYNOPSIS
    Download Vigil exam-hall surveillance datasets (Windows PowerShell version).

.DESCRIPTION
    Downloads priority datasets for the Vigil project.
    Credentials are read from environment variables or local config files.

.PARAMETER Dataset
    Download only one dataset: oep, cctv, cheating, roboflow, scb

.PARAMETER DryRun
    Show what would be downloaded without downloading

.PARAMETER Help
    Show usage

.EXAMPLE
    .\scripts\download_datasets.ps1
    .\scripts\download_datasets.ps1 -Dataset cctv
    .\scripts\download_datasets.ps1 -DryRun
#>
param(
    [ValidateSet("all", "oep", "cctv", "cheating", "roboflow", "scb")]
    [string]$Dataset = "all",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$DatasetsDir = Join-Path $Root "datasets"

function Log($msg) {
    Write-Host ("[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $msg)
}

function Warn($msg) {
    Write-Warning $msg
}

function Test-KaggleAuth {
    if (-not (Get-Command kaggle -ErrorAction SilentlyContinue)) {
        throw "kaggle CLI not found. Install with: pip install kaggle"
    }

    $envKaggleUser = [Environment]::GetEnvironmentVariable("KAGGLE_USERNAME")
    $kaggleJson = Join-Path $env:USERPROFILE ".kaggle\kaggle.json"

    if (-not $envKaggleUser -and -not (Test-Path $kaggleJson)) {
        Warn "Kaggle credentials not found. Set KAGGLE_USERNAME/KAGGLE_KEY or create $kaggleJson"
        Warn "Get your token: https://www.kaggle.com/settings/account"
    }
}

function Download-OEP {
    Log "Dataset A: MSU Online Exam Proctoring (OEP)"
    Log "  Kaggle: raajanwankhade/oep-dataset"
    $dest = Join-Path $DatasetsDir "raw\oep"

    if ($DryRun) {
        Log "  [DRY RUN] kaggle datasets download -d raajanwankhade/oep-dataset -p $dest --unzip"
        return
    }

    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    kaggle datasets download -d raajanwankhade/oep-dataset -p $dest --unzip
}

function Download-CCTV {
    Log "Dataset B: CCTV Exam Monitor Dataset"
    Log "  Kaggle: cctvdataset/cctv-exam-monitor-dataset"
    Log "  License: CC0 — Public Domain"
    $dest = Join-Path $DatasetsDir "raw\cctv_exam_monitor"
    $zipPath = Join-Path $Root "backend\data\cctv_exam_monitor_dataset.zip"

    if ($DryRun) {
        Log "  [DRY RUN] Extract $zipPath -> $dest"
        return
    }

    New-Item -ItemType Directory -Path $dest -Force | Out-Null

    if (Test-Path $zipPath) {
        Log "  Extracting existing archive: $zipPath"
        python -c "import zipfile; zipfile.ZipFile(r'$zipPath').extractall(r'$dest')"
    } else {
        Log "  Downloading from Kaggle..."
        kaggle datasets download -d cctvdataset/cctv-exam-monitor-dataset -p $dest --unzip
    }
}

function Download-Cheating {
    Log "Dataset C: Cheating Scenario Dataset (Mendeley)"
    Log "  DOI: 10.17632/mjrfmvsh7d.1"
    Log "  License: CC BY 4.0"
    Warn "Mendeley Data requires manual browser download."
    Warn "  URL: https://data.mendeley.com/datasets/mjrfmvsh7d/1"
    Warn "  Extract to: $(Join-Path $DatasetsDir 'raw\cheating_scenarios')"
}

function Download-Roboflow {
    Log "Dataset D: Online Exam Cheating Detection (Roboflow)"
    Log "  Project: fraud-detection-using-cnn/online-exam-cheating-detection"
    $apiKey = [Environment]::GetEnvironmentVariable("ROBOTFLOW_API_KEY")
    if (-not $apiKey) {
        Warn "ROBOTFLOW_API_KEY not set. Skipping Roboflow download."
        Warn "  Visit: https://universe.roboflow.com/fraud-detection-using-cnn/online-exam-cheating-detection"
        return
    }
    Warn "Automated Roboflow download requires the roboflow Python package."
}

function Download-SCB {
    Log "Dataset E: SCB-Dataset5 (HuggingFace)"
    Log "  Repository: wintonYF/SCB-Dataset"
    Log "  License: Research/Academic use only"
    $dest = Join-Path $DatasetsDir "raw\scb_dataset"

    if ($DryRun) {
        Log "  [DRY RUN] python download_scb_huggingface.py --local-dir $dest"
        return
    }

    $script = Join-Path $dest "download_scb_huggingface.py"
    if (Test-Path $script) {
        python $script --local-dir $dest
    } else {
        Warn "SCB download script not found: $script"
        Warn "To download: git clone https://github.com/Whiffe/SCB-dataset.git $dest"
    }
}

# ===========================================================================
Log "===== Vigil Dataset Download (Windows) ====="
Log "Dataset target: $Dataset"
Log "Dry run: $DryRun"

Test-KaggleAuth

switch ($Dataset) {
    "all" {
        Download-OEP
        Download-CCTV
        Download-Cheating
        Download-Roboflow
        Download-SCB
    }
    "oep"       { Download-OEP }
    "cctv"      { Download-CCTV }
    "cheating"  { Download-Cheating }
    "roboflow"  { Download-Roboflow }
    "scb"       { Download-SCB }
}

Log "===== Download phase complete ====="
