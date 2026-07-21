import { pipelineStages } from "../../content/home";
import { SectionHeader } from "../ui/SectionHeader";
import { Reveal } from "../ui/Reveal";
import { StreamMock, AnchorMock, HeatMock, PairMock } from "../mock/HowItWorksMocks";
import { EvidenceCard } from "../mock/EvidenceCard";

const mocks = {
  stream: StreamMock,
  anchor: AnchorMock,
  heat: HeatMock,
  pair: PairMock,
} as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="how-it-works"
        eyebrow="How it works"
        heading="Five stages. One evidence graph."
        support="From an ordinary camera feed to an explainable behavioural review request — every stage produces inspectable state, never a hidden score."
      />

      {/* cal.com numbered layout: 01–03 on a row, 04–05 wider below */}
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {pipelineStages.slice(0, 3).map((stage, i) => {
          const Mock = mocks[stage.mock as keyof typeof mocks];
          return (
            <Reveal key={stage.index} delay={i * 80}>
              <article className="card flex h-full flex-col overflow-hidden">
                <div style={{ padding: "var(--card-pad)", paddingBottom: 0 }}>
                  <span className="mono inline-block rounded-[var(--radius-sm)] bg-[var(--surface-inset)] px-2 py-1 text-[length:0.75rem] text-[var(--ink-muted)]">
                    {stage.index}
                  </span>
                  <h3 className="font-display mt-3 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                    {stage.title}
                  </h3>
                  <p className="mt-1.5 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                    {stage.description}
                  </p>
                </div>
                {/* mock bleeds to card bottom edge */}
                <div className="mt-6 flex-1 p-3 pt-0 [&_.card]:rounded-b-none [&_.card]:border-b-0">
                  <Mock />
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {pipelineStages.slice(3).map((stage, i) => (
          <Reveal key={stage.index} delay={i * 80}>
            <article className="card flex h-full flex-col overflow-hidden">
              <div style={{ padding: "var(--card-pad)", paddingBottom: 0 }}>
                <span className="mono inline-block rounded-[var(--radius-sm)] bg-[var(--surface-inset)] px-2 py-1 text-[length:0.75rem] text-[var(--ink-muted)]">
                  {stage.index}
                </span>
                <h3 className="font-display mt-3 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                  {stage.title}
                </h3>
                <p className="mt-1.5 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                  {stage.description}
                </p>
              </div>
              <div className="mt-6 flex-1 p-3 pt-0 [&_.card]:rounded-b-none [&_.card]:border-b-0">
                {stage.mock === "pair" ? <PairMock /> : <EvidenceCard interactive={false} />}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
