"use client";

import { useState } from "react";
import { useCases } from "@/content/home";
import { cn } from "@/lib/cn";

const fields: { key: keyof (typeof useCases)[number]; label: string }[] = [
  { key: "environment", label: "Environment" },
  { key: "cameraArrangement", label: "Camera arrangement" },
  { key: "primaryRisk", label: "Primary risk" },
  { key: "capability", label: "VIGIL capability" },
  { key: "deploymentConstraint", label: "Deployment constraint" },
  { key: "limitation", label: "Honest limitation" },
];

export function UseCaseCarousel() {
  const [activeId, setActiveId] = useState(useCases[0].id);
  const active = useCases.find((u) => u.id === activeId) ?? useCases[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--line-subtle)] pb-4" role="tablist" aria-label="Use cases">
        {useCases.map((uc) => (
          <button
            key={uc.id}
            type="button"
            role="tab"
            aria-selected={uc.id === activeId}
            onClick={() => setActiveId(uc.id)}
            className={cn(
              "rounded-[var(--radius-sm)] border px-3.5 py-2 text-left font-medium transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
              uc.id === activeId
                ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--ink-inverse)]"
                : "border-[var(--line-subtle)] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)] hover:text-[var(--ink-primary)]"
            )}
            style={{ fontSize: "14px" }}
          >
            {uc.title}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="border border-[var(--line-subtle)] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
              {field.label}
            </p>
            <p className="mt-2" style={{ fontSize: "var(--text-body)" }}>
              {active[field.key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
