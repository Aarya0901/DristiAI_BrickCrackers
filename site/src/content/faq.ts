import type { FaqCategory, FaqItem } from "./types";

export const faqCategories: FaqCategory[] = [
  { id: "all", label: "All" },
  { id: "capability", label: "Capability" },
  { id: "privacy", label: "Privacy" },
  { id: "deployment", label: "Deployment" },
  { id: "limitations", label: "Limitations" },
];

export const faqItems: FaqItem[] = [
  {
    id: "decide-cheating",
    question: "Does VIGIL decide that a student is cheating?",
    answer:
      "No. VIGIL produces a behavioural review request: seat, behaviour, evidence, confidence, and uncertainty. A human invigilator interprets the evidence and makes any judgement. VIGIL never outputs a verdict, a risk score, or the words \"cheating confirmed.\"",
    categories: ["capability", "limitations"],
  },
  {
    id: "facial-recognition",
    question: "Does it use facial recognition?",
    answer:
      "No. VIGIL has no facial recognition and no identity linkage of any kind. Students are represented only as anonymous seat IDs (e.g. C7) for the duration of a session.",
    categories: ["privacy"],
  },
  {
    id: "eye-tracking",
    question: "Is this eye tracking?",
    answer:
      "No. VIGIL does not claim pupil-level gaze. It estimates coarse head direction, torso orientation, and scene-level attention mass at the resolution typical CCTV actually supports — described throughout as an attention estimate, never gaze proof.",
    categories: ["capability", "limitations"],
  },
  {
    id: "occlusion",
    question: "What happens when a student is occluded?",
    answer:
      "The seat is marked unobservable. VIGIL abstains from automated assessment for that seat rather than guessing — visibility-insufficient is a neutral state, not a suspicious one.",
    categories: ["capability", "privacy"],
  },
  {
    id: "chits-earpieces",
    question: "Can it detect tiny chits or earpieces?",
    answer:
      "Not reliably. At typical exam-hall camera distances, chits and earpieces are physically below a usable pixel floor. VIGIL does not claim this capability and will not fabricate confidence where the underlying signal doesn't exist.",
    categories: ["limitations", "capability"],
  },
  {
    id: "reduce-false-alerts",
    question: "How does it reduce false alerts?",
    answer:
      "Personal per-seat baselines instead of one fixed threshold, pairwise seat-graph corroboration instead of single-signal triggers, duration and repetition gating, and visibility-aware abstention that removes low-confidence frames from consideration entirely.",
    categories: ["capability"],
  },
  {
    id: "drishti-attention-field",
    question: "What is the Drishti Attention Field?",
    answer:
      "A scene-level attention-estimation layer that produces an attention estimate for each visible student, projects it onto the calibrated seat map, and builds a live room-level field of where attention is accumulating.",
    categories: ["capability"],
  },
  {
    id: "seat-graph",
    question: "What is a seat graph?",
    answer:
      "Anonymous seats treated as nodes. Repeated glances, reciprocal orientation, torso shifts, and temporal responses create explainable, evidenced edges between seats — the basis for pairwise review requests.",
    categories: ["capability"],
  },
  {
    id: "offline",
    question: "Can it run without internet?",
    answer:
      "Yes. VIGIL is designed for local or on-premise inference, including a fully offline single-machine mode suitable for demos and sensitive environments.",
    categories: ["deployment", "privacy"],
  },
  {
    id: "cloud-upload",
    question: "Is raw video uploaded to the cloud?",
    answer:
      "No. Raw footage is not persisted or uploaded by default. Only short event clips (skeleton-first) and metadata are retained, under a configurable retention window.",
    categories: ["privacy", "deployment"],
  },
  {
    id: "alert-review",
    question: "How are alerts reviewed?",
    answer:
      "Every alert surfaces as an evidence card in a review queue. An invigilator can accept, dismiss with a reason, or annotate — replay is skeleton-first, with the option to view the source clip if the deployment enables it.",
    categories: ["capability", "privacy"],
  },
  {
    id: "metrics-reported",
    question: "What metrics will be reported?",
    answer:
      "False alerts per student-hour, event-level recall, seat-attribution accuracy, alert latency, and abstention rate on low-visibility frames — each backed by a scripted benchmark. Anything not yet measured is labelled Validation in progress, never a placeholder number.",
    categories: ["capability", "limitations"],
  },
  {
    id: "camera-distance",
    question: "How does VIGIL handle different camera distances?",
    answer:
      "Seats are assigned a visibility tier (A/B/C) from measured pixel geometry at setup. Front-row, high-resolution seats support finer signals; distant or low-resolution seats degrade gracefully to posture-only signals or abstention, and this tier is always visible to the invigilator.",
    categories: ["capability", "limitations", "deployment"],
  },
  {
    id: "retention-config",
    question: "Can institutions configure retention?",
    answer:
      "Yes. Retention windows for event clips and metadata are configurable per deployment, with deletion controls and an audit trail, designed for DPDP-aligned operation.",
    categories: ["privacy", "deployment"],
  },
  {
    id: "after-dismiss",
    question: "What happens after an invigilator dismisses an alert?",
    answer:
      "The dismissal is logged with an optional reason. It contributes to that seat's baseline and to the session's false-alert measurement — dismissals are signal, not just an undo button.",
    categories: ["capability", "privacy"],
  },
];
