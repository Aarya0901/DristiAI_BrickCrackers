export const seatGraphSections = [
  {
    id: "anomaly-insufficient",
    eyebrow: "〉WHY SOLO SCORES FAIL  [1/7]",
    heading: "One seat's anomaly score, on its own, is weak evidence.",
    support:
      "A single seat glancing sideways twice could be a stiff neck, a wall clock, or curiosity about a dropped pen. The same signal means something different once you know whether another seat responded.",
  },
  {
    id: "seats-as-nodes",
    eyebrow: "〉SEATS AS NODES  [2/7]",
    heading: "Anonymous seats, not people, are the graph's vertices.",
    support:
      "The seat graph never stores an identity. Every node is a seat ID valid for the session's duration — the relational structure is entirely about geometry and behaviour, never about who is sitting there.",
  },
  {
    id: "directed-reciprocal",
    eyebrow: "〉DIRECTED & RECIPROCAL EDGES  [3/7]",
    heading: "An edge starts as a direction. It becomes evidence when it's returned.",
    support:
      "A glance toward a neighbour creates a directed, time-decayed edge. If the neighbour orients back within a short window, the edge becomes reciprocal — the strongest single relational signal VIGIL has.",
  },
  {
    id: "temporal-fusion",
    eyebrow: "〉TEMPORAL EVIDENCE FUSION  [4/7]",
    heading: "Duration, repetition, and timing are combined, not just counted.",
    support:
      "Fusion weighs how long, how often, how quickly a response came, and how far each seat's behaviour sits from its own baseline — producing one severity, with every contributing signal kept visible.",
  },
  {
    id: "handoff-patterns",
    eyebrow: "〉HANDOFF & PAIR PATTERNS  [6/7]",
    heading: "Some patterns only exist across two seats.",
    support:
      "A hand-to-neighbour object transfer, a synchronized pair of glances, or a repeated head-turn toward the same seat are pair-level patterns — invisible to any single-seat anomaly score by construction.",
  },
  {
    id: "human-review-workflow",
    eyebrow: "〉HUMAN REVIEW WORKFLOW  [7/7]",
    heading: "Every pair alert routes to a person before it means anything.",
    support:
      "A pair alert opens a review card scoped to both seats, with independent per-seat evidence and the shared edge evidence side by side. Acceptance, dismissal, and notes all feed back into that seat's baseline.",
  },
];
