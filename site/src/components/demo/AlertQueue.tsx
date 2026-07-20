"use client";

import type { DemoAlert } from "@/content/demo";
import { cn } from "@/lib/cn";

interface AlertQueueProps {
  alerts: DemoAlert[];
  onOpen: (id: string) => void;
}

export function AlertQueue({ alerts, onOpen }: AlertQueueProps) {
  if (alerts.every((a) => a.status !== "pending")) {
    return (
      <div className="border border-dashed border-[var(--line-subtle)] p-8 text-center">
        <p className="text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
          Queue clear. No pending review requests.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <button
            type="button"
            onClick={() => onOpen(alert.id)}
            disabled={alert.status !== "pending"}
            className={cn(
              "flex w-full items-center justify-between gap-4 border p-4 text-left transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
              alert.status === "pending"
                ? "border-[var(--line-strong)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
                : "border-[var(--line-subtle)] bg-[var(--surface-2)] opacity-60"
            )}
          >
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
                Seat {alert.seat}
                {alert.pairedSeat ? ` ↔ ${alert.pairedSeat}` : ""} · {alert.startTime}
              </p>
              <p className="mt-1 font-medium" style={{ fontSize: "14px" }}>
                {alert.behaviour}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-[var(--radius-xs)] border px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-wide)]",
                alert.status === "pending"
                  ? alert.severity === "high"
                    ? "border-[var(--high-review)] bg-[var(--high-review-soft)]"
                    : "border-[var(--review)] bg-[var(--review-soft)]"
                  : alert.status === "accepted"
                  ? "border-[var(--healthy)] bg-[var(--healthy-soft)]"
                  : "border-[var(--unobservable)] bg-[var(--unobservable-soft)]"
              )}
            >
              {alert.status === "pending" ? alert.severity : alert.status}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
