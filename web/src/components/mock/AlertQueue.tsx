import { initialDemoAlerts } from "../../content/demo";

/**
 * AlertQueue — cal.com's stacked notification feed equivalent.
 * Behavioural review requests with severity chip, seat ID, relative time,
 * stacked 2 deep like the reference's notification stack.
 */
export function AlertQueue({ max = 3 }: { max?: number }) {
  const alerts = initialDemoAlerts.slice(0, max);
  return (
    <div className="relative" role="img" aria-label="Review queue with three behavioural review requests">
      {/* stacked backs */}
      <div aria-hidden="true" className="absolute inset-x-3 -bottom-2 top-4 rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-card)]" />
      <div aria-hidden="true" className="absolute inset-x-6 -bottom-4 top-8 rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-card)] opacity-70" />
      <ul className="relative space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="card flex items-center gap-3 p-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span
              className="mono flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[length:0.75rem] font-medium"
              style={{
                background: alert.severity === "high" ? "var(--high-review-soft)" : "var(--review-soft)",
                color: alert.severity === "high" ? "var(--high-review)" : "var(--review)",
              }}
            >
              {alert.seat}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[length:0.8125rem] font-medium text-[var(--ink-primary)]">
                {alert.behaviour}
                {alert.pairedSeat ? ` · ${alert.seat} ↔ ${alert.pairedSeat}` : ""}
              </div>
              <div className="text-[length:0.75rem] text-[var(--ink-muted)]">
                Human review recommended
              </div>
            </div>
            <span className="mono shrink-0 text-[length:0.75rem] text-[var(--ink-muted)]">
              {alert.relativeTime}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
