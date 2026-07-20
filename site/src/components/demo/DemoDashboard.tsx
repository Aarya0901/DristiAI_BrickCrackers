"use client";

import { useMemo, useState } from "react";
import { buildDemoSeats, initialDemoAlerts, timelineEvents, type DemoAlert } from "@/content/demo";
import { SeatMap } from "./SeatMap";
import { AlertQueue } from "./AlertQueue";
import { ReviewModal } from "./ReviewModal";
import { TimelineStrip } from "./TimelineStrip";
import { HealthPanel } from "./HealthPanel";
import { cn } from "@/lib/cn";

export function DemoDashboard() {
  const [seats] = useState(buildDemoSeats());
  const [alerts, setAlerts] = useState<DemoAlert[]>(initialDemoAlerts);
  const [attentionLens, setAttentionLens] = useState(true);
  const [openAlertId, setOpenAlertId] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openAlert = useMemo(() => alerts.find((a) => a.id === openAlertId) ?? null, [alerts, openAlertId]);
  const pendingCount = alerts.filter((a) => a.status === "pending").length;

  function updateAlert(id: string, status: DemoAlert["status"]) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setOpenAlertId(null);
    setFeedback(
      status === "accepted"
        ? `Seat ${alerts.find((a) => a.id === id)?.seat} flagged for follow-up. Logged to audit trail.`
        : `Alert dismissed. Contributing to this seat's baseline. Logged to audit trail.`
    );
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--line-strong)] bg-[var(--surface-1)] px-5 py-3">
        <span className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
          Interactive product simulation · Hall A · Session 01:04:12
        </span>
        <span
          className={cn(
            "rounded-[var(--radius-xs)] border px-2 py-1 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)]",
            pendingCount > 0
              ? "border-[var(--review)] bg-[var(--review-soft)]"
              : "border-[var(--healthy)] bg-[var(--healthy-soft)]"
          )}
        >
          {pendingCount} pending review{pendingCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4 border border-[var(--line-strong)] bg-[var(--surface-1)] p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
              Seat map — Hall A
            </p>
            <button
              type="button"
              onClick={() => setAttentionLens((v) => !v)}
              aria-pressed={attentionLens}
              className={cn(
                "rounded-[var(--radius-sm)] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
                attentionLens
                  ? "border-[var(--attention)] bg-[var(--attention-soft)]"
                  : "border-[var(--line-strong)]"
              )}
            >
              Attention lens: {attentionLens ? "On" : "Off"}
            </button>
          </div>
          <SeatMap seats={seats} attentionLens={attentionLens} selectedSeat={selectedSeat} onSelectSeat={setSelectedSeat} />
        </div>

        <div className="flex flex-col gap-4 border border-[var(--line-strong)] bg-[var(--surface-1)] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            Review queue
          </p>
          <AlertQueue alerts={alerts} onOpen={setOpenAlertId} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="border border-[var(--line-strong)] bg-[var(--surface-1)] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            Session timeline
          </p>
          <div className="mt-4">
            <TimelineStrip events={timelineEvents} />
          </div>
        </div>
        <HealthPanel />
      </div>

      {feedback && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 border border-[var(--line-strong)] bg-[var(--bg-inverse)] px-5 py-3 text-[var(--ink-inverse)]"
          style={{ fontSize: "14px" }}
        >
          {feedback}
        </div>
      )}

      <ReviewModal
        alert={openAlert}
        onClose={() => setOpenAlertId(null)}
        onAccept={(id) => updateAlert(id, "accepted")}
        onDismiss={(id) => updateAlert(id, "dismissed")}
      />
    </div>
  );
}
