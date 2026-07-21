/**
 * Homepage content. Salvaged from the pre-revert build (see
 * docs/salvage-notes.md) and bound to the cal.com-grammar section plan.
 */

export const hero = {
  announcement: "NEW · Drishti Attention Field is now the flagship perception layer",
  headlineLines: ["The attention intelligence layer", "for physical exam halls."],
  subheading:
    "VIGIL turns ordinary examination-hall CCTV into an identity-free invigilator assistant — tracking anonymous seats, estimating attention, correlating behaviour between students, and explaining every review request.",
  ctaPrimary: { label: "Explore VIGIL", href: "/drishti" },
  ctaSecondary: { label: "View the live system", href: "/demo" },
  commandStrip: "$ vigil analyze --source hall-a --privacy skeleton-first",
  supportingLine: "No facial recognition · Local inference · Human review required",
};

export const capabilityRail: string[] = [
  "Anonymous seat IDs",
  "Drishti attention field",
  "Seat-graph evidence",
  "Counterfactual alerts",
  "Visibility-aware abstention",
  "Event-only retention",
  "On-premise deployment",
];

export interface PipelineStage {
  index: string;
  label: string;
  title: string;
  description: string;
  mock: "stream" | "anchor" | "heat" | "pair" | "evidence";
}

export const pipelineStages: PipelineStage[] = [
  {
    index: "01",
    label: "OBSERVE",
    title: "Observe",
    description: "Decode the RTSP or USB feed. Detect people and extract pose keypoints.",
    mock: "stream",
  },
  {
    index: "02",
    label: "ANCHOR",
    title: "Anchor",
    description: "Bind tracks to fixed seat polygons. Preserve continuity through short occlusion.",
    mock: "anchor",
  },
  {
    index: "03",
    label: "ESTIMATE",
    title: "Estimate",
    description:
      "Produce attention heatmaps, head direction, torso angle, wrist trajectories, visibility, and object candidates.",
    mock: "heat",
  },
  {
    index: "04",
    label: "CORRELATE",
    title: "Correlate",
    description:
      "Combine duration, repetition, baseline deviation, target seat, reciprocal response, geometry, and confidence.",
    mock: "pair",
  },
  {
    index: "05",
    label: "EXPLAIN",
    title: "Explain",
    description:
      "Create a behavioural review request with evidence, uncertainty, replay, and a counterfactual.",
    mock: "evidence",
  },
];

export const gatewayCards = {
  liveAssist: {
    id: "live-assist",
    title: "Live Invigilator Assist",
    description:
      "The in-room surface: a live hall view, seat map, attention lens, review queue, and skeleton replay for the person actually watching the room.",
    features: [
      "Live hall view",
      "Seat map",
      "Attention lens",
      "Review queue",
      "Skeleton replay",
      "Accept / dismiss flow",
      "Camera and GPU health",
    ],
    stats: [
      { label: "Alert latency", value: "≤ 5 s target" },
      { label: "Processed frame rate", value: "10–15 FPS target" },
      { label: "Seat attribution", value: "Anonymous" },
      { label: "Decision authority", value: "Human review required" },
    ],
    cta: { label: "Open dashboard preview", href: "/demo" },
  },
  controlRoom: {
    id: "control-room",
    title: "Control Room Intelligence",
    description:
      "The cross-hall surface: multiple hall summaries, attention coverage, event timelines, and review prioritisation for exam-cell staff watching more than one room.",
    features: [
      "Multiple hall summaries",
      "Attention coverage",
      "Event timelines",
      "Review prioritisation",
      "Unobservable-seat warnings",
      "Session report",
    ],
    stats: [
      { label: "Scope", value: "Multi-hall overview" },
      { label: "Storage", value: "Event-only" },
      { label: "Access", value: "Role-based review" },
      { label: "Aggregation", value: "Local or private network" },
    ],
    cta: { label: "See deployment model", href: "/deployment" },
  },
};

export const legacyComparison = {
  legacy: {
    title: "Legacy CCTV",
    points: [
      "Stores footage",
      "Shifts attention to a screen wall",
      "No seat attribution",
      "No uncertainty",
      "No explanation",
    ],
  },
  vigil: {
    title: "VIGIL",
    points: [
      "Prioritises review windows",
      "Maps evidence to anonymous seats",
      "Correlates pairwise patterns",
      "Exposes uncertainty",
      "Never issues a verdict",
    ],
  },
};

export const smallFeatures = [
  { id: "identity-free", title: "Identity-free by design", icon: "shield" },
  { id: "event-only", title: "Event-only retention", icon: "clock" },
  { id: "role-based", title: "Role-based review", icon: "users" },
  { id: "audit-log", title: "Audit log", icon: "list" },
  { id: "deletion", title: "Configurable deletion", icon: "trash" },
  { id: "encrypted", title: "Encrypted clips", icon: "lock" },
  { id: "human-gate", title: "Human review gate", icon: "check" },
  { id: "offline", title: "Offline capable", icon: "offline" },
] as const;

export const evaluationIntro = {
  eyebrow: "Evaluation",
  heading: "We do not think one accuracy number tells the full story.",
  support:
    "So the system is evaluated on the cost of being wrong, the ability to abstain, and the quality of every explanation.",
  callout:
    "Headline metric: false alerts per student-hour — because an invigilator assistant that cries wolf becomes another screen nobody trusts.",
  cta: { label: "Read the evaluation protocol", href: "/research#evaluation" },
};

export const ablationMatrix = {
  rows: [
    "Seat anchor",
    "Personal baseline",
    "Pair evidence",
    "Visibility abstention",
    "Phone temporal confirmation",
    "Gaze-mass vs. head-yaw",
  ],
  note: "Each row is a component the fusion layer can be evaluated with or without. Populated once the scripted benchmark produces held-out results — see /research#evaluation.",
};

export const trustPanels = [
  {
    id: "never-accuses",
    title: "Never accuses",
    body: "VIGIL produces behavioural review requests. The invigilator interprets the evidence.",
  },
  {
    id: "says-when-cannot-see",
    title: "Says when it cannot see",
    body: "Occlusion, weak pose confidence, degraded tracking, and distant seats can place the system in an unobservable state.",
  },
  {
    id: "measures-false-alarms",
    title: "Measures false alarms",
    body: "The headline system metric is false alerts per student-hour, not a vague model accuracy percentage.",
  },
];

export const sampleEvidenceCard = {
  seat: "C7",
  pairedSeat: "C8",
  behaviour: "Reciprocal attention pattern",
  severity: "medium" as const,
  startTime: "00:42:10",
  duration: "6.2 s (cumulative)",
  repetitions: 3,
  direction: "Right, toward C8",
  confidence: 0.81,
  visibility: 0.86,
  timeline: [
    { t: "00:42:10", label: "Glance 1 — C7 → C8, 1.9 s" },
    { t: "00:43:02", label: "Glance 2 — C7 → C8, 2.1 s" },
    { t: "00:44:18", label: "Glance 3 — C7 → C8, 2.2 s · C8 responds within 4 s" },
  ],
  triggered: [
    "Three glances toward C8 exceeding the 1.8 s duration gate, within a 90 s window",
    "C8 oriented toward C7 within 6 s of the third glance (reciprocal response)",
    "Both seats above the Tier B visibility floor for the full window",
  ],
  notTriggered: [
    "A single glance under 1.8 s — below the duration gate",
    "Two glances without a reciprocal response from C8",
    "The same pattern with either seat below the visibility floor",
  ],
  uncertain: [
    "Whether the exchanged glances involved a physical object — no object candidate was detected",
    "Content of any verbal exchange, if one occurred — audio is out of scope",
  ],
  counterfactual:
    "A single brief glance, or fewer than three repetitions, would not have generated this alert.",
};

/** Illustrative alert payload — labelled illustrative wherever rendered. */
export const alertJsonExample = `{
  "seat": "C7",
  "type": "reciprocal_attention_pattern",
  "pairedSeat": "C8",
  "repetitions": 3,
  "visibility": 0.86,
  "confidence": 0.81,
  "severity": "medium",
  "language": "human_review_recommended",
  "counterfactual": "A single brief glance would not have generated this alert."
}`;

export const buildStagesIntro = {
  eyebrow: "Build stages",
  heading: "Prototype honestly. Pilot in shadow mode. Deploy only after measurement.",
  cta: { label: "View the roadmap", href: "/roadmap" },
};

export const finalCta = {
  headline: "An invigilator assistant should know what it knows — and what it does not.",
  subline: "See behaviour. Review evidence. Keep the decision human.",
  ctaPrimary: { label: "Explore the live system", href: "/demo" },
  ctaSecondary: { label: "Read the architecture", href: "/research" },
};
