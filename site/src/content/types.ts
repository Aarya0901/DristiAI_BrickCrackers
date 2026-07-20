/**
 * Shared content types. A metric with status "unmeasured" must never render
 * as a number — see MetricValue rendering rule enforced in <MetricCard />.
 */

export type MetricStatus = "measured" | "target" | "unmeasured";

export interface Metric {
  id: string;
  label: string;
  status: MetricStatus;
  /** Only present when status is "measured". Never invented. */
  value?: number;
  unit?: string;
  /** Present when status is "target" (e.g. "≤ 5 s", "≥ 10"). */
  targetLabel?: string;
  source?: string;
  measuredAt?: string;
  methodologyLink?: string;
  description: string;
}

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
  title: string;
  eyebrow: string;
  summary: string;
}

export interface UseCase {
  id: string;
  title: string;
  environment: string;
  cameraArrangement: string;
  primaryRisk: string;
  capability: string;
  deploymentConstraint: string;
  limitation: string;
}

export interface BuildStage {
  id: string;
  title: string;
  status: "active" | "next" | "planned" | "roadmap";
  items: string[];
}
