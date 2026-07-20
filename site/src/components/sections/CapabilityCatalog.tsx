"use client";

import { useState } from "react";
import { capabilities } from "@/content/capabilities";
import { cn } from "@/lib/cn";
import { CapabilityVisual } from "./CapabilityVisual";

export function CapabilityCatalog() {
  const [activeId, setActiveId] = useState(capabilities[0].id);
  const active = capabilities.find((c) => c.id === activeId) ?? capabilities[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      {/* Desktop: indexed list */}
      <ul className="hidden flex-col lg:flex" role="tablist" aria-label="VIGIL capabilities">
        {capabilities.map((cap) => {
          const isActive = cap.id === activeId;
          return (
            <li key={cap.id} className="border-b border-[var(--line-subtle)] first:border-t">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(cap.id)}
                onFocus={() => setActiveId(cap.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-4 py-5 text-left transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
                  isActive ? "text-[var(--ink-primary)]" : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                )}
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-[var(--text-label)]">{cap.index}</span>
                  <span
                    className="font-medium"
                    style={{ fontSize: "var(--text-heading-md)", letterSpacing: "var(--tracking-snug)" }}
                  >
                    {cap.title}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                    isActive ? "bg-[var(--attention)]" : "bg-transparent"
                  )}
                />
              </button>
              {isActive && (
                <p className="pb-5 pr-8 text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)" }}>
                  {cap.summary}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop: active visual */}
      <div className="hidden lg:block">
        <CapabilityVisual id={active.id} />
        <p className="mt-3 font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
          {active.eyebrow}
        </p>
      </div>

      {/* Mobile: accordion */}
      <div className="flex flex-col lg:hidden">
        {capabilities.map((cap) => {
          const isOpen = cap.id === activeId;
          return (
            <div key={cap.id} className="border-b border-[var(--line-subtle)] first:border-t">
              <button
                type="button"
                onClick={() => setActiveId(isOpen ? "" : cap.id)}
                aria-expanded={isOpen}
                className="flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-[var(--text-label)] text-[var(--ink-secondary)]">{cap.index}</span>
                  <span className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
                    {cap.title}
                  </span>
                </span>
                <span aria-hidden className="text-[var(--ink-secondary)]">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="pb-5">
                  <CapabilityVisual id={cap.id} className="mb-4" />
                  <p className="text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)" }}>
                    {cap.summary}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
