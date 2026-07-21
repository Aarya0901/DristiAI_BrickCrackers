import type { Metric } from "./types";

/**
 * Single source of truth for every metric shown anywhere on the site.
 * status "unmeasured" => value: null (type-enforced) => renders as
 * "Validation in progress", never a number. See tests/metrics.test.ts.
 */
export const metrics: Metric[] = [
  {
    id: "false-alerts-per-student-hour",
    label: "False alerts / student-hour",
    status: "unmeasured",
    value: null,
    unit: "alerts/student-hour",
    description:
      "The headline system metric: how often the system asks for review that a human would not have flagged. Measured against the team's own consented, annotated recordings — not a public benchmark, because none exists for this problem.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "event-recall",
    label: "Event-level recall",
    status: "unmeasured",
    value: null,
    unit: "%",
    description:
      "Share of annotator-confirmed behavioural events the pipeline actually surfaced as candidates, before any alert threshold is applied.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "seat-attribution-accuracy",
    label: "Seat-attribution accuracy",
    status: "unmeasured",
    value: null,
    unit: "%",
    description:
      "Share of frames where a tracked person is attributed to the correct anonymous seat, verified against a hand-labelled seat map.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "alert-latency",
    label: "Alert latency",
    status: "target",
    value: null,
    unit: "s",
    targetLabel: "≤ 5 s",
    description:
      "Time from a behaviour crossing the alert threshold to the review card appearing in the queue. A target, not yet a measured result.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "abstention-low-visibility",
    label: "Low-visibility abstention",
    status: "unmeasured",
    value: null,
    unit: "%",
    description:
      "Share of low-visibility seat-frames correctly routed to an unobservable state instead of a forced classification.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "explanation-completeness",
    label: "Explanation completeness",
    status: "unmeasured",
    value: null,
    unit: "%",
    description:
      "Share of review cards that carry every required evidence field — what happened, why it crossed the threshold, uncertainty, and counterfactual.",
    methodologyLink: "/research#evaluation",
  },
];

export function getMetric(id: string): Metric {
  const metric = metrics.find((m) => m.id === id);
  if (!metric) throw new Error(`Unknown metric id: ${id}`);
  return metric;
}
