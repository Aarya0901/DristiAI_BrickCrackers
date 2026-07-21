"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HeroStage — isometric-lite examination hall.
 * 24 anonymous seats, soft attention beams, a low-amplitude room heat field,
 * the C7↔C8 reciprocal edge, one visibility-degraded grey seat, a camera
 * frustum. Animated by CSS (time-driven), paused offscreen via
 * IntersectionObserver, static under prefers-reduced-motion.
 */

// iso projection: 3 rows × 8 cols
const COLS = 8;
const ROWS = 3;
const OX = 360; // origin x
const OY = 120; // origin y
const WX = 76; // x basis
const WY = 40; // y basis (per axis)

function iso(col: number, row: number) {
  return { x: OX + (col - row) * (WX / 2), y: OY + (col + row) * (WY / 2) };
}

const seatId = (row: number, col: number) => `${String.fromCharCode(65 + row)}${col + 1}`;

export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const seats: { id: string; x: number; y: number; state: "normal" | "pair" | "unobservable" }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = seatId(r, c);
      const { x, y } = iso(c, r);
      seats.push({
        id,
        x,
        y,
        state: id === "C7" || id === "C8" ? "pair" : id === "A8" ? "unobservable" : "normal",
      });
    }
  }
  const c7 = seats.find((s) => s.id === "C7")!;
  const c8 = seats.find((s) => s.id === "C8")!;

  // floor corners
  const f0 = iso(0, 0);
  const f1 = iso(COLS - 1, 0);
  const f2 = iso(COLS - 1, ROWS - 1);
  const f3 = iso(0, ROWS - 1);
  const cam = { x: 96, y: 36 };

  return (
    <div
      ref={ref}
      className={onScreen ? "hero-stage is-live" : "hero-stage"}
      role="img"
      aria-label="Simulated examination hall: a field of anonymous seats with soft attention beams, a highlighted pair of seats C7 and C8 exchanging attention, one grey unobservable seat, and a camera frustum in the corner."
    >
      <svg viewBox="0 0 720 420" className="h-auto w-full" aria-hidden="true">
        <defs>
          <radialGradient id="hg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--attention)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--attention)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--attention)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--attention)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--attention)" stopOpacity="0" />
            <stop offset="55%" stopColor="var(--attention)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--attention)" stopOpacity="0.85" />
          </linearGradient>
          <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="var(--unobservable-soft)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--unobservable)" strokeWidth="1" opacity="0.45" />
          </pattern>
        </defs>

        {/* floor */}
        <polygon
          points={`${f0.x - 48},${f0.y - 24} ${f1.x + 48},${f1.y - 24} ${f2.x + 48},${f2.y + 40} ${f3.x - 48},${f3.y + 40}`}
          fill="var(--surface-card)"
          stroke="var(--line-subtle)"
        />

        {/* heat field */}
        <ellipse className="heat heat-a" cx={iso(3, 1).x} cy={iso(3, 1).y + 8} rx="150" ry="62" fill="url(#hg1)" />
        <ellipse className="heat heat-b" cx={iso(6, 0).x} cy={iso(6, 0).y} rx="110" ry="48" fill="url(#hg2)" />

        {/* camera frustum */}
        <g stroke="var(--ink-muted)" strokeWidth="1" strokeDasharray="3 4" opacity="0.8">
          <line x1={cam.x} y1={cam.y} x2={f0.x - 48} y2={f0.y - 24} />
          <line x1={cam.x} y1={cam.y} x2={f2.x + 48} y2={f2.y + 40} />
          <line x1={cam.x} y1={cam.y} x2={f3.x - 48} y2={f3.y + 40} opacity="0.5" />
        </g>
        <g transform={`translate(${cam.x - 14}, ${cam.y - 10})`}>
          <rect width="28" height="20" rx="4" fill="var(--surface-card)" stroke="var(--ink-secondary)" />
          <circle cx="14" cy="10" r="5" fill="none" stroke="var(--ink-secondary)" />
          <circle cx="14" cy="10" r="1.6" fill="var(--attention)" />
        </g>
        <text x={cam.x + 24} y={cam.y - 12} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-muted)">
          CAM-A
        </text>

        {/* C7 ↔ C8 reciprocal edge */}
        <g className="pair-edge">
          <line x1={c7.x} y1={c7.y} x2={c8.x} y2={c8.y} stroke="var(--attention)" strokeWidth="1.6" strokeDasharray="5 4" />
        </g>

        {/* seats */}
        {seats.map((s) => (
          <g key={s.id}>
            <rect
              x={s.x - 30}
              y={s.y - 16}
              width="60"
              height="34"
              rx="7"
              fill={s.state === "unobservable" ? "url(#hatch)" : "var(--surface-card)"}
              stroke={s.state === "pair" ? "var(--attention)" : "var(--line-subtle)"}
              strokeWidth={s.state === "pair" ? 1.4 : 1}
            />
            {/* anonymous silhouette */}
            <circle
              cx={s.x - 16}
              cy={s.y - 3}
              r="5.5"
              fill={s.state === "unobservable" ? "var(--unobservable)" : s.state === "pair" ? "var(--attention)" : "var(--ink-secondary)"}
              opacity={s.state === "unobservable" ? 0.7 : 1}
            />
            <path
              d={`M ${s.x - 24} ${s.y + 12} q 8 -10 16 0`}
              fill={s.state === "unobservable" ? "var(--unobservable)" : s.state === "pair" ? "var(--attention)" : "var(--ink-secondary)"}
              opacity={s.state === "unobservable" ? 0.7 : 0.85}
            />
            <text x={s.x + 8} y={s.y + 5} fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">
              {s.id}
            </text>
          </g>
        ))}

        {/* attention beams: short on-desk beams for a few seats */}
        {[
          { from: iso(2, 1), to: { x: iso(2, 1).x + 26, y: iso(2, 1).y + 12 }, d: "b1" },
          { from: iso(5, 0), to: { x: iso(5, 0).x + 24, y: iso(5, 0).y + 12 }, d: "b2" },
          { from: iso(1, 2), to: { x: iso(1, 2).x + 24, y: iso(1, 2).y + 10 }, d: "b3" },
        ].map((b) => (
          <line
            key={b.d}
            className="beam"
            x1={b.from.x - 16}
            y1={b.from.y - 3}
            x2={b.to.x}
            y2={b.to.y}
            stroke="url(#beam)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ))}

        {/* C7 → C8 glance beam */}
        <line
          className="beam beam-strong"
          x1={c7.x - 14}
          y1={c7.y - 2}
          x2={c8.x - 20}
          y2={c8.y - 2}
          stroke="url(#beam)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>

      {/* floating evidence-card preview (DOM, like cal.com floats its widget) */}
      <div
        className="card absolute bottom-4 right-4 hidden w-[300px] p-3 sm:block"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        <div className="flex items-center justify-between">
          <span className="mono text-[length:0.6875rem] font-medium text-[var(--ink-primary)]">
            C7 ↔ C8 · reciprocal attention
          </span>
          <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[length:0.625rem] font-medium" style={{ background: "var(--review-soft)", color: "var(--review)" }}>
            review
          </span>
        </div>
        <div className="mono mt-2 space-y-1 text-[length:0.6875rem] text-[var(--ink-secondary)]">
          <div className="flex justify-between"><span>repetitions</span><span>3 / 90 s</span></div>
          <div className="flex justify-between"><span>visibility</span><span>0.86 · Tier B</span></div>
          <div className="flex justify-between"><span>confidence</span><span>0.81</span></div>
        </div>
        <div className="mt-2 border-t border-[var(--line-subtle)] pt-2 text-[length:0.6875rem] leading-snug text-[var(--ink-muted)]">
          A single brief glance would not have generated this request.
        </div>
      </div>
    </div>
  );
}
