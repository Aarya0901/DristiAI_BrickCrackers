import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { DemoDashboard } from "@/components/demo/DemoDashboard";

export const metadata: Metadata = {
  title: "Interactive Demo",
  description:
    "A polished interactive simulation of the VIGIL dashboard — seat map, attention lens, review queue, skeleton replay, timeline, and camera health.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <>
      <PageHero
        breadcrumb="› INTERACTIVE PRODUCT SIMULATION"
        heading="Walk through the dashboard an invigilator actually sees."
        support="Every seat, alert, and timeline event below is simulated data running on the same design system as the marketing site. Nothing here represents a real exam session."
      />

      <SectionFrame
        id="dashboard"
        eyebrow="〉LIVE INVIGILATOR ASSIST"
        heading="Seat map, review queue, replay, and health — in one view."
        noTopBorder
      >
        <DemoDashboard />
      </SectionFrame>
    </>
  );
}
