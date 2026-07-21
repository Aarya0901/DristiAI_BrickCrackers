import { healthMetrics } from "../../content/demo";

/** Camera / GPU health chip — heartbeat dot, FPS, stream state. */
export function HealthChip({
  id = healthMetrics.cameras[0].id,
  fps = healthMetrics.cameras[0].fps,
  resolution = healthMetrics.cameras[0].resolution,
  compact = false,
}: {
  id?: string;
  fps?: number;
  resolution?: string;
  compact?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-3 py-2"
      role="status"
      aria-label={`${id} stream healthy, ${fps} frames per second at ${resolution}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
          style={{ background: "var(--healthy)", animationDuration: "2s" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--healthy)" }} />
      </span>
      <span className="mono text-[length:0.75rem] font-medium text-[var(--ink-primary)]">{id}</span>
      {!compact && (
        <>
          <span className="mono text-[length:0.75rem] text-[var(--ink-secondary)]">{fps.toFixed(1)} FPS</span>
          <span className="mono text-[length:0.75rem] text-[var(--ink-muted)]">{resolution}</span>
        </>
      )}
    </div>
  );
}

export function GpuChip({ load = healthMetrics.gpuLoad }: { load?: number }) {
  const pct = Math.round(load * 100);
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-3 py-2"
      role="status"
      aria-label={`GPU load ${pct} percent`}
    >
      <span className="mono text-[length:0.75rem] font-medium text-[var(--ink-primary)]">GPU</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-inset)]" aria-hidden="true">
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--attention)" }}
        />
      </span>
      <span className="mono text-[length:0.75rem] text-[var(--ink-secondary)]">{pct}%</span>
    </div>
  );
}
