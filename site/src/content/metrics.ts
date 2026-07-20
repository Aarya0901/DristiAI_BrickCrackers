import type { Metric } from "./types";

/**
 * Single source of truth for every metric shown anywhere on the site.
 * A metric with status "unmeasured" renders as "Validation in progress" —
 * never a number. No value here is invented; see docs/content-truth.md.
 */
export const metrics: Metric[] = [
  {
    id: "false-alerts-per-student-hour",
    label: "False alerts / student-hour",
    status: "unmeasured",
    description:
      "The headline system metric: how often the system asks for review that a human would not have flagged. Measured against the team's own consented, annotated recordings — not a public benchmark, because none exists for this problem.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "event-recall",
    label: "Event-level recall",
    status: "unmeasured",
    description:
      "Share of annotator-confirmed behavioural events the pipeline actually surfaced as candidates, before any alert threshold is applied.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "alert-latency",
    label: "Alert latency",
    status: "target",
    targetLabel: "≤ 5 s",
    description:
      "Time from a behaviour crossing the alert threshold to the review card appearing in the queue. A target, not yet a measured result.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "processed-fps",
    label: "Processed frame rate",
    status: "target",
    targetLabel: "≥ 10 FPS",
    description:
      "Sustained per-camera throughput on the reference GPU during a live session, after detection, pose, tracking, and signal extraction.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "abstention-low-visibility",
    label: "Abstention on low-visibility frames",
    status: "unmeasured",
    description:
      "Share of low-visibility seat-frames correctly routed to an unobservable state instead of a forced classification.",
    methodologyLink: "/research#evaluation",
  },
  {
    id: "seat-attribution-accuracy",
    label: "Seat attribution accuracy",
    status: "unmeasured",
    description:
      "Share of frames where a tracked person is attributed to the correct anonymous seat, verified against a hand-labelled seat map.",
    methodologyLink: "/research#evaluation",
  },
];

export function getMetric(id: string): Metric {
  const metric = metrics.find((m) => m.id === id);
  if (!metric) {
    throw new Error(`Unknown metric id: ${id}`);
  }
  return metric;
}
