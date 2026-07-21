import { buildStagesIntro } from "../../content/home";
import { buildStages, stageStatusLabels } from "../../content/roadmap";
import { SectionHeader } from "../ui/SectionHeader";
import { ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

const statusStyles: Record<string, { bg: string; fg: string }> = {
  active: { bg: "var(--healthy-soft)", fg: "var(--healthy)" },
  next: { bg: "var(--attention-soft)", fg: "var(--attention)" },
  planned: { bg: "var(--surface-inset)", fg: "var(--ink-secondary)" },
  roadmap: { bg: "var(--surface-inset)", fg: "var(--ink-muted)" },
};

/** Pricing-grid structure with status badges instead of prices — no pricing exists. */
export function BuildStages() {
  return (
    <section aria-labelledby="build-stages" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="build-stages"
        eyebrow={buildStagesIntro.eyebrow}
        heading={buildStagesIntro.heading}
        support="Four stages, each gated by measurement. Nothing ships to a live decision until the numbers say so."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {buildStages.map((stage, i) => {
          const st = statusStyles[stage.status];
          return (
            <Reveal key={stage.id} delay={i * 60}>
              <article className="card flex h-full flex-col" style={{ padding: "var(--card-pad)" }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                    {stage.title}
                  </h3>
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

      <Reveal delay={100}>
        <div className="mt-8 flex justify-center">
          <ButtonLink href={buildStagesIntro.cta.href} variant="secondary" arrow>
            {buildStagesIntro.cta.label}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
