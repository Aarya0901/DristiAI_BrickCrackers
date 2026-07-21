"use client";

import { useState } from "react";
import { capabilities } from "../../content/capabilities";
import { SectionHeader } from "../ui/SectionHeader";
import { CapabilityVisual } from "./CapabilityVisual";

/**
 * Capabilities catalog.
 * Desktop: indexed left list + live right panel. Hover previews, click locks,
 * no layout jump. Mobile: accordion with inline simplified visual.
 */
export function CapabilityCatalog() {
  const [locked, setLocked] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const [openMobile, setOpenMobile] = useState(0);
  const active = preview ?? locked;

  return (
    <section aria-labelledby="capabilities" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="capabilities"
        eyebrow="Capabilities"
        heading="All the signals needed to understand a hall — without identifying a student."
        support="Seven capabilities that combine into one evidence graph. Each one is inspectable; none of them is a black-box score."
      />

      {/* desktop */}
      <div className="mt-14 hidden gap-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ul role="list" className="divide-y divide-[var(--line-subtle)] border-y border-[var(--line-subtle)]">
          {capabilities.map((cap, i) => {
            const isActive = i === active;
            return (
              <li key={cap.id}>
                <button
                  onMouseEnter={() => setPreview(i)}
                  onMouseLeave={() => setPreview(null)}
                  onFocus={() => setPreview(i)}
                  onBlur={() => setPreview(null)}
                  onClick={() => setLocked(i)}
                  aria-current={i === locked}
                  className="group flex w-full items-baseline gap-4 py-4 text-left transition-colors"
                >
                  <span className={`mono text-[length:0.75rem] ${isActive ? "text-[var(--attention)]" : "text-[var(--ink-muted)]"}`}>
                    {cap.index}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`font-display block font-semibold transition-colors ${
                        isActive ? "text-[var(--ink-primary)]" : "text-[var(--ink-secondary)] group-hover:text-[var(--ink-primary)]"
                      }`}
                      style={{ fontSize: "1.0625rem", letterSpacing: "var(--tracking-card)" }}
                    >
                      {cap.title}
                    </span>
                    <span className="mt-0.5 block text-[length:var(--text-small)] leading-relaxed text-[var(--ink-muted)]">
                      {cap.summary}
                    </span>
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                    className="mt-1.5 shrink-0 transition-all"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateX(0)" : "translateX(-4px)",
                      transitionDuration: "var(--dur-micro)",
                    }}
                  >
                    <path d="M2.5 6h7M6.5 2.5 10 6l-3.5 3.5" stroke="var(--attention)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>

        {/* right panel — fixed height so hover never causes layout jump */}
        <div className="relative min-h-[420px]" aria-live="polite">
          {capabilities.map((cap, i) => (
            <div
              key={cap.id}
              className="absolute inset-0 transition-opacity"
              style={{
                opacity: i === active ? 1 : 0,
                pointerEvents: i === active ? "auto" : "none",
                transitionDuration: "var(--dur-micro)",
                transitionTimingFunction: "var(--ease-out)",
              }}
              aria-hidden={i !== active}
            >
              <div className="eyebrow mb-3">{cap.eyebrow}</div>
              <CapabilityVisual id={cap.id} />
            </div>
          ))}
        </div>
      </div>

      {/* mobile accordion */}
      <div className="mt-10 lg:hidden">
        <ul className="divide-y divide-[var(--line-subtle)] border-y border-[var(--line-subtle)]">
          {capabilities.map((cap, i) => {
            const open = openMobile === i;
            return (
              <li key={cap.id}>
                <button
                  aria-expanded={open}
                  aria-controls={`cap-panel-${cap.id}`}
                  onClick={() => setOpenMobile(open ? -1 : i)}
                  className="flex w-full items-center gap-3 py-4 text-left"
                >
                  <span className="mono text-[length:0.75rem] text-[var(--ink-muted)]">{cap.index}</span>
                  <span className="font-display flex-1 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "1.0625rem" }}>
                    {cap.title}
                  </span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                    style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform var(--dur-micro) var(--ease-out)" }}
                  >
                    <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <div
                  id={`cap-panel-${cap.id}`}
                  role="region"
                  aria-label={cap.title}
                  className="grid transition-[grid-template-rows]"
                  style={{
                    gridTemplateRows: open ? "1fr" : "0fr",
                    transitionDuration: "var(--dur-accordion)",
                    transitionTimingFunction: "var(--ease-out)",
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-3 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                      {cap.summary}
                    </p>
                    <div className="pb-5">
                      <CapabilityVisual id={cap.id} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
