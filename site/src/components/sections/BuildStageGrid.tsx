import { buildStages } from "@/content/roadmap";
import { cn } from "@/lib/cn";

const statusLabel: Record<string, string> = {
  active: "Active",
  next: "Next",
  planned: "Planned",
  roadmap: "Roadmap",
};

const statusColor: Record<string, string> = {
  active: "border-[var(--healthy)] bg-[var(--healthy-soft)]",
  next: "border-[var(--review)] bg-[var(--review-soft)]",
  planned: "border-[var(--line-strong)] bg-[var(--surface-2)]",
  roadmap: "border-[var(--unobservable)] bg-[var(--unobservable-soft)]",
};

export function BuildStageGrid() {
  return (
    <div className="grid gap-0 border border-[var(--line-strong)] sm:grid-cols-2 lg:grid-cols-4">
      {buildStages.map((stage, index) => (
        <div
          key={stage.id}
          className={cn(
            "flex flex-col gap-4 p-6",
            index % 2 === 0 ? "border-b sm:border-r" : "border-b",
            index >= 2 && "sm:border-b-0",
            "lg:border-b-0",
            index < buildStages.length - 1 && "lg:border-r",
            "border-[var(--line-subtle)]"
          )}
        >
          <span
            className={cn(
              "w-fit rounded-[var(--radius-xs)] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-wide)]",
              statusColor[stage.status]
            )}
          >
            {statusLabel[stage.status]}
          </span>
          <h3 className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
            {stage.title}
          </h3>
          <ul className="flex flex-col gap-2">
            {stage.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-secondary)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
