import type { UseCase } from "./types";

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

export const trustRail: string[] = [
  "Anonymous seat IDs",
  "Drishti attention field",
  "Seat-graph evidence",
  "Counterfactual alerts",
  "Visibility-aware abstention",
  "Event-only retention",
  "On-premise deployment",
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
      { label: "Target alert latency", value: "≤ 5 s" },
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
      { label: "Aggregation", value: "Local or private-cloud" },
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

export interface PipelineStage {
  index: string;
  title: string;
  description: string;
}

export const pipelineStages: PipelineStage[] = [
  {
    index: "01",
    title: "Observe",
    description: "Decode the RTSP or USB feed. Detect people and extract pose keypoints.",
  },
  {
    index: "02",
    title: "Anchor",
    description: "Bind tracks to fixed seat polygons. Preserve continuity through short occlusion.",
  },
  {
    index: "03",
    title: "Estimate",
    description:
      "Produce attention heatmaps, head direction, torso angle, wrist trajectories, visibility, and object candidates.",
  },
  {
    index: "04",
    title: "Correlate",
    description:
      "Combine duration, repetition, baseline deviation, target seat, reciprocal response, geometry, object evidence, and confidence.",
  },
  {
    index: "05",
    title: "Explain",
    description: "Create a behavioural review request with evidence, uncertainty, replay, and a counterfactual.",
  },
];

export const pipelineFlow: string[] = [
  "Camera",
  "Detection",
  "Pose",
  "Seat Anchor",
  "Drishti",
  "Event Engine",
  "Seat Graph",
  "Evidence Fusion",
  "Review Card",
];

export const pipelineCodeSnippet = `// vigil/pipeline.ts — illustrative, not a public API
async function processFrame(frame: Frame): Promise<SeatState[]> {
  const detections = await detector.detect(frame);
  const poses = await pose.estimate(frame, detections);
  const tracks = tracker.update(detections, poses);

  return tracks.map((track) => {
    const seat = seatAnchor.assign(track);
    return buildSeatState(seat, track, frame.ts);
  });
}`;

export const eventsCodeSnippet = `# vigil/rules.py — illustrative, not a public API
def update(seat_state, buffer):
    signal = signal_value(seat_state)
    if buffer.state == "idle" and signal > theta_hi:
        buffer.open_event(seat_state.ts)
    if buffer.state == "in_event" and signal < theta_lo:
        event = buffer.close_event(seat_state.ts)
        if event.repetitions >= n_min and event.max_duration >= dur_min:
            yield candidate_event(event)`;

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

export const useCases: UseCase[] = [
  {
    id: "university-exams",
    title: "University examinations",
    environment: "Lecture-hall-style seating, 20–60 students, one to two fixed CCTV cameras.",
    cameraArrangement: "Single 1080p camera, front or diagonal elevated mount.",
    primaryRisk: "One invigilator, many rows — sustained attention beyond the front two rows is physically hard.",
    capability: "Maps anonymous seat activity, prioritises review windows, exposes seats with insufficient visibility.",
    deploymentConstraint: "Needs a seat-map calibration pass per room layout before a session starts.",
    limitation: "Back rows under a shallow camera angle degrade to posture-only signals.",
  },
  {
    id: "entrance-tests",
    title: "Competitive entrance tests",
    environment: "High-density seating, strict timing, large single-session cohorts.",
    cameraArrangement: "Multiple rooms, one camera per room, centrally reviewed.",
    primaryRisk: "High stakes per seat; false alerts are especially costly to trust in this setting.",
    capability: "Seat-graph pairwise evidence reduces reliance on any single noisy signal.",
    deploymentConstraint: "Requires per-room calibration and a shared control-room review workflow.",
    limitation: "Object-candidate detection (phone-sized items) is unreliable beyond a few metres.",
  },
  {
    id: "internal-assessments",
    title: "Internal assessments",
    environment: "Smaller cohorts, department-run, lower camera budget.",
    cameraArrangement: "Often a single USB or existing low-resolution CCTV camera.",
    primaryRisk: "Limited invigilator staffing per room.",
    capability: "Runs fully offline on one machine; no infrastructure beyond the room's existing camera.",
    deploymentConstraint: "Lower resolution pushes more seats into Tier B/C visibility.",
    limitation: "Coarse head-direction only; no fine gaze claims regardless of proximity.",
  },
  {
    id: "control-rooms",
    title: "Distributed control rooms",
    environment: "Multiple halls monitored centrally by exam-cell staff.",
    cameraArrangement: "One camera per hall, aggregated to a shared dashboard.",
    primaryRisk: "Attention-wall problem — many feeds, no prioritisation.",
    capability: "Cross-hall event timelines and review prioritisation surface the halls that need attention first.",
    deploymentConstraint: "Requires a local event bus or private network between halls and the control room.",
    limitation: "Aggregation is metadata-only; raw video does not leave the originating hall by default.",
  },
  {
    id: "shadow-pilots",
    title: "Shadow-mode pilots",
    environment: "Any of the above, run with alerts logged but not acted upon.",
    cameraArrangement: "Whatever the institution already has installed.",
    primaryRisk: "Deploying an unvalidated system directly into live decisions.",
    capability: "Full pipeline runs and logs everything; nothing surfaces to an invigilator as actionable yet.",
    deploymentConstraint: "Explicitly the recommended first deployment mode — see /roadmap.",
    limitation: "Produces a false-alert study, not a production alerting system, until that study concludes.",
  },
];

export const deploymentModes = [
  {
    id: "on-premise",
    index: "01",
    title: "On-premise",
    tagline: "Inside the examination centre.",
    points: [
      "Workstation or local GPU",
      "Raw footage remains inside the centre",
      "Event metadata feeds the dashboard",
    ],
  },
  {
    id: "private-network",
    index: "02",
    title: "Private network",
    tagline: "Across the institution.",
    points: [
      "Per-camera workers",
      "Local event bus",
      "Central review dashboard",
      "No public video upload",
    ],
  },
  {
    id: "offline",
    index: "03",
    title: "Offline",
    tagline: "On one machine.",
    points: [
      "File or USB input",
      "Local inference",
      "Local evidence storage",
      "Suitable for demos and sensitive environments",
    ],
  },
];

export const securityBadges: string[] = [
  "Identity-free by design",
  "Event-only retention",
  "Role-based access",
  "Audit log",
  "Configurable deletion",
  "Encrypted clips",
  "Human review gate",
];

export const sampleEvidenceCard = {
  seat: "C7",
  pairedSeat: "C8",
  behaviour: "Reciprocal attention pattern",
  startTime: "00:42:10",
  duration: "6.2 s (cumulative)",
  repetitions: 3,
  direction: "Right, toward C8",
  confidence: 0.81,
  visibility: 0.86,
  timeline: [
    { t: "00:42:10", label: "Glance 1 — C7 → C8, 1.9 s" },
    { t: "00:43:02", label: "Glance 2 — C7 → C8, 2.1 s" },
    { t: "00:44:18", label: "Glance 3 — C7 → C8, 2.2 s, C8 responds within 4 s" },
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
  counterfactual: "A single brief glance, or fewer than three repetitions, would not have generated this alert.",
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

export const finalCta = {
  headline: "An invigilator assistant should know what it knows — and what it does not.",
  subline: "See behaviour. Review evidence. Keep the decision human.",
  ctaPrimary: { label: "Explore the live system", href: "/demo" },
  ctaSecondary: { label: "Read the architecture", href: "/research" },
};

export const counterStrip = [
  { id: "sessions", label: "Sessions analysed" },
  { id: "events", label: "Benchmark events" },
  { id: "student-hours", label: "Student-hours reviewed" },
];
