import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { modelStack, capabilityTiers, datasetPlan, limitations, references, evaluationPrinciples, noFabricationStatement } from "../../content/research";
import { Reveal } from "../../components/ui/Reveal";

export const metadata: Metadata = {
  title: "Research & Architecture",
  description: "VIGIL's model stack, evaluation protocol, capability tiers, dataset plan, and limitations. No performance number on this page is invented.",
};

export default function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research"
        heading="Measured on the errors that matter."
        support="No performance number on this page is invented or carried over from a different system. Every measured metric traces to the team's own scripted benchmark."
      />

      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        <div className="grid gap-20 lg:gap-28">
          {/* Model stack */}
          <section id="model-stack">
            <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
              Model stack
            </h2>
            <div className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--line-subtle)] sm:grid-cols-2">
              {modelStack.map((layer) => (
                <div key={layer.layer} className="bg-[var(--surface-card)] p-5">
                  <span className="mono text-[length:0.75rem] font-medium text-[var(--ink-primary)]">{layer.layer}</span>
                  <p className="mt-1 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">{layer.approach}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Capability tiers */}
          <section id="tiers">
            <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
              Capability tiers
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {capabilityTiers.map((t) => (
                <div key={t.tier} className="card" style={{ padding: "var(--card-pad)" }}>
                  <span className="eyebrow">{t.label} · Tier {t.tier}</span>
                  <p className="mt-3 text-[length:var(--text-small)] text-[var(--ink-secondary)]">{t.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Dataset plan */}
          <section>
            <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
              Dataset plan
            </h2>
            <ul className="mt-8 space-y-3">
              {datasetPlan.map((item) => (
                <li key={item} className="flex gap-3 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                  <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--attention)]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Evaluation */}
          <section id="evaluation">
            <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
              Evaluation protocol
            </h2>
            <ul className="mt-8 space-y-4">
              {evaluationPrinciples.map((p) => (
                <li key={p} className="flex gap-3 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                  <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ink-primary)]" />
                  {p}
                </li>
              ))}
            </ul>
          </section>

          {/* Limitations */}
          <section id="limitations">
            <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
              Limitations
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {limitations.map((lim) => (
                <article key={lim.id} className="card h-full" style={{ padding: "var(--card-pad)" }}>
                  <h3 className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">{lim.title}</h3>
                  <p className="mt-2 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">{lim.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* References */}
          <section>
            <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
              References
            </h2>
            <ul className="mt-8 divide-y divide-[var(--line-subtle)] border-y border-[var(--line-subtle)]">
              {references.map((ref) => (
                <li key={ref.label} className="py-4">
                  <span className="text-[length:var(--text-small)] font-medium text-[var(--ink-primary)]">{ref.label}</span>
                  <p className="mt-0.5 text-[length:0.8125rem] text-[var(--ink-secondary)]">{ref.note}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* No fabrication */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-inset)] p-6 text-center">
            <p className="text-[length:var(--text-small)] leading-relaxed text-[var(--ink-muted)]">{noFabricationStatement}</p>
          </div>
        </div>
        <div style={{ height: "var(--section-gap)" }} />
      </div>
    </>
  );
}
