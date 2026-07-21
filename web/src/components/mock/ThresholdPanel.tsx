/**
 * ThresholdPanel — cal.com's availability/settings panel equivalent.
 * Rows: duration gate, repetition count, baseline sensitivity, visibility floor.
 */
const rows = [
  { label: "Duration gate", value: "1.8 s", hint: "single glance below this is ignored" },
  { label: "Repetition count", value: "3 in 90 s", hint: "isolated pairs stay silent" },
  { label: "Baseline sensitivity", value: "Per seat", hint: "deviation from the seat's own normal" },
  { label: "Visibility floor", value: "Tier B", hint: "below this, the seat abstains" },
];

export function ThresholdPanel() {
  return (
    <div
      className="card overflow-hidden"
      role="img"
      aria-label="Alert threshold settings: duration gate 1.8 seconds, repetition count 3 in 90 seconds, per-seat baseline sensitivity, visibility floor tier B"
    >
      <div className="border-b border-[var(--line-subtle)] px-4 py-3">
        <span className="text-[length:0.8125rem] font-semibold text-[var(--ink-primary)]">
          Review thresholds
        </span>
      </div>
      <ul>
        {rows.map((row, i) => (
          <li
            key={row.label}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              i < rows.length - 1 ? "border-b border-[var(--line-subtle)]" : ""
            }`}
          >
            <div>
              <div className="text-[length:0.8125rem] font-medium text-[var(--ink-primary)]">{row.label}</div>
              <div className="text-[length:0.75rem] text-[var(--ink-muted)]">{row.hint}</div>
            </div>
            <span
              className="mono shrink-0 rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--surface-inset)] px-2 py-1 text-[length:0.75rem] text-[var(--ink-primary)]"
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
