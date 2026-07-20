import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { SectionFrame } from "@/components/layout/SectionFrame";
import { DeploymentCard } from "@/components/sections/DeploymentCard";
import { BadgeRail } from "@/components/sections/BadgeRail";
import { deploymentModes, securityBadges } from "@/content/home";
import { cameraHealthChecks, failureModes, retentionDefaults } from "@/content/deployment";

export const metadata: Metadata = {
  title: "Deployment",
  description:
    "VIGIL's local-first deployment model: on-premise, private network, and fully offline modes, with failure handling, camera health, and retention defaults.",
  alternates: { canonical: "/deployment" },
};

export default function DeploymentPage() {
  return (
    <>
      <PageHero
        breadcrumb="› DEPLOYMENT"
        heading="Local by default. Observable by design."
        support="VIGIL runs where the footage already lives — from a single offline machine to a private, institution-wide network. No mode requires uploading raw video to a public cloud."
      />

      <SectionFrame
        id="on-premise"
        eyebrow="〉MODES  [1/5]"
        heading="Three deployment shapes, one privacy posture."
        noTopBorder
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {deploymentModes.map((mode) => (
            <DeploymentCard key={mode.id} {...mode} />
          ))}
        </div>
        <div id="private-network" />
        <div id="offline" />
      </SectionFrame>

      <SectionFrame
        id="event-data-flow"
        eyebrow="〉EVENT DATA FLOW  [2/5]"
        heading="What actually leaves a camera's local scope."
        support="Only structured event metadata — seat ID, behaviour type, timing, confidence, visibility — and short skeleton-first clips cross from the per-camera worker to any shared dashboard. Raw video stays local unless a deployment explicitly enables clip review."
      >
        <BadgeRail items={securityBadges} />
      </SectionFrame>

      <SectionFrame
        id="failure-modes"
        eyebrow="〉FAILURE MODES  [3/5]"
        heading="Degrade visibly. Never fail silently."
      >
        <div className="grid gap-0 border border-[var(--line-strong)] sm:grid-cols-2">
          {failureModes.map((mode, index) => (
            <div
              key={mode.id}
              className={`p-6 ${index % 2 === 0 ? "sm:border-r" : ""} ${index < failureModes.length - (failureModes.length % 2 === 0 ? 2 : 1) ? "border-b" : ""} border-[var(--line-subtle)]`}
            >
              <h3 className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
                {mode.title}
              </h3>
              <p className="mt-2 text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
                {mode.response}
              </p>
            </div>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame
        id="camera-health"
        eyebrow="〉CAMERA HEALTH  [4/5]"
        heading="The dashboard watches the cameras, not just the students."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {cameraHealthChecks.map((check) => (
            <li key={check} className="flex items-start gap-3 border border-[var(--line-subtle)] p-4" style={{ fontSize: "14px" }}>
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--healthy)]" />
              {check}
            </li>
          ))}
        </ul>
      </SectionFrame>

      <SectionFrame
        id="retention"
        eyebrow="〉RETENTION  [5/5]"
        heading="Configurable retention, by data type."
      >
        <div className="grid gap-0 border border-[var(--line-strong)] sm:grid-cols-2">
          {retentionDefaults.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 p-5 ${index < retentionDefaults.length - 1 ? "border-b sm:border-b-0" : ""} ${index % 2 === 0 ? "sm:border-r" : ""} border-[var(--line-subtle)]`}
            >
              <span className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
                {row.label}
              </span>
              <span className="text-right" style={{ fontSize: "14px" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[var(--ink-secondary)]" style={{ fontSize: "13px" }}>
          Designed for DPDP-aligned deployment — not a certification claim. See{" "}
          <a href="/privacy" className="text-[var(--brand-cobalt)] hover:underline">
            /privacy
          </a>{" "}
          for the full posture.
        </p>
      </SectionFrame>
    </>
  );
}
