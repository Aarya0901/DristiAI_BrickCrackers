import type { SeatState } from "./types";

export interface DemoSeat {
  id: string;
  row: number;
  col: number;
  state: SeatState;
  tier: "A" | "B" | "C";
  attention: number;
}

export function buildDemoSeats(): DemoSeat[] {
  const rows = 4;
  const cols = 5;
  const seats: DemoSeat[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `${String.fromCharCode(65 + r)}${c + 1}`;
      let state: SeatState = "normal";
      if (id === "C7" || id === "B3") state = "review";
      if (id === "D5") state = "unobservable";
      if (id === "A4") state = "high-review";
      const tier: DemoSeat["tier"] = r === 0 ? "A" : r < 2 ? "B" : "C";
      seats.push({ id, row: r, col: c, state, tier, attention: 0.3 + ((r + c) % 4) * 0.15 });
    }
  }
  return seats;
}

export interface DemoAlert {
  id: string;
  seat: string;
  pairedSeat?: string;
  behaviour: string;
  severity: "medium" | "high";
  startTime: string;
  duration: string;
  repetitions: number;
  confidence: number;
  visibility: number;
  counterfactual: string;
  status: "pending" | "acknowledged" | "dismissed";
  relativeTime: string;
}

export const initialDemoAlerts: DemoAlert[] = [
  {
    id: "alert-1",
    seat: "C7",
    pairedSeat: "C8",
    behaviour: "Reciprocal attention pattern",
    severity: "medium",
    startTime: "00:42:10",
    duration: "6.2 s (cumulative)",
    repetitions: 3,
    confidence: 0.81,
    visibility: 0.86,
    counterfactual:
      "A single brief glance, or fewer than three repetitions, would not have generated this alert.",
    status: "pending",
    relativeTime: "2 min ago",
  },
  {
    id: "alert-2",
    seat: "A4",
    behaviour: "Sustained off-desk attention, no reciprocal seat",
    severity: "high",
    startTime: "00:51:33",
    duration: "11.4 s (cumulative)",
    repetitions: 5,
    confidence: 0.74,
    visibility: 0.91,
    counterfactual:
      "A single glance under the seat's own baseline duration would not have generated this alert.",
    status: "pending",
    relativeTime: "6 min ago",
  },
  {
    id: "alert-3",
    seat: "D2",
    behaviour: "Hand-zone object candidate, low confidence",
    severity: "medium",
    startTime: "01:02:47",
    duration: "2.1 s",
    repetitions: 1,
    confidence: 0.52,
    visibility: 0.79,
    counterfactual: "Confidence below 0.5 would have suppressed this alert entirely.",
    status: "pending",
    relativeTime: "14 min ago",
  },
];

export interface TimelineEvent {
  t: string;
  label: string;
  tone: SeatState;
}

export const timelineEvents: TimelineEvent[] = [
  { t: "00:00:00", label: "Session start · Hall A · 20 seats calibrated", tone: "normal" },
  { t: "00:18:04", label: "Seat D5 crosses visibility floor → unobservable", tone: "unobservable" },
  { t: "00:42:10", label: "C7 ↔ C8 reciprocal pattern opens", tone: "review" },
  { t: "00:48:12", label: "C7 ↔ C8 pattern closes → review card issued", tone: "review" },
  { t: "00:51:33", label: "A4 sustained off-desk attention → review card issued", tone: "high-review" },
  { t: "01:02:47", label: "D2 hand-zone object candidate (low confidence)", tone: "review" },
];

export const healthMetrics = {
  cameras: [
    { id: "CAM-A", status: "healthy" as const, fps: 12.4, resolution: "1080p" },
    { id: "CAM-B", status: "healthy" as const, fps: 11.8, resolution: "1080p" },
  ],
  gpuLoad: 0.64,
  avgLatencyMs: 3200,
};

export const seatStateLabels: Record<SeatState, string> = {
  normal: "Normal",
  review: "Review",
  "high-review": "High review",
  unobservable: "Unobservable",
};
