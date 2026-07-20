import { healthMetrics } from "@/content/demo";

export function HealthPanel() {
  return (
    <div className="border border-[var(--line-strong)] bg-[var(--surface-1)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
        Camera & GPU health
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {healthMetrics.cameras.map((cam) => (
          <div key={cam.id} className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[13px]">
              <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--healthy)]" />
              {cam.id}
            </span>
            <span className="font-mono text-[13px] text-[var(--ink-secondary)]">{cam.fps.toFixed(1)} FPS</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-[var(--line-subtle)] pt-3">
          <span className="font-mono text-[13px]">GPU load</span>
          <span className="font-mono text-[13px] text-[var(--ink-secondary)]">
            {Math.round(healthMetrics.gpuLoad * 100)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px]">Avg. alert latency</span>
          <span className="font-mono text-[13px] text-[var(--ink-secondary)]">
            {(healthMetrics.avgLatencyMs / 1000).toFixed(1)} s
          </span>
        </div>
      </div>
    </div>
  );
}
