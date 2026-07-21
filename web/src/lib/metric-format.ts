import type { Metric } from "../content/types";

/**
 * The only place a metric becomes display text.
 * unmeasured -> "Validation in progress" (never a number)
 * target     -> its target label (e.g. "≤ 5 s"), marked as a target
 * measured   -> value + unit
 */
export function formatMetricValue(metric: Metric): string {
  if (metric.status === "unmeasured") return "Validation in progress";
  if (metric.status === "target") return metric.targetLabel;
  return `${metric.value} ${metric.unit}`.trim();
}

export function formatMetricSub(metric: Metric): string {
  if (metric.status === "unmeasured")
    return "Measured results will appear after the scripted benchmark.";
  if (metric.status === "target") return "Target — not yet a measured result.";
  return metric.measuredAt ? `Measured ${metric.measuredAt}` : "Measured";
}
