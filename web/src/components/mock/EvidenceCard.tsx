"use client";

import { useState } from "react";
import { sampleEvidenceCard } from "../../content/home";

/**
 * EvidenceCard — VIGIL's signature component.
 * The 14 explainability fields + counterfactual tabs:
 * What triggered / What did not trigger / What remains uncertain.
 */

const tabs = [
  { id: "triggered", label: "What triggered" },
  { id: "notTriggered", label: "What did not trigger" },
  { id: "uncertain", label: "What remains uncertain" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function EvidenceCard({ interactive = true }: { interactive?: boolean }) {
  const [active, setActive] = useState<TabId>("triggered");
  const c = sampleEvidenceCard;

  const fields: { label: string; value: string }[] = [
    { label: "Seat", value: c.seat },
    { label: "Behaviour", value: "Reciprocal attention" },
    { label: "Paired seat", value: c.pairedSeat },
    { label: "Start", value: c.startTime },
    { label: "Duration", value: c.duration },
    { label: "Repetitions", value: String(c.repetitions) },
    { label: "Direction", value: c.direction },
    { label: "Confidence", value: c.confidence.toFixed(2) },
    { label: "Visibility", value: c.visibility.toFixed(2) },
    { label: "Window", value: "90 s" },
    { label: "Duration gate", value: "1.8 s" },
    { label: "Baseline deviation", value: "+2.4σ" },
    { label: "Visibility tier", value: "Tier B" },
    { label: "Severity", value: c.severity },
  ];

  return (
    <div className="card overflow-hidden text-left" aria-label="Illustrative evidence card for seat C7">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line-subtle)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="mono flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[length:0.75rem] font-medium"
            style={{ background: "var(--review-soft)", color: "var(--review)" }}
          >
            {c.seat}
          </span>
          <div>
            <div className="text-[length:0.8125rem] font-semibold text-[var(--ink-primary)]">
              Behavioural review request
            </div>
            <div className="text-[length:0.75rem] text-[var(--ink-muted)]">
              {c.seat} ↔ {c.pairedSeat} · human review recommended
            </div>
          </div>
        </div>
        <span
          className="rounded-[var(--radius-pill)] px-2.5 py-1 text-[length:0.6875rem] font-medium"
          style={{ background: "var(--review-soft)", color: "var(--review)" }}
        >
          {c.severity}
        </span>
      </div>

      {/* 14-field grid */}
      <dl className="grid grid-cols-2 gap-px bg-[var(--line-subtle)] sm:grid-cols-4 lg:grid-cols-7">
        {fields.map((f) => (
          <div key={f.label} className="bg-[var(--surface-card)] px-3 py-2.5">
            <dt className="text-[length:0.625rem] uppercase tracking-[0.06em] text-[var(--ink-muted)]">
              {f.label}
            </dt>
            <dd className="mono mt-0.5 truncate text-[length:0.75rem] text-[var(--ink-primary)]" title={f.value}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* tabs */}
      <div className="border-t border-[var(--line-subtle)]">
        <div role="tablist" aria-label="Evidence explanation" className="flex gap-1 px-3 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={interactive ? active === tab.id : tab.id === "triggered"}
              aria-controls={`panel-${tab.id}`}
              tabIndex={interactive ? (active === tab.id ? 0 : -1) : 0}
              onClick={() => interactive && setActive(tab.id)}
              onKeyDown={(e) => {
                if (!interactive) return;
                const idx = tabs.findIndex((t) => t.id === active);
                if (e.key === "ArrowRight") setActive(tabs[(idx + 1) % tabs.length].id);
                if (e.key === "ArrowLeft") setActive(tabs[(idx - 1 + tabs.length) % tabs.length].id);
              }}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-[length:0.75rem] font-medium transition-colors"
              style={{
                background: interactive && active === tab.id ? "var(--ink-primary)" : "var(--surface-inset)",
                color: interactive && active === tab.id ? "var(--ink-inverse)" : "var(--ink-secondary)",
                transitionDuration: "var(--dur-micro)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={interactive && active !== tab.id}
            className="px-4 pb-4 pt-3"
          >
            <ul className="space-y-2">
              {c[tab.id].map((item) => (
                <li key={item} className="flex gap-2 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background:
                        tab.id === "triggered"
                          ? "var(--review)"
                          : tab.id === "notTriggered"
                            ? "var(--healthy)"
                            : "var(--unobservable)",
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            {tab.id === "triggered" && (
              <div className="mono mt-3 rounded-[var(--radius-sm)] bg-[var(--surface-inset)] px-3 py-2 text-[length:0.75rem] text-[var(--ink-secondary)]">
                {c.timeline.map((t) => (
                  <div key={t.t} className="flex gap-3 py-0.5">
                    <span className="text-[var(--ink-muted)]">{t.t}</span>
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-subtle)] px-4 py-3">
        <span className="text-[length:0.75rem] text-[var(--ink-muted)]">
          Illustrative example · skeleton replay available
        </span>
        <span className="mono text-[length:0.75rem] text-[var(--ink-secondary)]">
          counterfactual included
        </span>
      </div>
    </div>
  );
}
