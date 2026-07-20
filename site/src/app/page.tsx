import { Hero } from "@/components/hero/Hero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { CapabilityCatalog } from "@/components/sections/CapabilityCatalog";
import { GatewayCard } from "@/components/sections/GatewayCard";
import { LegacyComparison } from "@/components/sections/LegacyComparison";
import { StageCards } from "@/components/sections/StageCards";
import { PipelineDiagram } from "@/components/sections/PipelineDiagram";
import { PipelineTabs } from "@/components/sections/PipelineTabs";
import { MetricCard } from "@/components/sections/MetricCard";
import { AblationMatrix } from "@/components/sections/AblationMatrix";
import { ComparisonChart } from "@/components/sections/ComparisonChart";
import { UseCaseCarousel } from "@/components/sections/UseCaseCarousel";
import { DeploymentCard } from "@/components/sections/DeploymentCard";
import { BadgeRail } from "@/components/sections/BadgeRail";
import { TrustPanel } from "@/components/sections/TrustPanel";
import { EvidenceCard } from "@/components/sections/EvidenceCard";
import { BuildStageGrid } from "@/components/sections/BuildStageGrid";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { Button } from "@/components/ui/Button";
import {
  deploymentModes,
  gatewayCards,
  securityBadges,
  trustPanels,
} from "@/content/home";
import { metrics } from "@/content/metrics";

export default function Home() {
  return (
    <>
      <Hero />

      <SectionFrame
        id="capabilities"
        eyebrow="〉CAPABILITY CATALOG  [1/9]"
        heading="All the signals needed to understand a hall — without identifying a student."
        support="Focused primitives for observing, correlating, explaining, and reviewing physical examination-hall behaviour."
        noTopBorder
      >
        <CapabilityCatalog />
      </SectionFrame>

      <SectionFrame
        id="what-vigil-does"
        eyebrow="〉WHAT VIGIL DOES  [2/9]"
        heading={
          <>
            Bring the CCTV.
            <br />
            VIGIL builds understanding.
            <br />
            The invigilator keeps the decision.
          </>
        }
        support="One local system, two operating surfaces."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <GatewayCard {...gatewayCards.liveAssist} />
          <GatewayCard {...gatewayCards.controlRoom} />
        </div>
        <LegacyComparison />
      </SectionFrame>

      <SectionFrame
        id="how-it-works"
        eyebrow="〉HOW IT WORKS  [3/9]"
        heading="Five stages. One evidence graph."
        support="Observe, anchor, estimate, correlate, explain. The fifth stage is what keeps the first four accountable."
      >
        <StageCards />
        <PipelineDiagram />
        <PipelineTabs />
      </SectionFrame>

      <SectionFrame
        id="evaluation"
        eyebrow="〉EVALUATION  [4/9]"
        heading="We do not think one accuracy number tells the full story."
        support="So the system is evaluated on the cost of being wrong, the ability to abstain, and the quality of every explanation."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
        <ComparisonChart />
        <AblationMatrix />
        <div className="border border-[var(--brand-cobalt)] bg-[var(--surface-1)] p-6">
          <p style={{ fontSize: "var(--text-body-lg)" }}>
            <strong>Headline metric:</strong> false alerts per student-hour — because an
            invigilator assistant that cries wolf becomes another screen nobody trusts.
          </p>
        </div>
        <Button href="/research#evaluation" variant="ghost">
          Read the evaluation protocol
        </Button>
      </SectionFrame>

      <SectionFrame
        id="use-cases"
        eyebrow="〉USE CASES  [5/9]"
        heading="Built for the places where one pair of eyes is not enough."
      >
        <UseCaseCarousel />
      </SectionFrame>

      <SectionFrame
        id="deployment"
        eyebrow="〉DEPLOYMENT  [6/9]"
        heading="VIGIL runs where the footage already lives."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {deploymentModes.map((mode) => (
            <DeploymentCard key={mode.id} {...mode} />
          ))}
        </div>
        <BadgeRail items={securityBadges} />
        <p className="text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
          Designed for DPDP-aligned deployment — not a certification claim.
        </p>
      </SectionFrame>

      <SectionFrame
        id="trust-principles"
        eyebrow="〉TRUST PRINCIPLES  [7/9]"
        heading="The uncomfortable parts are part of the product."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {trustPanels.map((panel, index) => (
            <TrustPanel key={panel.id} index={index + 1} title={panel.title} body={panel.body} />
          ))}
        </div>
        <EvidenceCard />
      </SectionFrame>

      <SectionFrame
        id="build-stages"
        eyebrow="〉BUILD STAGES  [8/9]"
        heading="Prototype honestly. Pilot in shadow mode. Deploy only after measurement."
      >
        <BuildStageGrid />
        <Button href="/roadmap" variant="ghost">
          View the roadmap
        </Button>
      </SectionFrame>

      <SectionFrame
        id="faq"
        eyebrow="〉FAQ  [9/9]"
        heading="The difficult questions, in plain English."
      >
        <FaqAccordion />
      </SectionFrame>

      <FinalCta />
    </>
  );
}
