import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { AttentionFieldCanvas } from "@/components/drishti/AttentionFieldCanvas";
import { drishtiSections, drishtiTiers } from "@/content/drishti";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Drishti Attention Field",
  description:
    "How VIGIL turns per-frame attention heatmaps into a calibrated, seat-level room attention field — with honest capability tiers and abstention.",
  alternates: { canonical: "/drishti" },
};

export default function DrishtiPage() {
  return (
    <>
      <PageHero
        breadcrumb="› DRISHTI ATTENTION FIELD"
        heading="See where attention accumulates."
        support="A scene-level attention-estimation layer that projects an attention estimate for each visible student onto the calibrated seat map, building a live room-level field — never a claim of pupil-level gaze."
        visual={<AttentionFieldCanvas />}
      />

      {drishtiSections.map((section, index) => (
        <SectionFrame
          key={section.id}
          id={section.id}
          eyebrow={section.eyebrow}
          heading={section.heading}
          support={section.support}
          noTopBorder={index === 0}
        >
          {section.id === "tiers-abstention" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr>
                    {["Tier", "Label", "Pixel floor", "Available signal"].map((h) => (
                      <th
                        key={h}
                        className="border border-[var(--line-subtle)] bg-[var(--surface-2)] p-3 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drishtiTiers.map((row) => (
                    <tr key={row.tier}>
                      <td className="border border-[var(--line-subtle)] p-3 font-mono text-[14px]">{row.tier}</td>
                      <td className="border border-[var(--line-subtle)] p-3" style={{ fontSize: "14px" }}>
                        {row.label}
                      </td>
                      <td className="border border-[var(--line-subtle)] p-3 font-mono text-[13px] text-[var(--ink-secondary)]">
                        {row.pixelFloor}
                      </td>
                      <td className="border border-[var(--line-subtle)] p-3" style={{ fontSize: "14px" }}>
                        {row.signal}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-[var(--line-subtle)] p-3 font-mono text-[14px] text-[var(--unobservable)]">
                      —
                    </td>
                    <td
                      className="border border-[var(--line-subtle)] bg-[var(--unobservable-soft)] p-3"
                      style={{ fontSize: "14px" }}
                    >
                      Unobservable
                    </td>
                    <td className="border border-[var(--line-subtle)] p-3 font-mono text-[13px] text-[var(--ink-secondary)]">
                      Below Tier C floor
                    </td>
                    <td className="border border-[var(--line-subtle)] p-3" style={{ fontSize: "14px" }}>
                      Abstains — no classification produced
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </SectionFrame>
      ))}

      <SectionFrame
        id="demo-cta"
        eyebrow="〉SEE IT RUNNING  [7/7]"
        heading="Watch the attention field respond in the interactive demo."
        support="The simulated dashboard runs the same visual language — attention lens, seat states, and abstention — against a scripted session."
      >
        <div className="flex flex-wrap gap-4">
          <Button href="/demo" variant="primary">
            Open the interactive demo
          </Button>
          <Button href="/seat-graph" variant="ghost">
            See how it becomes relational evidence
          </Button>
        </div>
      </SectionFrame>
    </>
  );
}
