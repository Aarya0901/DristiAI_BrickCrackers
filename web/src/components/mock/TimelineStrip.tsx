import { timelineEvents } from "../../content/demo";
import { seatStateStyles } from "./tokens";

/**
 * TimelineStrip — cal.com's calendar week view equivalent.
 * Per-seat event bands across a 90-minute session clock.
 */
const lanes: { seat: string; bands: { from: number; to: number; state: keyof typeof seatStateStyles }[] }[] = [
  { seat: "C7", bands: [{ from: 42, to: 48.5, state: "review" }] },
  { seat: "C8", bands: [{ from: 44, to: 48.5, state: "review" }] },
  { seat: "A4", bands: [{ from: 51.5, to: 55, state: "high-review" }] },
  { seat: "D2", bands: [{ from: 62.7, to: 63.2, state: "review" }] },
  { seat: "D5", bands: [{ from: 18, to: 90, state: "unobservable" }] },
];

const SPAN = 90; // minutes
const ticks = ["00:00", "00:15", "00:30", "00:45", "01:00", "01:15", "01:30"];

export function TimelineStrip({ showLog = true }: { showLog?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--line-subtle)] px-4 py-3">
        <span className="text-[length:0.8125rem] font-semibold text-[var(--ink-primary)]">
          Seat timeline — session clock
        </span>
      </div>
      <div className="p-4" role="img" aria-label="Timeline of per-seat behavioural events across a 90 minute session">
        {/* axis */}
        <div className="mb-2 flex justify-between pl-10">
          {ticks.map((t) => (
            <span key={t} className="mono text-[length:0.6875rem] text-[var(--ink-muted)]">
              {t}
            </span>
          ))}
        </div>
        <ul className="space-y-1.5">
          {lanes.map((lane) => (
            <li key={lane.seat} className="flex items-center gap-2">
              <span className="mono w-8 shrink-0 text-[length:0.75rem] text-[var(--ink-secondary)]">{lane.seat}</span>
              <span className="relative h-5 flex-1 rounded-[4px] bg-[var(--surface-inset)]">
                {lane.bands.map((band, i) => {
                  const st = seatStateStyles[band.state];
                  return (
                    <span
                      key={i}
                      className="absolute top-0 h-full rounded-[4px]"
                      style={{
                        left: `${(band.from / SPAN) * 100}%`,
                        width: `${((band.to - band.from) / SPAN) * 100}%`,
                        background: st.soft,
                        border: `1px solid ${st.fill}`,
                      }}
                      title={`${lane.seat} · ${st.label}`}
                    />
                  );
                })}
              </span>
            </li>
          ))}
        </ul>

        {showLog && (
          <ul className="mt-4 space-y-1 border-t border-[var(--line-subtle)] pt-3">
            {timelineEvents.map((e) => (
              <li key={e.t + e.label} className="flex items-baseline gap-3 text-[length:0.75rem]">
                <span className="mono shrink-0 text-[var(--ink-muted)]">{e.t}</span>
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full"
                  style={{ background: seatStateStyles[e.tone].fill }}
                />
                <span className="text-[var(--ink-secondary)]">{e.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
