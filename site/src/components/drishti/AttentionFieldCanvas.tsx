"use client";

import { useEffect, useRef } from "react";

const ROWS = 4;
const COLS = 5;
const CANVAS_W = 640;
const CANVAS_H = 480;
const PAD = 60;

function readToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Top-down room-level attention field: a seat grid with a pulsing heat
 * overlay driven by per-seat phase, distinct in composition from the
 * homepage's isometric hero (this is /drishti's own visual, not a repeat).
 */
export function AttentionFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    const colors = {
      attention: readToken("--attention", "#1fd6e0"),
      lineSubtle: readToken("--line-subtle", "#d7dcdd"),
      lineStrong: readToken("--line-strong", "#0b0f12"),
      inkSecondary: readToken("--ink-secondary", "#565f68"),
      unobservable: readToken("--unobservable", "#8b93a0"),
    };

    const cellW = (CANVAS_W - PAD * 2) / COLS;
    const cellH = (CANVAS_H - PAD * 2) / ROWS;

    const seats = Array.from({ length: ROWS * COLS }, (_, i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      return {
        row,
        col,
        phase: i * 0.6,
        base: 0.3 + ((row + col) % 3) * 0.2,
        degraded: row === ROWS - 1 && col === COLS - 1,
      };
    });

    let raf = 0;
    let visible = true;
    const start = performance.now();

    function render(now: number) {
      const t = now - start;
      ctx!.clearRect(0, 0, CANVAS_W, CANVAS_H);

      for (const seat of seats) {
        const x = PAD + seat.col * cellW + cellW / 2;
        const y = PAD + seat.row * cellH + cellH / 2;
        if (!seat.degraded) {
          const wobble = reducedMotion ? 0.6 : Math.sin(t / 1500 + seat.phase) * 0.5 + 0.5;
          const intensity = seat.base + wobble * 0.3;
          const radius = Math.max(cellW, cellH) * 1.1;
          const gradient = ctx!.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, hexToRgba(colors.attention, intensity * 0.4));
          gradient.addColorStop(1, hexToRgba(colors.attention, 0));
          ctx!.fillStyle = gradient;
          ctx!.beginPath();
          ctx!.arc(x, y, radius, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      for (const seat of seats) {
        const x = PAD + seat.col * cellW;
        const y = PAD + seat.row * cellH;
        ctx!.strokeStyle = colors.lineSubtle;
        ctx!.lineWidth = 1;
        ctx!.strokeRect(x + 4, y + 4, cellW - 8, cellH - 8);

        if (seat.degraded) {
          ctx!.fillStyle = hexToRgba(colors.unobservable, 0.15);
          ctx!.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
        }

        ctx!.fillStyle = colors.lineStrong;
        ctx!.beginPath();
        ctx!.arc(x + cellW / 2, y + cellH / 2, 4, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.font = "10px var(--font-mono), monospace";
        ctx!.fillStyle = colors.inkSecondary;
        ctx!.textAlign = "center";
        const rowLetter = String.fromCharCode(65 + seat.row);
        ctx!.fillText(`${rowLetter}${seat.col + 1}`, x + cellW / 2, y + cellH - 10);
      }

      if (visible && !reducedMotion) raf = requestAnimationFrame(render);
    }

    raf = requestAnimationFrame(render);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reducedMotion) raf = requestAnimationFrame(render);
      else cancelAnimationFrame(raf);
    });
    observer.observe(canvas);

    if (reducedMotion) render(0);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "auto", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        role="img"
        aria-describedby="attention-field-summary"
      />
      <p id="attention-field-summary" className="sr-only">
        Top-down diagram of a twenty-seat room. Each seat shows a pulsing cyan attention field of
        varying intensity; one back-corner seat, D5, is shown desaturated to represent a
        visibility-degraded, unobservable state.
      </p>
    </div>
  );
}
