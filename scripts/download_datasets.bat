@echo off
REM download_datasets.ps1 — Windows PowerShell wrapper for Vigil dataset downloads
REM
REM Usage:
REM   powershell -ExecutionPolicy Bypass -File scripts/download_datasets.ps1
REM   powershell -ExecutionPolicy Bypass -File scripts/download_datasets.ps1 -DryRun

powershell -ExecutionPolicy Bypass -File "%~dp0download_datasets.ps1" %*
