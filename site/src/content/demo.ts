export type SeatState = "normal" | "review" | "high-review" | "unobservable";

export interface DemoSeat {
  id: string;
  row: number;
  col: number;
  state: SeatState;
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
      if (id === "B3" || id === "C2") state = "review";
      if (id === "D5") state = "unobservable";
      if (id === "A4") state = "high-review";
      seats.push({ id, row: r, col: c, state, attention: 0.3 + ((r + c) % 4) * 0.15 });
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
  status: "pending" | "accepted" | "dismissed";
}

export const initialDemoAlerts: DemoAlert[] = [
  {
    id: "alert-1",
    seat: "B3",
    pairedSeat: "C2",
    behaviour: "Reciprocal attention pattern",
    severity: "medium",
    startTime: "00:42:10",
    duration: "6.2 s (cumulative)",
    repetitions: 3,
    confidence: 0.81,
    visibility: 0.86,
    counterfactual: "A single brief glance, or fewer than three repetitions, would not have generated this alert.",
    status: "pending",
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
    counterfactual: "A single glance under the seat's own baseline duration would not have generated this alert.",
    status: "pending",
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
  },
];

export interface TimelineEvent {
  t: string;
  label: string;
  tone: "healthy" | "review" | "high-review" | "unobservable";
}

export const timelineEvents: TimelineEvent[] = [
  { t: "00:00:00", label: "Session start · Hall A · 20 seats calibrated", tone: "healthy" },
  { t: "00:18:04", label: "Seat D5 crosses visibility floor → unobservable", tone: "unobservable" },
  { t: "00:42:10", label: "B3 ↔ C2 reciprocal pattern opens", tone: "review" },
  { t: "00:48:12", label: "B3 ↔ C2 pattern closes → review card issued", tone: "review" },
  { t: "00:51:33", label: "A4 sustained off-desk attention → review card issued", tone: "high-review" },
  { t: "01:02:47", label: "D2 hand-zone object candidate (low confidence)", tone: "review" },
];

export const healthMetrics = {
  cameras: [
    { id: "CAM-A", status: "healthy", fps: 12.4 },
    { id: "CAM-B", status: "healthy", fps: 11.8 },
  ],
  gpuLoad: 0.64,
  avgLatencyMs: 3200,
};
