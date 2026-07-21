import { HealthChip } from "./HealthChip";

/** 01 OBSERVE — stream ingest chip with FPS + resolution + pose dots. */
export function StreamMock() {
  return (
    <div className="card p-4" role="img" aria-label="Live stream ingest: RTSP source at 1080p, 12.4 frames per second, pose keypoints extracted">
      <div className="flex items-center justify-between gap-2">
        <HealthChip id="CAM-A" fps={12.4} resolution="1080p" />
        <span className="mono rounded-[var(--radius-sm)] bg-[var(--surface-inset)] px-2 py-1 text-[length:0.75rem] text-[var(--ink-secondary)]">
          rtsp://hall-a
        </span>
      </div>
      {/* pose keypoint frame */}
      <div className="mt-3 flex h-36 items-end justify-center gap-6 rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--surface-inset)] p-4">
        {[0.9, 0.7, 1].map((s, i) => (
          <svg key={i} width={44 * s} height={88 * s} viewBox="0 0 44 88" fill="none" aria-hidden="true">
            <circle cx="22" cy="12" r="7" stroke="var(--ink-secondary)" strokeWidth="1.4" />
            <path d="M22 20v28M22 28l-10 10M22 28l10 10M22 48l-8 30M22 48l8 30" stroke="var(--ink-secondary)" strokeWidth="1.4" strokeLinecap="round" />
            {[[22, 20], [22, 28], [12, 38], [32, 38], [22, 48], [14, 78], [30, 78]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="var(--attention)" />
            ))}
          </svg>
        ))}
      </div>
      <div className="mono mt-2 flex justify-between text-[length:0.6875rem] text-[var(--ink-muted)]">
        <span>17 keypoints/person</span>
        <span>3 tracks active</span>
      </div>
    </div>
  );
}

/** 02 ANCHOR — tracks snapping to fixed seat polygons. */
export function AnchorMock() {
  return (
    <div className="card p-4" role="img" aria-label="Seat anchoring: tracked people bind to fixed seat polygons">
      <svg viewBox="0 0 320 180" className="h-auto w-full" aria-hidden="true">
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={16 + c * 76}
              y={14 + r * 56}
              width="64"
              height="44"
              rx="6"
              fill={r === 1 && c === 1 ? "var(--attention-soft)" : "var(--surface-inset)"}
              stroke={r === 1 && c === 1 ? "var(--attention)" : "var(--line-subtle)"}
              strokeDasharray={r === 1 && c === 1 ? "0" : "3 3"}
            />
          ))
        )}
        {/* track dot snapping into the highlighted polygon */}
        <circle cx="124" cy="80" r="6" fill="var(--attention)" opacity="0.9" />
        <circle cx="124" cy="80" r="11" fill="none" stroke="var(--attention)" strokeWidth="1.2" opacity="0.5" />
        <text x="48" y="86" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">B2</text>
        <text x="96" y="130" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-muted)">track #7 → seat B2</text>
      </svg>
      <div className="mono mt-2 flex justify-between text-[length:0.6875rem] text-[var(--ink-muted)]">
        <span>sticky-frame hysteresis</span>
        <span>occlusion hold 1.5 s</span>
      </div>
    </div>
  );
}

/** 03 ESTIMATE — attention heat field over the seat map. */
export function HeatMock() {
  return (
    <div className="card p-4" role="img" aria-label="Attention estimation: a soft heat field accumulates over the seat map">
      <svg viewBox="0 0 320 180" className="h-auto w-full" aria-hidden="true">
        <defs>
          <radialGradient id="heat1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--attention)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--attention)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--attention)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--attention)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}-${c}`} x={16 + c * 76} y={14 + r * 56} width="64" height="44" rx="6" fill="var(--surface-inset)" stroke="var(--line-subtle)" />
          ))
        )}
        <ellipse cx="124" cy="92" rx="90" ry="46" fill="url(#heat1)" />
        <ellipse cx="240" cy="40" rx="70" ry="36" fill="url(#heat2)" />
        <text x="104" y="96" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-primary)">0.82</text>
        <text x="230" y="44" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">0.41</text>
      </svg>
      <div className="mono mt-2 flex justify-between text-[length:0.6875rem] text-[var(--ink-muted)]">
        <span>gaze-mass per seat</span>
        <span>rolling 90 s window</span>
      </div>
    </div>
  );
}

/** 04 CORRELATE — two seat nodes and a reciprocal edge. */
export function PairMock() {
  return (
    <div className="card p-4" role="img" aria-label="Seat graph correlation: seats C7 and C8 linked by a reciprocal attention edge">
      <svg viewBox="0 0 320 160" className="h-auto w-full" aria-hidden="true">
        <defs>
          <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0l8 4-8 4z" fill="var(--attention)" />
          </marker>
        </defs>
        <circle cx="90" cy="80" r="26" fill="var(--review-soft)" stroke="var(--review)" />
        <circle cx="230" cy="80" r="26" fill="var(--review-soft)" stroke="var(--review)" />
        <text x="90" y="85" textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill="var(--ink-primary)">C7</text>
        <text x="230" y="85" textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill="var(--ink-primary)">C8</text>
        <path d="M116 70 C 150 50, 170 50, 204 70" fill="none" stroke="var(--attention)" strokeWidth="1.6" markerEnd="url(#arr)" />
        <path d="M204 92 C 170 112, 150 112, 116 92" fill="none" stroke="var(--attention)" strokeWidth="1.6" markerEnd="url(#arr)" />
        <text x="160" y="42" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">3 × 2.0 s avg</text>
        <text x="160" y="130" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">response 4 s</text>
      </svg>
      <div className="mono mt-2 flex justify-between text-[length:0.6875rem] text-[var(--ink-muted)]">
        <span>directed edges, time-decayed</span>
        <span>reciprocal → pair evidence</span>
      </div>
    </div>
  );
}
