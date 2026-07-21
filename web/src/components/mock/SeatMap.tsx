import type { DemoSeat } from "../../content/demo";
import { seatStateLabels } from "../../content/demo";
import { seatStateStyles } from "./tokens";

/**
 * SeatMap — VIGIL's booking-widget equivalent.
 * Hall grid with mono seat IDs, tier badges, state fills + text labels
 * (never colour alone), and the C7↔C8 reciprocal edge. Pure SVG.
 */
export function SeatMap({
  seats,
  highlightPair = ["C7", "C8"],
  showTiers = true,
  showEdge = true,
  compact = false,
  labelledBy,
}: {
  seats: DemoSeat[];
  highlightPair?: [string, string];
  showTiers?: boolean;
  showEdge?: boolean;
  compact?: boolean;
  labelledBy?: string;
}) {
  const rows = Math.max(...seats.map((s) => s.row)) + 1;
  const cols = Math.max(...seats.map((s) => s.col)) + 1;
  const cell = compact ? 44 : 56;
  const gap = compact ? 6 : 8;
  const pad = compact ? 12 : 16;
  const w = pad * 2 + cols * cell + (cols - 1) * gap;
  const h = pad * 2 + rows * cell + (rows - 1) * gap;

  const center = (seat: DemoSeat) => ({
    x: pad + seat.col * (cell + gap) + cell / 2,
    y: pad + seat.row * (cell + gap) + cell / 2,
  });

  const a = seats.find((s) => s.id === highlightPair[0]);
  const b = seats.find((s) => s.id === highlightPair[1]);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-labelledby={labelledBy}
      aria-label={`Examination hall seat map, ${rows} rows by ${cols} seats`}
      className="h-auto w-full"
      style={{ maxWidth: w }}
    >
      <defs>
        <pattern id="unobs-diag" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="var(--unobservable-soft)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--unobservable)" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      {/* reciprocal edge under the cells */}
      {showEdge && a && b && (
        <g aria-hidden="true">
          <line
            x1={center(a).x}
            y1={center(a).y}
            x2={center(b).x}
            y2={center(b).y}
            stroke="var(--attention)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.9"
          />
          <circle cx={center(a).x} cy={center(a).y} r="3.5" fill="var(--attention)" opacity="0.25" />
          <circle cx={center(b).x} cy={center(b).y} r="3.5" fill="var(--attention)" opacity="0.25" />
        </g>
      )}

      {seats.map((seat) => {
        const st = seatStateStyles[seat.state];
        const x = pad + seat.col * (cell + gap);
        const y = pad + seat.row * (cell + gap);
        const isPair = highlightPair.includes(seat.id);
        return (
          <g key={seat.id}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx="var(--radius-sm)"
              fill={seat.state === "normal" ? "var(--surface-card)" : seat.state === "unobservable" ? "url(#unobs-diag)" : st.soft}
              stroke={isPair ? "var(--attention)" : seat.state === "normal" ? "var(--line-subtle)" : st.fill}
              strokeWidth={isPair ? 1.5 : 1}
            />
            <text
              x={x + cell / 2}
              y={y + cell / 2 + (showTiers && !compact ? -2 : 4)}
              textAnchor="middle"
              fontSize={compact ? 11 : 13}
              fontFamily="var(--font-mono)"
              fill="var(--ink-primary)"
            >
              {seat.id}
            </text>
            {showTiers && !compact && (
              <text
                x={x + cell / 2}
                y={y + cell - 8}
                textAnchor="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fill="var(--ink-muted)"
              >
                {seat.state === "unobservable" ? "—" : `T${seat.tier}`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function SeatMapLegend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`} aria-label="Seat state legend">
      {(["normal", "review", "high-review", "unobservable"] as const).map((s) => (
        <li key={s} className="flex items-center gap-1.5 text-[length:0.75rem] text-[var(--ink-secondary)]">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{
              background: seatStateStyles[s].soft,
              border: `1px solid ${seatStateStyles[s].fill}`,
            }}
          />
          {seatStateLabels[s]}
        </li>
      ))}
    </ul>
  );
}
