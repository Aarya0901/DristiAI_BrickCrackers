import { gatewayCards, legacyComparison } from "../../content/home";
import { SectionHeader } from "../ui/SectionHeader";
import { ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";
import { AlertQueue } from "../mock/AlertQueue";
import { TimelineStrip } from "../mock/TimelineStrip";

export function TwoSurfaces() {
  const cards = [gatewayCards.liveAssist, gatewayCards.controlRoom];
  return (
    <section aria-labelledby="two-surfaces" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="two-surfaces"
        eyebrow="Two surfaces"
        heading="Bring the CCTV. VIGIL builds understanding. The invigilator keeps the decision."
        support="One system, two reading surfaces: the person in the room, and the team watching every room."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {cards.map((card, i) => (
          <Reveal key={card.id} delay={i * 80}>
            <article className="card flex h-full flex-col" style={{ padding: "var(--card-pad)" }}>
              <h3 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "1.5rem", letterSpacing: "var(--tracking-card)" }}>
                {card.title}
              </h3>
              <p className="mt-2 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                {card.description}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${card.title} features`}>
                {card.features.map((f) => (
                  <li key={f} className="rounded-[var(--radius-pill)] border border-[var(--line-subtle)] bg-[var(--surface-inset)] px-3 py-1 text-[length:0.75rem] text-[var(--ink-secondary)]">
                    {f}
                  </li>
                ))}
              </ul>

              <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--line-subtle)]">
                {card.stats.map((s) => (
                  <div key={s.label} className="bg-[var(--surface-card)] px-3 py-2.5">
                    <dt className="text-[length:0.6875rem] text-[var(--ink-muted)]">{s.label}</dt>
                    <dd className="mono mt-0.5 text-[length:0.8125rem] text-[var(--ink-primary)]">{s.value}</dd>
                  </div>
                ))}
              </dl>

              {/* mock UI bleeds to card bottom */}
              <div className="mt-6 flex-1">
                {card.id === "live-assist" ? <AlertQueue max={2} /> : <TimelineStrip showLog={false} />}
              </div>

              <div className="mt-6">
                <ButtonLink href={card.cta.href} variant={i === 0 ? "primary" : "secondary"} arrow>
                  {card.cta.label}
                </ButtonLink>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {/* quiet comparison */}
      <Reveal delay={120}>
        <div className="card mt-6 grid overflow-hidden md:grid-cols-2" aria-label="Legacy CCTV compared with VIGIL">
          {[legacyComparison.legacy, legacyComparison.vigil].map((side) => (
            <div
              key={side.title}
              style={{ padding: "var(--card-pad)" }}
              className={
                side.title === "VIGIL"
                  ? "bg-[var(--surface-card)]"
                  : "border-b border-[var(--line-subtle)] bg-[var(--surface-inset)] md:border-b-0 md:border-r"
              }
            >
              <h4 className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">{side.title}</h4>
              <ul className="mt-3 space-y-2">
                {side.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[length:var(--text-small)] text-[var(--ink-secondary)]">
                    <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--ink-muted)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
