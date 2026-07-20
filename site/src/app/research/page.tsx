import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import {
  capabilityTiers,
  datasetPlan,
  evaluationPrinciples,
  limitations,
  modelStack,
  references,
} from "@/content/research";
import { AblationMatrix } from "@/components/sections/AblationMatrix";
import { metrics } from "@/content/metrics";
import { MetricCard } from "@/components/sections/MetricCard";

export const metadata: Metadata = {
  title: "Research",
  description:
    "VIGIL's architecture, model stack, capability tiers, dataset plan, evaluation protocol, ablation matrix, limitations, and references — measured, not claimed.",
  alternates: { canonical: "/research" },
};

export default function ResearchPage() {
  return (
    <>
      <PageHero
        breadcrumb="› RESEARCH"
        heading="Measured on the errors that matter."
        support="Every model choice, every threshold, and every claimed capability traces to a stated reason. Anything unmeasured is labelled as such — never a placeholder number."
      />

      <SectionFrame
        id="architecture"
        eyebrow="〉ARCHITECTURE  [1/8]"
        heading="Pretrained perception. Deterministic judgment."
        support="The perception stack (detection, pose, tracking) is entirely pretrained ONNX models — no fine-tuning on the critical path. The judgment layer is deterministic rules, chosen specifically because rules can explain themselves."
        noTopBorder
      >
        <div className="grid gap-0 border border-[var(--line-strong)]">
          {modelStack.map((row, index) => (
            <div
              key={row.layer}
              className={`grid grid-cols-[180px_1fr] gap-4 p-4 ${index < modelStack.length - 1 ? "border-b border-[var(--line-subtle)]" : ""}`}
            >
              <p className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
                {row.layer}
              </p>
              <p style={{ fontSize: "14px" }}>{row.approach}</p>
            </div>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="capability-tiers"
        eyebrow="〉CAPABILITY TIERS  [2/8]"
        heading="Capability is reported per tier, not as one blended number."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          {capabilityTiers.map((tier) => (
            <div key={tier.tier} className="border border-[var(--line-strong)] p-6">
              <p className="font-mono text-[13px] text-[var(--ink-secondary)]">TIER {tier.tier}</p>
              <p className="mt-1 font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
                {tier.label}
              </p>
              <p className="mt-2 text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="dataset-plan"
        eyebrow="〉DATASET PLAN  [3/8]"
        heading="No public exam-hall dataset exists — so the dataset is the moat and the responsibility."
      >
        <ul className="flex flex-col gap-3">
          {datasetPlan.map((item) => (
            <li key={item} className="flex items-start gap-3 border-b border-[var(--line-subtle)] pb-3">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-cobalt)]" />
              <span style={{ fontSize: "var(--text-body)" }}>{item}</span>
            </li>
          ))}
        </ul>
      </SectionFrame>

      <SectionFrame
        id="evaluation"
        eyebrow="〉EVALUATION PROTOCOL  [4/8]"
        heading="Every metric carries a sample size and a measurement date, or it doesn't ship."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {evaluationPrinciples.map((item) => (
            <li key={item} className="border border-[var(--line-subtle)] p-4" style={{ fontSize: "14px" }}>
              {item}
            </li>
          ))}
        </ul>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="ablation"
        eyebrow="〉ABLATION MATRIX  [5/8]"
        heading="Each component is meant to be measured with and without."
      >
        <AblationMatrix />
      </SectionFrame>

      <SectionFrame
        id="limitations"
        eyebrow="〉LIMITATIONS  [6/8]"
        heading="What this system does not do."
        support="Stated up front, not buried in a footnote."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {limitations.map((lim) => (
            <div key={lim.id} className="border border-[var(--high-review)] bg-[var(--high-review-soft)]/20 p-5">
              <h3 className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
                {lim.title}
              </h3>
              <p className="mt-2 text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
                {lim.body}
              </p>
            </div>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="references"
        eyebrow="〉REFERENCES  [7/8]"
        heading="Built on published, licensed work."
      >
        <ul className="flex flex-col gap-4">
          {references.map((ref) => (
            <li key={ref.label} className="border-b border-[var(--line-subtle)] pb-4">
              <p className="font-medium" style={{ fontSize: "15px" }}>
                {ref.label}
              </p>
              <p className="mt-1 text-[var(--ink-secondary)]" style={{ fontSize: "13px" }}>
                {ref.note}
              </p>
            </li>
          ))}
        </ul>
      </SectionFrame>

      <SectionFrame
        id="no-fabrication-rule"
        eyebrow="〉NO-FABRICATION RULE  [8/8]"
        heading="If it isn't measured, it says so."
      >
        <div className="border border-[var(--line-strong)] bg-[var(--surface-1)] p-7">
          <p style={{ fontSize: "var(--text-body-lg)", lineHeight: "var(--lh-loose)" }}>
            Every metric on this site renders from a single typed configuration
            (<code className="font-mono text-[14px]">content/metrics.ts</code>). A metric with
            status <code className="font-mono text-[14px]">&quot;unmeasured&quot;</code> can only
            render as <strong>Validation in progress</strong> — the component that displays
            metrics has no code path that turns an absent value into a number.
          </p>
        </div>
      </SectionFrame>
    </>
  );
}
