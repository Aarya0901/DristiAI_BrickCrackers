import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { dpdpAlignment, privacyPrinciples } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "VIGIL's privacy posture: no facial recognition, anonymous seat IDs, transient inference, skeleton-first replay, event-only retention, and human review.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        breadcrumb="› PRIVACY"
        heading="No identity is required to understand behaviour."
        support="Every principle below is a constraint on the system's design, not a policy promise layered on top of it. If a capability required identity, it isn't in VIGIL."
      />

      <SectionFrame
        id="principles"
        eyebrow="〉PRIVACY PRINCIPLES  [1/3]"
        heading="Ten constraints the architecture enforces."
        noTopBorder
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {privacyPrinciples.map((p, index) => (
            <div key={p.id} className="border border-[var(--line-strong)] bg-[var(--surface-1)] p-6">
              <span className="font-mono text-[var(--text-label)] text-[var(--ink-secondary)]">
                {String(index + 1).padStart(2, "0")} /
              </span>
              <h3 className="mt-2 font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
                {p.title}
              </h3>
              <p className="mt-2 text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="human-review"
        eyebrow="〉HUMAN REVIEW  [2/3]"
        heading="The system's authority ends at a review card."
        support="VIGIL is built so that removing the human reviewer from the loop is not a configuration option — every alert path terminates in a review queue, not an automated action."
      />

      <SectionFrame
        id="dpdp-alignment"
        eyebrow="〉DPDP-ALIGNED DESIGN  [3/3]"
        heading="Designed for DPDP-aligned deployment — not a certification claim."
        support="These are design-language alignments with India's Digital Personal Data Protection Act, 2023, not a legal or regulatory certification. Institutions remain responsible for their own compliance review."
      >
        <ul className="flex flex-col gap-3">
          {dpdpAlignment.map((item) => (
            <li key={item} className="flex items-start gap-3 border-b border-[var(--line-subtle)] pb-3">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-cobalt)]" />
              <span style={{ fontSize: "var(--text-body)" }}>{item}</span>
            </li>
          ))}
        </ul>
        <div className="border border-[var(--line-subtle)] bg-[var(--surface-2)] p-5">
          <p className="text-[var(--ink-secondary)]" style={{ fontSize: "13px" }}>
            This page describes design intent and is not legal advice. VIGIL does not claim SOC 2,
            ISO 27001, or DPDP certification of any kind.
          </p>
        </div>
      </SectionFrame>
    </>
  );
}
