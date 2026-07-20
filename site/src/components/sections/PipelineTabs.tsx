"use client";

import { useState } from "react";
import { alertJsonExample, eventsCodeSnippet, pipelineCodeSnippet } from "@/content/home";
import { cn } from "@/lib/cn";
import { CodePanel } from "@/components/ui/CodePanel";

const tabs = [
  { id: "pipeline", label: "TS / PIPELINE", code: pipelineCodeSnippet },
  { id: "events", label: "PY / EVENTS", code: eventsCodeSnippet },
  { id: "alert", label: "JSON / ALERT", code: alertJsonExample },
];

export function PipelineTabs() {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pipeline code examples">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            onClick={() => setActiveId(tab.id)}
            className={cn(
              "rounded-[var(--radius-sm)] border px-3.5 py-2 font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
              tab.id === activeId
                ? "border-[var(--brand-cobalt)] bg-[var(--brand-cobalt)] text-[var(--ink-inverse)]"
                : "border-[var(--line-strong)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-[12px] text-[var(--ink-secondary)]">
        Illustrative pipeline shape, not a public API.
      </p>
      <div className="mt-4">
        <CodePanel code={active.code} label={active.label} />
      </div>
    </div>
  );
}
