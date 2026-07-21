import type { SeatState } from "../../content/types";

/** Shared seat-state styling: colour + label, never colour alone. */
export const seatStateStyles: Record<
  SeatState,
  { fill: string; soft: string; ink: string; label: string; pattern?: boolean }
> = {
  normal: {
    fill: "var(--healthy)",
    soft: "var(--healthy-soft)",
    ink: "var(--healthy)",
    label: "Normal",
  },
  review: {
    fill: "var(--review)",
    soft: "var(--review-soft)",
    ink: "var(--review)",
    label: "Review",
  },
  "high-review": {
    fill: "var(--high-review)",
    soft: "var(--high-review-soft)",
    ink: "var(--high-review)",
    label: "High review",
  },
  unobservable: {
    fill: "var(--unobservable)",
    soft: "var(--unobservable-soft)",
    ink: "var(--unobservable)",
    label: "Unobservable",
    pattern: true,
  },
};
