import Link from "next/link";
import { metrics } from "../../content/metrics";
import { ablationMatrix, evaluationIntro } from "../../content/home";
import { formatMetricSub, formatMetricValue } from "../../lib/metric-format";
import { SectionHeader } from "../ui/SectionHeader";
import { ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

export function Evaluation() {
  return (
    <section aria-labelledby="evaluation" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="evaluation"
        eyebrow={evaluationIntro.eyebrow}
        heading={evaluationIntro.heading}
        support={evaluationIntro.support}
      />

      {/* metric cards — unmeasured metrics render "Validation in progress", never a number */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m, i) => (
          <Reveal key={m.id} delay={i * 50}>
            <article className="card flex h-full flex-col" style={{ padding: "var(--card-pad)" }}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">{m.label}</h3>
                <span
                  className="mono shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[length:0.625rem] font-medium uppercase tracking-[0.06em]"
                  style={{
                    background: m.status === "measured" ? "var(--healthy-soft)" : m.status === "target" ? "var(--attention-soft)" : "var(--surface-inset)",
                    color: m.status === "measured" ? "var(--healthy)" : m.status === "target" ? "var(--attention)" : "var(--ink-muted)",
                  }}
                >
                  {m.status}
                </span>
              </div>
              <p
                className="mono mt-4 text-[var(--ink-primary)]"
                style={{ fontSize: m.status === "unmeasured" ? "1.0625rem" : "1.75rem", fontWeight: 500, letterSpacing: "-0.01em" }}
              >
                {formatMetricValue(m)}
              </p>
              <p className="mt-1 text-[length:0.75rem] text-[var(--ink-muted)]">{formatMetricSub(m)}</p>
              <p className="mt-3 flex-1 text-[length:0.8125rem] leading-relaxed text-[var(--ink-secondary)]">
                {m.description}
              </p>
              {m.methodologyLink && (
                <Link
                  href={m.methodologyLink}
                  className="mt-4 inline-flex items-center gap-1 text-[length:0.8125rem] font-medium text-[var(--ink-primary)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--ink-primary)]"
                >
                  Methodology
                </Link>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      {/* ablation matrix */}
      <Reveal delay={100}>
        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-[var(--line-subtle)] px-5 py-4">
            <h3 className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">Ablation matrix</h3>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
            {ablationMatrix.rows.map((row, i) => (
              <li
                key={row}
                className={`flex items-center justify-between gap-3 px-5 py-3.5 ${
                  i < ablationMatrix.rows.length - 1 ? "border-b sm:border-b lg:border-b-0" : ""
                } border-[var(--line-subtle)] lg:odd:border-r`}
              >
                <span className="text-[length:var(--text-small)] text-[var(--ink-primary)]">{row}</span>
                <span className="mono text-[length:0.6875rem] text-[var(--ink-muted)]">pending benchmark</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-[var(--line-subtle)] px-5 py-3.5 text-[length:0.8125rem] leading-relaxed text-[var(--ink-muted)]">
            {ablationMatrix.note}
          </p>
        </div>
      </Reveal>

      {/* callout */}
      <Reveal delay={140}>
        <div className="mt-6 flex flex-col items-start gap-5 rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-card)] p-6 sm:flex-row sm:items-center sm:justify-between" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="max-w-[62ch] text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
            <span className="font-semibold text-[var(--ink-primary)]">{evaluationIntro.callout.split("—")[0]}</span>
            —{evaluationIntro.callout.split("—")[1]}
          </p>
          <ButtonLink href={evaluationIntro.cta.href} variant="secondary" arrow>
            {evaluationIntro.cta.label}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
