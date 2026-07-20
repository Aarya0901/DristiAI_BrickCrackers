import type { Metric } from "@/content/types";

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-3 border border-[var(--line-strong)] bg-[var(--surface-1)] p-6">
      <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
        {metric.label}
      </p>

      {metric.status === "measured" && metric.value !== undefined ? (
        <p className="font-mono" style={{ fontSize: "var(--text-heading-lg)" }}>
          {metric.value}
          {metric.unit ? <span className="text-[var(--ink-secondary)]"> {metric.unit}</span> : null}
        </p>
      ) : metric.status === "target" ? (
        <p className="font-mono text-[var(--ink-primary)]" style={{ fontSize: "var(--text-heading-md)" }}>
          {metric.targetLabel}
          <span className="ml-2 rounded-[var(--radius-xs)] border border-[var(--review)] bg-[var(--review-soft)] px-1.5 py-0.5 font-sans text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-primary)]">
            Target
          </span>
        </p>
      ) : (
        <p className="font-mono text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-heading-md)" }}>
          Validation in progress
        </p>
      )}

      <p className="text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
        {metric.description}
      </p>

      {metric.methodologyLink && (
        <a
          href={metric.methodologyLink}
          className="mt-1 font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--brand-cobalt)] hover:underline"
        >
          Methodology →
        </a>
      )}
    </div>
  );
}
