"use client";

const demoBars = [
  { label: "Fixed threshold", value: 82, tone: "var(--unobservable)" },
  { label: "+ personal baselines", value: 58, tone: "var(--review)" },
  { label: "+ pair evidence", value: 37, tone: "var(--review)" },
  { label: "+ visibility abstention", value: 24, tone: "var(--healthy)" },
];

/**
 * Production renders no fabricated numbers (anti-slop rule). This chart only
 * shows placeholder bars in local development, explicitly labelled DEMO DATA,
 * so the shape of the argument is visible without inventing a result.
 */
export function ComparisonChart() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    return (
      <div className="flex flex-col items-start gap-2 border border-dashed border-[var(--line-subtle)] p-8">
        <p className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
          False alerts per student-hour, by configuration
        </p>
        <p className="text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
          Chart activates once the scripted benchmark produces held-out results. No placeholder
          numbers are shown in production.
        </p>
      </div>
    );
  }

  const max = Math.max(...demoBars.map((b) => b.value));

  return (
    <div className="border border-[var(--line-strong)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
          False alerts per student-hour, by configuration
        </p>
        <span className="rounded-[var(--radius-xs)] border border-[var(--high-review)] bg-[var(--high-review-soft)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-wide)]">
          Demo data
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {demoBars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-4">
            <span className="w-44 shrink-0 text-[13px] text-[var(--ink-secondary)]">{bar.label}</span>
            <div className="h-3 flex-1 bg-[var(--surface-2)]">
              <div
                className="h-3 transition-[width] duration-[var(--duration-reveal)] ease-[var(--ease-reveal)]"
                style={{ width: `${(bar.value / max) * 100}%`, backgroundColor: bar.tone }}
              />
            </div>
            <span className="w-10 shrink-0 font-mono text-[13px]">{bar.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
