"use client";

import { useState } from "react";
import { sampleEvidenceCard } from "@/content/home";
import { cn } from "@/lib/cn";

const toggles = [
  { id: "triggered", label: "What triggered" },
  { id: "not-triggered", label: "What did not trigger" },
  { id: "uncertain", label: "What remains uncertain" },
] as const;

export function EvidenceCard() {
  const [activeToggle, setActiveToggle] = useState<(typeof toggles)[number]["id"]>("triggered");
  const card = sampleEvidenceCard;

  const listFor = () => {
    if (activeToggle === "triggered") return card.triggered;
    if (activeToggle === "not-triggered") return card.notTriggered;
    return card.uncertain;
  };

  return (
    <div className="grid gap-0 border border-[var(--line-strong)] bg-[var(--surface-1)] lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-5 border-b border-[var(--line-subtle)] p-7 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            Behavioural review request
          </p>
          <span className="rounded-[var(--radius-xs)] border border-[var(--review)] bg-[var(--review-soft)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-wide)]">
            Medium
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Seat" value={card.seat} />
          <Field label="Paired seat" value={card.pairedSeat} />
          <Field label="Behaviour" value={card.behaviour} />
          <Field label="Direction" value={card.direction} />
          <Field label="Start time" value={card.startTime} />
          <Field label="Duration" value={card.duration} />
          <Field label="Repetitions" value={String(card.repetitions)} />
          <Field label="Confidence" value={`${Math.round(card.confidence * 100)}%`} />
          <Field label="Visibility" value={`${Math.round(card.visibility * 100)}%`} />
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            Timeline
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 border-l border-[var(--line-subtle)] pl-4">
            {card.timeline.map((t) => (
              <li key={t.t} className="text-[13px]">
                <span className="font-mono text-[var(--ink-secondary)]">{t.t}</span> — {t.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-7">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Evidence perspective">
          {toggles.map((toggle) => (
            <button
              key={toggle.id}
              type="button"
              role="tab"
              aria-selected={activeToggle === toggle.id}
              onClick={() => setActiveToggle(toggle.id)}
              className={cn(
                "rounded-[var(--radius-sm)] border px-3 py-2 font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
                activeToggle === toggle.id
                  ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--ink-inverse)]"
                  : "border-[var(--line-subtle)] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)]"
              )}
            >
              {toggle.label}
            </button>
          ))}
        </div>

        <ul className="flex flex-col gap-3">
          {listFor().map((item) => (
            <li key={item} className="flex items-start gap-2.5" style={{ fontSize: "var(--text-body)" }}>
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--attention)]" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-[var(--line-subtle)] pt-4">
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            Counterfactual
          </p>
          <p className="mt-1 italic text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
            {card.counterfactual}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
        {label}
      </p>
      <p className="font-mono text-[14px]">{value}</p>
    </div>
  );
}
