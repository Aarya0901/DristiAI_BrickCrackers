import type { TimelineEvent } from "@/content/demo";

const toneColor: Record<string, string> = {
  healthy: "var(--healthy)",
  review: "var(--review)",
  "high-review": "var(--high-review)",
  unobservable: "var(--unobservable)",
};

export function TimelineStrip({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col gap-0 border-l border-[var(--line-subtle)]">
      {events.map((event) => (
        <li key={event.t} className="relative flex items-start gap-4 py-3 pl-6">
          <span
            aria-hidden
            className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: toneColor[event.tone] }}
          />
          <span className="w-20 shrink-0 font-mono text-[12px] text-[var(--ink-secondary)]">{event.t}</span>
          <span style={{ fontSize: "14px" }}>{event.label}</span>
        </li>
      ))}
    </ol>
  );
}
