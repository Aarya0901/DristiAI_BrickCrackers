"use client";

import { useState } from "react";
import { buildDemoSeats, initialDemoAlerts, timelineEvents, healthMetrics } from "../../content/demo";
import { SeatMap, SeatMapLegend } from "../mock/SeatMap";
import { AlertQueue } from "../mock/AlertQueue";
import { TimelineStrip } from "../mock/TimelineStrip";
import { EvidenceCard } from "../mock/EvidenceCard";
import { HealthChip, GpuChip } from "../mock/HealthChip";
import { Button } from "../ui/Button";

export function DemoDashboard() {
  const [seats] = useState(() => buildDemoSeats());
  const [alerts] = useState(initialDemoAlerts);
  const [lensOn, setLensOn] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dismissReason, setDismissReason] = useState("");

  const alertObj = alerts.find((a) => a.id === activeAlert);

  return (
    <div className="space-y-8">
      {/* top bar: health + lens toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {healthMetrics.cameras.map((cam) => (
            <HealthChip key={cam.id} id={cam.id} fps={cam.fps} resolution={cam.resolution} />
          ))}
          <GpuChip />
          <span className="mono text-[length:0.75rem] text-[var(--ink-muted)]">
            latency {healthMetrics.avgLatencyMs} ms
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[length:var(--text-small)] text-[var(--ink-secondary)]">Attention Lens</span>
          <button
            role="switch"
            aria-checked={lensOn}
            aria-label="Toggle attention lens"
            onClick={() => setLensOn((v) => !v)}
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{
              background: lensOn ? "var(--attention)" : "var(--line-strong)",
              transitionDuration: "var(--dur-micro)",
            }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              style={{
                left: lensOn ? "calc(100% - 22px)" : "2px",
                transitionDuration: "var(--dur-micro)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Seat map + timeline */}
        <div className="space-y-8">
          <div className={`card overflow-hidden ${lensOn ? "ring-2 ring-[var(--attention)]" : ""}`}>
            <div className="border-b border-[var(--line-subtle)] px-4 py-3 flex items-center justify-between">
              <span className="text-[length:0.8125rem] font-semibold text-[var(--ink-primary)]">
                Hall A · seat map {lensOn && "· attention lens on"}
              </span>
              <SeatMapLegend className="hidden sm:flex" />
            </div>
            <div className="p-4">
              <SeatMap seats={seats} highlightPair={["C7", "C8"]} showTiers />
            </div>
          </div>
          <TimelineStrip />
        </div>

        {/* Alert queue + evidence */}
        <div className="space-y-6">
          <div className="card">
            <div className="border-b border-[var(--line-subtle)] px-4 py-3">
              <span className="text-[length:0.8125rem] font-semibold text-[var(--ink-primary)]">
                Review queue ({alerts.filter((a) => !dismissed.has(a.id)).length})
              </span>
            </div>
            <div className="p-3">
              <ul className="space-y-2">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <button
                      onClick={() => setActiveAlert(alert.id)}
                      className={`card w-full p-3 text-left transition-shadow hover:shadow-[var(--shadow-pop)] ${
                        activeAlert === alert.id ? "ring-2 ring-[var(--attention)]" : ""
                      } ${dismissed.has(alert.id) ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[length:0.6875rem] font-medium"
                          style={{
                            background: alert.severity === "high" ? "var(--high-review-soft)" : "var(--review-soft)",
                            color: alert.severity === "high" ? "var(--high-review)" : "var(--review)",
                          }}
                        >
                          {alert.seat}
                        </span>
                        <span className="flex-1 text-[length:0.8125rem] font-medium text-[var(--ink-primary)]">
                          {alert.behaviour}
                        </span>
                        <span className="mono text-[length:0.6875rem] text-[var(--ink-muted)]">
                          {alert.relativeTime}
                        </span>
                      </div>
                      {dismissed.has(alert.id) && (
                        <span className="mt-1 text-[length:0.6875rem] text-[var(--ink-muted)]">Dismissed</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {alertObj && (
            <div className="card">
              <div className="border-b border-[var(--line-subtle)] px-4 py-3 flex items-center justify-between">
                <span className="text-[length:0.8125rem] font-semibold text-[var(--ink-primary)]">
                  {alertObj.seat} {alertObj.pairedSeat ? `↔ ${alertObj.pairedSeat}` : ""}
                </span>
                <span
                  className="mono rounded-[var(--radius-pill)] px-2 py-0.5 text-[length:0.625rem] font-medium"
                  style={{
                    background: alertObj.severity === "high" ? "var(--high-review-soft)" : "var(--review-soft)",
                    color: alertObj.severity === "high" ? "var(--high-review)" : "var(--review)",
                  }}
                >
                  {alertObj.severity}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-px bg-[var(--line-subtle)]">
                {[
                  { k: "Repetitions", v: String(alertObj.repetitions) },
                  { k: "Duration", v: alertObj.duration },
                  { k: "Confidence", v: alertObj.confidence.toFixed(2) },
                  { k: "Visibility", v: alertObj.visibility.toFixed(2) },
                ].map(({ k, v }) => (
                  <div key={k} className="bg-[var(--surface-card)] px-3 py-2">
                    <dt className="text-[length:0.625rem] text-[var(--ink-muted)]">{k}</dt>
                    <dd className="mono text-[length:0.75rem] text-[var(--ink-primary)]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-[var(--line-subtle)] p-3 text-[length:0.75rem] leading-relaxed text-[var(--ink-secondary)]">
                {alertObj.counterfactual}
              </div>
              <div className="flex gap-2 border-t border-[var(--line-subtle)] p-3">
                <Button
                  onClick={() => {
                    setDismissed((prev) => new Set(prev).add(alertObj.id));
                    setDismissReason("");
                  }}
                  variant="primary"
                  arrow
                  disabled={dismissed.has(alertObj.id)}
                >
                  Acknowledge
                </Button>
                <Button
                  onClick={() => {
                    if (!dismissReason.trim()) return;
                    setDismissed((prev) => new Set(prev).add(alertObj.id));
                  }}
                  variant="ghost"
                  disabled={dismissed.has(alertObj.id)}
                >
                  Dismiss
                </Button>
              </div>
              {dismissed.has(alertObj.id) && (
                <div className="border-t border-[var(--line-subtle)] p-3">
                  <input
                    type="text"
                    placeholder="Reason for dismissal (optional)"
                    value={dismissReason}
                    onChange={(e) => setDismissReason(e.target.value)}
                    className="card w-full px-3 py-2 text-[length:var(--text-small)] text-[var(--ink-primary)] outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evidence card showcase */}
      <section className="grid gap-8 lg:grid-cols-2">
        <EvidenceCard />
        <div className="card flex flex-col items-center justify-center gap-4 p-8 text-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="16" r="8" stroke="var(--ink-secondary)" strokeWidth="1.5" />
            <path d="M12 42c3-10 8-14 12-14s9 4 12 14" stroke="var(--ink-secondary)" strokeWidth="1.5" strokeLinecap="round" />
            {[[22,28],[22,34],[16,42],[32,42],[22,40]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="2" fill="var(--attention)" />
            ))}
          </svg>
          <h3 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "1.125rem" }}>
            Skeleton-first replay
          </h3>
          <p className="text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)] max-w-[36ch]">
            Evidence replay defaults to pose-skeleton animation — never raw video.
            The source clip is available if the deployment enables it.
          </p>
        </div>
      </section>
    </div>
  );
}
