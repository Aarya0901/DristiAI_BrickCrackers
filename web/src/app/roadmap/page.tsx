import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { buildStages, stageStatusLabels, validationGates } from "../../content/roadmap";
import { Reveal } from "../../components/ui/Reveal";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Prototype honestly. Pilot in shadow mode. Deploy only after measurement. VIGIL's four build stages, each gated by evidence.",
};

const statusStyles: Record<string, { bg: string; fg: string }> = {
  active: { bg: "var(--healthy-soft)", fg: "var(--healthy)" },
  next: { bg: "var(--attention-soft)", fg: "var(--attention)" },
  planned: { bg: "var(--surface-inset)", fg: "var(--ink-secondary)" },
  roadmap: { bg: "var(--surface-inset)", fg: "var(--ink-muted)" },
};

export default function RoadmapPage() {
  return (
    <>
      <PageHero
        eyebrow="Roadmap"
        heading="Prototype honestly. Pilot in shadow mode. Deploy only after measurement."
        support="Each stage is gated by evidence, not by a calendar. Nothing that affects a real exam decision ships until the numbers say so."
      />

      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        {/* build stages */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {buildStages.map((stage, i) => {
            const st = statusStyles[stage.status];
            return (
              <Reveal key={stage.id} delay={i * 60}>
                <article className="card flex h-full flex-col" style={{ padding: "var(--card-pad)" }}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                      {stage.title}
                    </h2>
                    <span className="rounded-[var(--radius-pill)] px-2.5 py-1 text-[length:0.6875rem] font-medium" style={{ background: st.bg, color: st.fg }}>
                      {stageStatusLabels[stage.status]}
                    </span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {stage.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-[length:var(--text-small)] text-[var(--ink-secondary)]">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                          <path d="m3 7.2 2.6 2.6L11 4.4" stroke="var(--ink-primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Validation gates */}
        <section className="mt-20">
          <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
            Validation gates
          </h2>
          <p className="mt-3 text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)" }}>
            Go/no-go criteria that must be met before advancing to the next stage.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {validationGates.map((gate) => (
              <div key={gate.stage} className="card" style={{ padding: "var(--card-pad)" }}>
                <span className="eyebrow">{gate.stage}</span>
                <h3 className="mt-4 text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">
                  Go criteria
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {gate.goCriteria.map((c) => (
                    <li key={c} className="flex gap-2 text-[length:0.8125rem] text-[var(--healthy)]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                        <path d="m3 7.2 2.6 2.6L11 4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-4 text-[length:var(--text-small)] font-semibold text-[var(--high-review)]">
                  No-go criteria
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {gate.noGoCriteria.map((c) => (
                    <li key={c} className="flex gap-2 text-[length:0.8125rem] text-[var(--high-review)]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                        <path d="m3 3 6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-4 text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">
                  Risks
                </h3>
                <p className="mt-1 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">
                  {gate.risks}
                </p>
                <h3 className="mt-2 text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">
                  Fallback
                </h3>
                <p className="mt-1 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">
                  {gate.fallback}
                </p>
              </div>
            ))}
          </div>
        </section>
        <div style={{ height: "var(--section-gap)" }} />
      </div>
    </>
  );
}
