export const seatGraphSections = [
  {
    id: "anomaly-insufficient",
    eyebrow: "Why solo scores fail",
    heading: "One seat's anomaly score, on its own, is weak evidence.",
    support:
      "A single seat glancing sideways twice could be a stiff neck, a wall clock, or curiosity about a dropped pen. The same signal means something different once you know whether another seat responded.",
  },
  {
    id: "seats-as-nodes",
    eyebrow: "Seats as nodes",
    heading: "Anonymous seats, not people, are the graph's vertices.",
    support:
      "The seat graph never stores an identity. Every node is a seat ID valid for the session's duration — the relational structure is entirely about geometry and behaviour, never about who is sitting there.",
  },
  {
    id: "directed-reciprocal",
    eyebrow: "Directed & reciprocal edges",
    heading: "An edge starts as a direction. It becomes evidence when it's returned.",
    support:
      "A glance toward a neighbour creates a directed, time-decayed edge. If the neighbour orients back within a short window, the edge becomes reciprocal — the strongest single relational signal VIGIL has.",
  },
  {
    id: "temporal-fusion",
    eyebrow: "Temporal evidence fusion",
    heading: "Duration, repetition, and timing are combined, not just counted.",
    support:
      "Fusion weighs how long, how often, how quickly a response came, and how far each seat's behaviour sits from its own baseline — producing one severity, with every contributing signal kept visible.",
  },
  {
    id: "counterfactual-card",
    eyebrow: "The counterfactual alert card",
    heading: "Every alert also states what would not have triggered it.",
    support:
      "A review card that only argues for itself is half an explanation. VIGIL's cards list the counter-evidence: the patterns that stayed below threshold, the signals that were absent, and the visibility conditions that would have suppressed the alert entirely.",
  },
  {
    id: "handoff-patterns",
    eyebrow: "Handoff & pair patterns",
    heading: "Some patterns only exist across two seats.",
    support:
      "A hand-to-neighbour object transfer, a synchronized pair of glances, or a repeated head-turn toward the same seat are pair-level patterns — invisible to any single-seat anomaly score by construction.",
  },
  {
    id: "human-review-workflow",
    eyebrow: "Human review workflow",
    heading: "Every pair alert routes to a person before it means anything.",
    support:
      "A pair alert opens a review card scoped to both seats, with independent per-seat evidence and the shared edge evidence side by side. Acceptance, dismissal, and notes all feed back into that seat's baseline.",
  },
];
