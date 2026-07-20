import type { CapabilityItem } from "./types";

export const capabilities: CapabilityItem[] = [
  {
    id: "drishti",
    index: "01",
    slug: "drishti",
    eyebrow: "01 · DRISHTI",
    title: "Drishti Attention Field",
    summary:
      "Scene-level attention estimates projected onto the calibrated seat map create a live room-level attention field.",
  },
  {
    id: "tracking",
    index: "02",
    slug: "anonymous-seat-tracking",
    eyebrow: "02 · TRACKING",
    title: "Anonymous Seat Tracking",
    summary:
      "Students remain anonymous seat IDs. Seat anchoring turns a generic tracking problem into a constrained assignment problem.",
  },
  {
    id: "relational-evidence",
    index: "03",
    slug: "seat-graph-evidence",
    eyebrow: "03 · RELATIONAL EVIDENCE",
    title: "Seat-Graph Evidence",
    summary:
      "Reciprocal glances, coordinated rotation, handoff candidates, and temporal responses become edges between seats.",
  },
  {
    id: "explainability",
    index: "04",
    slug: "counterfactual-alert-cards",
    eyebrow: "04 · EXPLAINABILITY",
    title: "Counterfactual Alert Cards",
    summary:
      "Every review card states what happened, why it crossed the threshold, what remains uncertain, and what would not have triggered it.",
  },
  {
    id: "baselines",
    index: "05",
    slug: "personal-baselines",
    eyebrow: "05 · PERSONAL CALIBRATION",
    title: "Personal Baselines",
    summary:
      "The system learns normal behaviour per seat during the session instead of applying one brittle threshold to everyone.",
  },
  {
    id: "objects",
    index: "06",
    slug: "object-hand-signals",
    eyebrow: "06 · MULTI-SIGNAL ANALYSIS",
    title: "Object & Hand Signals",
    summary:
      "Head direction, torso angle, wrist motion, hand zones, phone candidates, duration, repetition, and room geometry contribute evidence.",
  },
  {
    id: "abstention",
    index: "07",
    slug: "visibility-abstention",
    eyebrow: "07 · ABSTENTION",
    title: "Visibility & Abstention",
    summary:
      "When visibility, tracking, or pose confidence is insufficient, VIGIL suspends automated assessment rather than inventing certainty.",
  },
];
