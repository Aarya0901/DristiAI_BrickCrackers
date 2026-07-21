import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { DemoDashboard } from "../../components/demo/DemoDashboard";

export const metadata: Metadata = {
  title: "Interactive Product Simulation",
  description: "A simulated VIGIL dashboard — animated hall view, seat map, attention lens, review queue, evidence cards, and camera health. No real data; illustrative only.",
};

export default function DemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Demo"
        heading="Interactive product simulation"
        support="This is a simulated dashboard built from the same visual tokens as the marketing site. No live camera is connected; every seat state, alert, and timeline entry is a fixture."
      >
        <p className="mono mt-4 rounded-[var(--radius-pill)] bg-[var(--surface-inset)] px-3 py-1 text-[length:0.6875rem] text-[var(--ink-muted)]">
          Interactive product simulation · illustrative only
        </p>
      </PageHero>
      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        <DemoDashboard />
      </div>
      <div style={{ height: "var(--section-gap)" }} />
    </>
  );
}
