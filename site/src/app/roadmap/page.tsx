import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { BuildStageGrid } from "@/components/sections/BuildStageGrid";
import { validationGates } from "@/content/roadmap";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "VIGIL's build path from prototype to production, with explicit go/no-go validation gates, risks, and fallbacks at each stage.",
  alternates: { canonical: "/roadmap" },
};

export default function RoadmapPage() {
  return (
    <>
      <PageHero
        breadcrumb="› ROADMAP"
        heading="Prototype honestly. Pilot in shadow mode. Deploy only after measurement."
        support="Every stage below has an explicit go/no-go gate. A stage is not entered on optimism — it's entered because the previous stage's criteria were actually met."
      />

      <SectionFrame id="stages" eyebrow="〉BUILD STAGES  [1/2]" heading="Four stages, one direction: prototype → production." noTopBorder>
        <BuildStageGrid />
      </SectionFrame>

      <SectionFrame
        id="validation-gates"
        eyebrow="〉VALIDATION GATES  [2/2]"
        heading="Go/no-go criteria, risks, and fallbacks between stages."
      >
        <div className="flex flex-col gap-6">
          {validationGates.map((gate) => (
            <div key={gate.stage} className="border border-[var(--line-strong)] bg-[var(--surface-1)]">
              <div className="border-b border-[var(--line-subtle)] p-6">
                <h3 className="font-medium" style={{ fontSize: "var(--text-heading-lg)" }}>
                  {gate.stage}
                </h3>
              </div>
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="border-b border-[var(--line-subtle)] p-6 sm:border-b-0 sm:border-r">
                  <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--healthy)]">
                    Go criteria
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {gate.goCriteria.map((c) => (
                      <li key={c} className="flex items-start gap-2" style={{ fontSize: "14px" }}>
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--healthy)]" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--high-review)]">
                    No-go criteria
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {gate.noGoCriteria.map((c) => (
                      <li key={c} className="flex items-start gap-2" style={{ fontSize: "14px" }}>
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--high-review)]" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid gap-0 border-t border-[var(--line-subtle)] sm:grid-cols-2">
                <div className="border-b border-[var(--line-subtle)] p-6 sm:border-b-0 sm:border-r">
                  <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
                    Risks
                  </p>
                  <p className="mt-2" style={{ fontSize: "14px" }}>
                    {gate.risks}
                  </p>
                </div>
                <div className="p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
                    Fallback
                  </p>
                  <p className="mt-2" style={{ fontSize: "14px" }}>
                    {gate.fallback}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionFrame>
    </>
  );
}
