"use client";

import type { DemoAlert } from "@/content/demo";
import { Modal } from "@/components/ui/Modal";
import { SkeletonReplay } from "./SkeletonReplay";

interface ReviewModalProps {
  alert: DemoAlert | null;
  onClose: () => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function ReviewModal({ alert, onClose, onAccept, onDismiss }: ReviewModalProps) {
  return (
    <Modal open={!!alert} onClose={onClose} title="Behavioural review request">
      {alert && (
        <div className="flex flex-col gap-5">
          <SkeletonReplay />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Seat" value={alert.seat} />
            {alert.pairedSeat && <Field label="Paired seat" value={alert.pairedSeat} />}
            <Field label="Start time" value={alert.startTime} />
            <Field label="Duration" value={alert.duration} />
            <Field label="Repetitions" value={String(alert.repetitions)} />
            <Field label="Confidence" value={`${Math.round(alert.confidence * 100)}%`} />
            <Field label="Visibility" value={`${Math.round(alert.visibility * 100)}%`} />
          </div>

          <div className="border-t border-[var(--line-subtle)] pt-4">
            <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
              Counterfactual
            </p>
            <p className="mt-1 italic text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
              {alert.counterfactual}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[var(--line-subtle)] pt-5">
            <button
              type="button"
              onClick={() => onAccept(alert.id)}
              className="rounded-[var(--radius-sm)] border border-[var(--healthy)] bg-[var(--healthy-soft)] px-4 py-2.5 font-medium"
            >
              Accept for follow-up
            </button>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="rounded-[var(--radius-sm)] border border-[var(--line-strong)] px-4 py-2.5 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">{label}</p>
      <p className="font-mono text-[14px]">{value}</p>
    </div>
  );
}
