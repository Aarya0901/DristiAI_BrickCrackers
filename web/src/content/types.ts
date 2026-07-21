/**
 * Shared content types.
 *
 * Metric is a discriminated union: a metric with status "unmeasured" or
 * "target" can only carry `value: null`, so rendering a number for an
 * unmeasured metric is a compile-time error, not a convention.
 * Proven by tests/metrics.test.ts.
 */

interface MetricBase {
  id: string;
  label: string;
  unit: string;
  source?: string;
  measuredAt?: string;
  methodologyLink?: string;
  description: string;
}

export type Metric =
  | (MetricBase & { status: "measured"; value: number })
  | (MetricBase & { status: "target"; value: null; targetLabel: string })
  | (MetricBase & { status: "unmeasured"; value: null });

export type MetricStatus = Metric["status"];

export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavLink[];
}

export interface FaqCategory {
  id: string;
  label: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  categories: string[];
}

export interface CapabilityItem {
  id: string;
  index: string;
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
}

export interface BuildStage {
  id: string;
  title: string;
  status: "active" | "next" | "planned" | "roadmap";
  items: string[];
}

export type SeatState = "normal" | "review" | "high-review" | "unobservable";
