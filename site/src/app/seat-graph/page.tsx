import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { SeatGraphDiagram } from "@/components/seat-graph/SeatGraphDiagram";
import { seatGraphSections } from "@/content/seat-graph";
import { EvidenceCard } from "@/components/sections/EvidenceCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Seat-Graph Evidence Fusion",
  description:
    "How VIGIL turns anonymous seats into graph nodes, builds directed and reciprocal edges, and fuses temporal evidence into a counterfactual review card.",
  alternates: { canonical: "/seat-graph" },
};

export default function SeatGraphPage() {
  return (
    <>
      <PageHero
        breadcrumb="› SEAT-GRAPH EVIDENCE FUSION"
        heading="Behaviour becomes evidence when the room is understood relationally."
        support="Anonymous seats are nodes. Repeated glances, reciprocal orientation, torso shifts, and temporal responses create explainable edges between seats — the basis for every pairwise review request."
        visual={<SeatGraphDiagram />}
      />

      {seatGraphSections.slice(0, 4).map((section, index) => (
        <SectionFrame
          key={section.id}
          id={section.id}
          eyebrow={section.eyebrow}
          heading={section.heading}
          support={section.support}
          noTopBorder={index === 0}
        />
      ))}

      <SectionFrame
        id="counterfactual-alert-card"
        eyebrow="〉COUNTERFACTUAL ALERT CARD  [5/7]"
        heading="Every pair alert states what would not have triggered it."
        support="The same counterfactual discipline used on the homepage trust section applies to every seat-graph alert — evidence, uncertainty, and a stated non-trigger case, side by side."
      >
        <EvidenceCard />
      </SectionFrame>

      {seatGraphSections.slice(4).map((section) => (
        <SectionFrame key={section.id} id={section.id} eyebrow={section.eyebrow} heading={section.heading} support={section.support} />
      ))}

      <SectionFrame
        id="seat-graph-demo-cta"
        eyebrow="〉SEE IT RUNNING"
        heading="Walk through a live review queue in the interactive demo."
      >
        <div className="flex flex-wrap gap-4">
          <Button href="/demo" variant="primary">
            Open the interactive demo
          </Button>
          <Button href="/research#evaluation" variant="ghost">
            Read the evaluation protocol
          </Button>
        </div>
      </SectionFrame>
    </>
  );
}
