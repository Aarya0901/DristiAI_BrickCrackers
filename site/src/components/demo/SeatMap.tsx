"use client";

import type { DemoSeat } from "@/content/demo";
import { cn } from "@/lib/cn";

interface SeatMapProps {
  seats: DemoSeat[];
  attentionLens: boolean;
  selectedSeat?: string | null;
  onSelectSeat?: (id: string) => void;
}

const stateStyles: Record<string, string> = {
  normal: "border-[var(--line-strong)] bg-[var(--surface-1)]",
  review: "border-[var(--review)] bg-[var(--review-soft)]",
  "high-review": "border-[var(--high-review)] bg-[var(--high-review-soft)]",
  unobservable: "border-[var(--unobservable)] bg-[var(--unobservable-soft)]",
};

const stateLabels: Record<string, string> = {
  normal: "Normal",
  review: "Review",
  "high-review": "High review",
  unobservable: "Unobservable",
};

export function SeatMap({ seats, attentionLens, selectedSeat, onSelectSeat }: SeatMapProps) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2.5">
        {seats.map((seat) => (
          <button
            key={seat.id}
            type="button"
            onClick={() => onSelectSeat?.(seat.id)}
            className={cn(
              "relative flex aspect-square flex-col items-center justify-center gap-1 border-2 transition-[transform,border-color] duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
              stateStyles[seat.state],
              selectedSeat === seat.id ? "border-[var(--brand-cobalt)]" : "",
              onSelectSeat && "hover:-translate-y-0.5"
            )}
            aria-pressed={selectedSeat === seat.id}
            aria-label={`Seat ${seat.id}, ${stateLabels[seat.state]}`}
          >
            {attentionLens && seat.state !== "unobservable" && (
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle, var(--attention-soft) 0%, transparent 70%)`,
                  opacity: seat.attention,
                }}
              />
            )}
            <span className="relative font-mono text-[13px] font-medium">{seat.id}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(stateLabels).map(([key, label]) => (
          <span key={key} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            <span aria-hidden className={cn("h-2.5 w-2.5 border-2", stateStyles[key])} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
