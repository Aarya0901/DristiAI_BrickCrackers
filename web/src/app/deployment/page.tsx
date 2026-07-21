import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { deploymentModes, eventDataFlow, failureModes, cameraHealthChecks, retentionDefaults } from "../../content/deployment";
import { Reveal } from "../../components/ui/Reveal";

export const metadata: Metadata = {
  title: "Deployment",
  description: "Local by default. Observable by design. On-premise, private network, or fully offline — VIGIL runs where the cameras are, not in the cloud.",
};

export default function DeploymentPage() {
  return (
    <>
      <PageHero
        eyebrow="Deployment"
        heading="Local by default. Observable by design."
        support="VIGIL runs where the cameras are — on a single machine, across a private network, or fully offline."
      />

      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        {/* modes */}
        <div className="grid gap-6 sm:grid-cols-3">
          {deploymentModes.map((mode, i) => (
            <Reveal key={mode.id} delay={i * 60}>
              <div className="card h-full" style={{ padding: "var(--card-pad)" }}>
                <span className="mono text-[length:0.75rem] text-[var(--ink-muted)]">{mode.index}</span>
                <h2 className="font-display mt-2 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                  {mode.title}
                </h2>
                <p className="mt-1 text-[length:var(--text-small)] text-[var(--ink-secondary)]">{mode.tagline}</p>
                <ul className="mt-4 space-y-2">
                  {mode.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-[length:var(--text-small)] text-[var(--ink-secondary)]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                        <path d="m3 7.2 2.6 2.6L11 4.4" stroke="var(--ink-primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Event data flow */}
        <section className="mt-20">
          <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
            Event data flow
          </h2>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {eventDataFlow.map((step, i) => (
              <span key={step.stage}>
                <span className="mono inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-4 py-2 text-[length:var(--text-small)] font-medium text-[var(--ink-primary)]">
                  {step.stage}
                </span>
                {i < eventDataFlow.length - 1 && (
                  <span aria-hidden="true" className="mx-2 text-[var(--ink-muted)]">→</span>
                )}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {eventDataFlow.map((step) => (
              <div key={step.stage} className="card" style={{ padding: "var(--card-pad)" }}>
                <span className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">{step.stage}</span>
                <p className="mt-1 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Failure modes */}
        <section className="mt-20" id="failure-modes">
          <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
            Known failure modes
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {failureModes.map((fm) => (
              <div key={fm.id} className="card" style={{ padding: "var(--card-pad)" }}>
                <h3 className="font-semibold text-[length:var(--text-small)] text-[var(--ink-primary)]">{fm.title}</h3>
                <p className="mt-1 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">{fm.response}</p>
              </div>
            ))}
          </div>
          <ul className="mt-8 space-y-2">
            {cameraHealthChecks.map((c) => (
              <li key={c} className="flex gap-3 text-[length:var(--text-small)] text-[var(--ink-secondary)]">
                <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--attention)]" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* Retention */}
        <section className="mt-20">
          <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
            Retention defaults
          </h2>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--line-subtle)] sm:grid-cols-2 lg:grid-cols-4">
            {retentionDefaults.map((r) => (
              <div key={r.label} className="bg-[var(--surface-card)] p-4">
                <dt className="text-[length:var(--text-small)] font-medium text-[var(--ink-primary)]">{r.label}</dt>
                <dd className="mono mt-1 text-[length:0.8125rem] text-[var(--ink-secondary)]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div style={{ height: "var(--section-gap)" }} />
      </div>
    </>
  );
}
