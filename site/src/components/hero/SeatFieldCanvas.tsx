"use client";

import { useEffect, useRef } from "react";

interface Seat {
  row: number;
  col: number;
  id: string;
  occupied: boolean;
  degraded?: boolean;
  attentionPhase: number;
  attentionBase: number;
}

const ROWS = 4;
const COLS = 4;
const TILE_W = 96;
const TILE_H = 48;
const CANVAS_W = 760;
const CANVAS_H = 560;
const ORIGIN_X = CANVAS_W / 2;
const ORIGIN_Y = 150;

function colLetter(row: number) {
  return String.fromCharCode(65 + row); // A, B, C, D
}

function buildSeats(): Seat[] {
  const seats: Seat[] = [];
  const emptySeats = new Set(["A1", "D4"]);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = `${colLetter(row)}${col + 1}`;
      seats.push({
        row,
        col,
        id,
        occupied: !emptySeats.has(id),
        degraded: id === "D1",
        attentionPhase: (row * COLS + col) * 0.7,
        attentionBase: 0.25 + ((row + col) % 3) * 0.18,
      });
    }
  }
  return seats;
}

function isoProject(row: number, col: number) {
  const x = ORIGIN_X + (col - row) * (TILE_W / 2);
  const y = ORIGIN_Y + (col + row) * (TILE_H / 2);
  return { x, y };
}

function readToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Reciprocal-edge lifecycle: fade in, hold, fade out, pause, repeat. */
function edgeOpacity(t: number) {
  const cycle = 9000; // ms
  const phase = t % cycle;
  if (phase < 2000) return phase / 2000;
  if (phase < 4000) return 1;
  if (phase < 6000) return 1 - (phase - 4000) / 2000;
  return 0;
}

export function SeatFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seatsRef = useRef<Seat[]>(buildSeats());

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
      surface1: readToken("--surface-1", "#ffffff"),
      surface2: readToken("--surface-2", "#e7eaea"),
      lineSubtle: readToken("--line-subtle", "#d7dcdd"),
      lineStrong: readToken("--line-strong", "#0b0f12"),
      ink: readToken("--ink-primary", "#0b0f12"),
      inkSecondary: readToken("--ink-secondary", "#565f68"),
      attention: readToken("--attention", "#1fd6e0"),
      unobservable: readToken("--unobservable", "#8b93a0"),
    };

    let raf = 0;
    let visible = true;
    let start = performance.now();

    function drawFrustum(t: number) {
      ctx!.save();
      ctx!.strokeStyle = colors.lineSubtle;
      ctx!.lineWidth = 1;
      const camX = ORIGIN_X;
      const camY = 18;
      const spread = 210 + Math.sin(t / 4000) * 6;
      ctx!.beginPath();
      ctx!.moveTo(camX, camY);
      ctx!.lineTo(camX - spread, ORIGIN_Y - 10);
      ctx!.moveTo(camX, camY);
      ctx!.lineTo(camX + spread, ORIGIN_Y - 10);
      ctx!.stroke();
      ctx!.setLineDash([]);
      ctx!.fillStyle = colors.lineStrong;
      ctx!.beginPath();
      ctx!.arc(camX, camY, 4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.font = "11px var(--font-mono), monospace";
      ctx!.fillStyle = colors.inkSecondary;
      ctx!.fillText("CAM-A · frustum", camX + 10, camY + 4);
      ctx!.restore();
    }

    function drawHeat(seat: Seat, x: number, y: number, t: number) {
      const wobble = reducedMotion ? 0 : Math.sin(t / 1400 + seat.attentionPhase) * 0.5 + 0.5;
      const intensity = seat.attentionBase + wobble * 0.25;
      if (!seat.occupied || seat.degraded) return;
      const radius = TILE_W * 0.9;
      const gradient = ctx!.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, hexToRgba(colors.attention, intensity * 0.35));
      gradient.addColorStop(1, hexToRgba(colors.attention, 0));
      ctx!.fillStyle = gradient;
      ctx!.beginPath();
      ctx!.ellipse(x, y, radius, radius * 0.55, 0, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawSeatTile(seat: Seat, x: number, y: number) {
      ctx!.save();
      ctx!.beginPath();
      ctx!.moveTo(x, y - TILE_H / 2);
      ctx!.lineTo(x + TILE_W / 2, y);
      ctx!.lineTo(x, y + TILE_H / 2);
      ctx!.lineTo(x - TILE_W / 2, y);
      ctx!.closePath();
      ctx!.fillStyle = seat.degraded ? colors.surface2 : colors.surface1;
      ctx!.fill();
      ctx!.strokeStyle = colors.lineSubtle;
      ctx!.lineWidth = 1;
      ctx!.stroke();
      ctx!.restore();
    }

    function drawStudent(seat: Seat, x: number, y: number, t: number) {
      if (!seat.occupied) return;
      const deskY = y - 6;
      ctx!.save();

      if (seat.degraded) {
        ctx!.globalAlpha = 0.45;
      }

      // desk
      ctx!.strokeStyle = colors.lineStrong;
      ctx!.lineWidth = 1;
      ctx!.strokeRect(x - 20, deskY - 8, 40, 16);

      // torso node
      ctx!.fillStyle = colors.ink;
      ctx!.beginPath();
      ctx!.arc(x, deskY - 22, 6, 0, Math.PI * 2);
      ctx!.fill();

      // head-direction ray (breathing)
      const sway = reducedMotion ? 0 : Math.sin(t / 1800 + seat.attentionPhase) * 8;
      ctx!.strokeStyle = seat.degraded ? colors.unobservable : colors.attention;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.moveTo(x, deskY - 22);
      ctx!.lineTo(x + sway, deskY - 40);
      ctx!.stroke();

      ctx!.restore();

      if (seat.degraded) {
        ctx!.save();
        ctx!.font = "9px var(--font-mono), monospace";
        ctx!.fillStyle = colors.unobservable;
        ctx!.textAlign = "center";
        ctx!.fillText("VISIBILITY LOW", x, deskY + 22);
        ctx!.restore();
      }
    }

    function drawSeatLabel(seat: Seat, x: number, y: number) {
      ctx!.save();
      ctx!.font = "10px var(--font-mono), monospace";
      ctx!.fillStyle = colors.inkSecondary;
      ctx!.textAlign = "center";
      ctx!.fillText(seat.id, x, y + TILE_H / 2 + 14);
      ctx!.restore();
    }

    function drawReciprocalEdge(t: number) {
      const seatA = seatsRef.current.find((s) => s.id === "B3");
      const seatB = seatsRef.current.find((s) => s.id === "C2");
      if (!seatA || !seatB) return;
      const a = isoProject(seatA.row, seatA.col);
      const b = isoProject(seatB.row, seatB.col);
      const alpha = reducedMotion ? 0.85 : edgeOpacity(t);
      if (alpha <= 0.01) return;

      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.strokeStyle = colors.attention;
      ctx!.lineWidth = 1.5;
      ctx!.setLineDash([4, 4]);
      ctx!.lineDashOffset = reducedMotion ? 0 : -(t / 40) % 8;
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y - 26);
      ctx!.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 60, b.x, b.y - 26);
      ctx!.stroke();
      ctx!.setLineDash([]);

      ctx!.fillStyle = colors.attention;
      ctx!.beginPath();
      ctx!.arc(a.x, a.y - 26, 3, 0, Math.PI * 2);
      ctx!.arc(b.x, b.y - 26, 3, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.font = "10px var(--font-mono), monospace";
      ctx!.textAlign = "center";
      ctx!.fillText(
        "reciprocal · B3 ↔ C2",
        (a.x + b.x) / 2,
        Math.min(a.y, b.y) - 66
      );
      ctx!.restore();
    }

    function render(now: number) {
      const t = now - start;
      ctx!.clearRect(0, 0, CANVAS_W, CANVAS_H);

      drawFrustum(t);

      const seats = seatsRef.current;
      const sorted = [...seats].sort((a, b) => a.row + a.col - (b.row + b.col));

      for (const seat of sorted) {
        const { x, y } = isoProject(seat.row, seat.col);
        drawHeat(seat, x, y, t);
      }
      for (const seat of sorted) {
        const { x, y } = isoProject(seat.row, seat.col);
        drawSeatTile(seat, x, y);
        drawStudent(seat, x, y, t);
        drawSeatLabel(seat, x, y);
      }

      drawReciprocalEdge(t);

      if (visible && !reducedMotion) {
        raf = requestAnimationFrame(render);
      }
    }

    raf = requestAnimationFrame(render);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reducedMotion) {
          start = performance.now() - 0;
          raf = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    if (reducedMotion) {
      render(0);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "auto", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        role="img"
        aria-describedby="seat-field-summary"
      />
      <p id="seat-field-summary" className="sr-only">
        Isometric diagram of a sixteen-seat examination hall. Fourteen seats are occupied by
        anonymous skeleton silhouettes with soft attention beams; one seat, D1, is shown in a
        degraded, low-visibility state. A dashed reciprocal edge periodically highlights a
        two-seat behavioural relationship between seats B3 and C2, labelled with an evidence
        preview. A camera frustum from the top of the frame indicates the coverage area.
      </p>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
