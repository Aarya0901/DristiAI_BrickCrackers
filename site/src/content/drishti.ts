export const drishtiSections = [
  {
    id: "head-yaw-limits",
    eyebrow: "〉WHY NOT HEAD-YAW ALONE  [1/7]",
    heading: "Head direction alone under-counts attention.",
    support:
      "A coarse left/centre/right head-direction class is stable and cheap, but it collapses a continuum of behaviour into three buckets. Someone facing forward with eyes down at a phone reads identically to someone reading their own paper.",
  },
  {
    id: "heatmap-to-gazemass",
    eyebrow: "〉HEATMAPS TO GAZE-MASS  [2/7]",
    heading: "From a per-frame heatmap to a per-seat gaze-mass score.",
    support:
      "The attention estimator produces a soft heatmap over the scene for each visible person. Projected onto the calibrated seat map, that heatmap becomes a gaze-mass value per seat — how much attention-weight is landing where, not just which of three directions a head is pointed.",
  },
  {
    id: "desk-leakage",
    eyebrow: "〉DESK LEAKAGE MAP  [3/7]",
    heading: "Where is attention leaking off a student's own desk?",
    support:
      "Aggregated over a rolling window, gaze-mass that consistently lands outside a seat's own desk polygon — toward a neighbour, not just briefly — becomes the Desk Leakage Map: the room-level view of where attention is flowing between seats.",
  },
  {
    id: "attention-fingerprints",
    eyebrow: "〉ATTENTION FINGERPRINTS  [4/7]",
    heading: "Every seat gets its own normal, not a shared threshold.",
    support:
      "A seat's attention fingerprint is its own distribution of on-desk vs. off-desk gaze-mass over the session so far. Deviation from a seat's own fingerprint is far more informative than deviation from a population average.",
  },
  {
    id: "coverage-complement",
    eyebrow: "〉COVERAGE COMPLEMENT  [5/7]",
    heading: "The field only claims what the camera can actually resolve.",
    support:
      "Attention estimates are only produced where visibility tier and pose confidence clear a minimum bar. Everywhere else, the field explicitly renders as unobservable rather than silently extrapolating.",
  },
  {
    id: "tiers-abstention",
    eyebrow: "〉CAPABILITY TIERS  [6/7]",
    heading: "Three tiers, one honest degradation path.",
    support:
      "Tier A resolves finer head-direction detail at close range. Tier B holds coarse direction classes. Tier C drops to posture-only signals. Below Tier C, the seat abstains — it does not guess.",
  },
];

export const drishtiTiers = [
  { tier: "A", label: "Full", pixelFloor: "Face ≥ ~40px", signal: "Finer head-direction estimate" },
  { tier: "B", label: "Coarse", pixelFloor: "Face ~20–40px", signal: "L / C / R / rear / uncertain" },
  { tier: "C", label: "Posture only", pixelFloor: "Face < ~20px", signal: "Torso orientation only" },
];
