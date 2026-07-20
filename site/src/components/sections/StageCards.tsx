import { pipelineStages } from "@/content/home";

export function StageCards() {
  return (
    <div className="grid gap-0 border border-[var(--line-strong)] sm:grid-cols-5">
      {pipelineStages.map((stage, index) => (
        <div
          key={stage.index}
          className={
            "flex flex-col gap-3 p-6" +
            (index < pipelineStages.length - 1 ? " border-b sm:border-b-0 sm:border-r" : "") +
            " border-[var(--line-subtle)]"
          }
        >
          <span className="font-mono text-[var(--text-label)] text-[var(--ink-secondary)]">{stage.index} /</span>
          <h3 className="font-medium uppercase" style={{ fontSize: "15px", letterSpacing: "var(--tracking-wide)" }}>
            {stage.title}
          </h3>
          <p className="text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
            {stage.description}
          </p>
        </div>
      ))}
    </div>
  );
}
