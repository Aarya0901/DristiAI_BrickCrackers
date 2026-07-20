import type { BuildStage } from "./types";

export const buildStages: BuildStage[] = [
  {
    id: "prototype",
    title: "Prototype",
    status: "active",
    items: [
      "One hall, one camera",
      "Scripted benchmark",
      "Live dashboard",
      "Drishti + Seat Graph",
      "Backup replay",
    ],
  },
  {
    id: "pilot",
    title: "Pilot",
    status: "next",
    items: [
      "Real exam centre",
      "Shadow mode only",
      "Alerts logged, not acted upon",
      "Camera survey",
      "False-alert study",
      "Appeals and review workflow",
    ],
  },
  {
    id: "institution",
    title: "Institution",
    status: "planned",
    items: [
      "Multi-hall dashboard",
      "Role-based review",
      "Policy controls",
      "Retention configuration",
      "Model and data cards",
    ],
  },
  {
    id: "production",
    title: "Production",
    status: "roadmap",
    items: [
      "Multi-camera fusion",
      "Fleet monitoring",
      "Drift detection",
      "Calibrated thresholds",
      "Security hardening",
      "Independent evaluation",
    ],
  },
];

export interface ValidationGate {
  stage: string;
  goCriteria: string[];
  noGoCriteria: string[];
  risks: string;
  fallback: string;
}

export const validationGates: ValidationGate[] = [
  {
    stage: "Prototype → Pilot",
    goCriteria: [
      "End-to-end demo path reproduces on a clean run with zero manual data edits",
      "At least one correct non-alert and one visibility abstention demonstrated on held-out footage",
      "Every alert card traces to real system state (card-equals-database guard passes)",
    ],
    noGoCriteria: [
      "Thresholds only work on the exact tuning clip and collapse on new footage",
      "Seat attribution breaks under normal occlusion (a person walking past)",
    ],
    risks: "Small annotated dataset; thresholds may overfit to one room's geometry and lighting.",
    fallback: "Ship head-direction-only signals and cut the learned attention estimator if it doesn't generalise.",
  },
  {
    stage: "Pilot → Institution",
    goCriteria: [
      "Shadow-mode false-alert rate is low enough that invigilators keep checking the queue",
      "Camera survey confirms visibility tiers hold across the centre's real camera stock",
      "Appeals workflow produces a legible audit trail",
    ],
    noGoCriteria: [
      "Invigilators report alert fatigue or stop trusting the queue",
      "A meaningful share of seats sit in Tier C (posture-only) across surveyed rooms",
    ],
    risks: "Real institutional camera placement is rarely ideal; back-row visibility is a hard physical constraint.",
    fallback: "Recommend camera-position changes before enabling live alerts in affected rooms; keep shadow mode running.",
  },
];
