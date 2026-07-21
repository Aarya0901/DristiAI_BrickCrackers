export const modelStack = [
  {
    layer: "Person detection",
    approach: "Pretrained ONNX detector (YOLOX/RTMDet family), no fine-tuning on the critical path.",
  },
  {
    layer: "Pose estimation",
    approach: "RTMPose-m via rtmlib, COCO-17 keypoints, ONNX Runtime with CUDA execution provider.",
  },
  {
    layer: "Tracking",
    approach: "ByteTrack for short-horizon identity continuity, feeding the seat-anchor assignment step.",
  },
  {
    layer: "Seat anchoring",
    approach: "Deterministic polygon assignment with sticky-frame hysteresis and quarantine on ambiguous tracks.",
  },
  {
    layer: "Attention estimation",
    approach:
      "Default: deterministic head/torso-direction ray cast onto seat zones. Optional upgrade: learned gaze-mass estimator, gated behind an explicit go/no-go on real footage.",
  },
  {
    layer: "Judgment layer",
    approach:
      "Deterministic rule engine (duration, repetition, hysteresis, cooldown) — chosen because rules are themselves the explanation, not a black box scored after the fact.",
  },
  {
    layer: "Relational evidence",
    approach: "Directed, time-decayed seat-graph edges; reciprocal-edge detection promotes individual events to pair evidence.",
  },
];

export const capabilityTiers = [
  {
    tier: "A",
    label: "Full",
    description: "Face resolution ≥ ~40px. Finer head-direction signal available; still not pupil-level gaze.",
  },
  {
    tier: "B",
    label: "Coarse",
    description: "Face resolution ~20–40px. Head direction reduces to left/centre/right/rear/uncertain classes.",
  },
  {
    tier: "C",
    label: "Posture only",
    description: "Face resolution < ~20px. Only torso orientation and gross posture signals remain reliable.",
  },
];

export const datasetPlan = [
  "Consented, purpose-recorded footage from scripted sessions — no public exam-hall dataset exists for this problem.",
  "Event-level annotation (behaviour type, start/end, seat, pair) by the team, cross-checked for agreement.",
  "A held-out split used only for reported metrics; a separate tuning split used only for threshold selection.",
  "Regression clips covering known edge cases: correct non-alerts, occlusion-triggered abstention, and confirmed pair events.",
];

export const limitations = [
  {
    id: "no-pupil-gaze",
    title: "Pupil-level gaze is not claimed",
    body: "VIGIL estimates head direction and scene-level attention mass, not eye-tracking-grade gaze. Any claim beyond that is not made.",
  },
  {
    id: "chit-earpiece",
    title: "Long-range chit and earpiece detection is unreliable",
    body: "At typical CCTV distances these objects fall below a usable pixel floor. The system does not pretend otherwise.",
  },
  {
    id: "back-row",
    title: "Back-row capability depends on camera geometry",
    body: "No amount of software fixes a camera that physically cannot resolve a distant seat. Visibility tiers make this constraint visible, not hidden.",
  },
  {
    id: "abstention-not-forced",
    title: "Low visibility produces abstention, not a forced classification",
    body: "An unobservable seat is not treated as suspicious, normal, or anything else — it is excluded from automated assessment.",
  },
  {
    id: "no-decision",
    title: "VIGIL never decides that cheating occurred",
    body: "Every output is a behavioural review request. Interpretation and any consequence remain a human process, outside the system.",
  },
];

export const references = [
  {
    label: "ByteTrack: Multi-Object Tracking by Associating Every Detection Box",
    note: "Tracking backbone for short-horizon identity continuity feeding seat anchoring.",
  },
  {
    label: "RTMPose: Real-Time Multi-Person Pose Estimation",
    note: "Pose backbone used for keypoint extraction via rtmlib/ONNX Runtime.",
  },
  {
    label: "DPDP Act, 2023 (India) — data minimisation and purpose limitation principles",
    note: "Informs the privacy posture; VIGIL is designed for DPDP-aligned deployment, not certified.",
  },
];

export const evaluationPrinciples = [
  "No single accuracy number is treated as sufficient — cost of false alerts, ability to abstain, and explanation quality are evaluated together.",
  "Every reported metric carries a sample size (n) and a measurement date; a metric with zero supporting rows is never emitted.",
  "Thresholds are tuned only on the tuning split; reported metrics come only from the held-out split.",
  "An alert card is re-derived from its database row and checked for exact string equality before any demo — evidence must trace to real state, not to hand-typed copy.",
];

export const noFabricationStatement =
  "No metric on this site is measured unless it says so. Values that do not exist yet are shown as “Validation in progress”, and targets are labelled as targets. Nothing on this page is interpolated, estimated, or carried over from a different system.";
