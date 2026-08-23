"""
common/logging_utils.py
========================
One consistent logger factory for every phase script: console output plus an
optional per-run log file, so box counts / missing-label warnings / skipped
frames all land somewhere reviewable after the run finishes.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from datetime import datetime


def setup_logger(name: str, log_dir: Path | None = None, level: int = logging.INFO) -> logging.Logger:
    """
    Create (or fetch) a logger named `name` with a console handler and,
    if `log_dir` is given, a timestamped file handler under that directory.
    Safe to call multiple times for the same name (won't duplicate handlers).
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if logger.handlers:
        # Already configured (e.g. re-imported in the same process) — don't stack handlers.
        return logger

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler(stream=sys.stdout)
    console.setFormatter(fmt)
    console.setLevel(level)
    logger.addHandler(console)

    if log_dir is not None:
        log_dir = Path(log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_path = log_dir / f"{name}_{ts}.log"
        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setFormatter(fmt)
        file_handler.setLevel(level)
        logger.addHandler(file_handler)
        logger.info("Logging to file: %s", log_path)

    logger.propagate = False
    return logger


class Counter:
    """Tiny helper for tallying named events (e.g. 'skipped_corrupt_frame')
    and dumping a summary at the end of a run — cheaper than sprinkling
    ad-hoc int variables through a script."""

    def __init__(self):
        self._counts: dict[str, int] = {}

    def inc(self, key: str, n: int = 1) -> None:
        self._counts[key] = self._counts.get(key, 0) + n

    def get(self, key: str) -> int:
        return self._counts.get(key, 0)

    def as_dict(self) -> dict:
        return dict(self._counts)

    def log_summary(self, logger: logging.Logger, title: str = "Run summary") -> None:
        logger.info("---- %s ----", title)
        if not self._counts:
            logger.info("(no counters recorded)")
            return
        width = max(len(k) for k in self._counts)
        for k in sorted(self._counts):
            logger.info("%s : %d", k.ljust(width), self._counts[k])
