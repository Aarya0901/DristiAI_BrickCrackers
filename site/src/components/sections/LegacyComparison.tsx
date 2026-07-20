import { legacyComparison } from "@/content/home";

export function LegacyComparison() {
  const { legacy, vigil } = legacyComparison;
  return (
    <div className="grid overflow-hidden border border-[var(--line-strong)] sm:grid-cols-2">
      <div className="flex flex-col gap-3 border-b border-[var(--line-subtle)] bg-[var(--surface-2)] p-7 sm:border-b-0 sm:border-r">
        <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
          Before
        </p>
        <h3 className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
          {legacy.title}
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {legacy.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)" }}>
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--unobservable)]" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3 bg-[var(--surface-1)] p-7">
        <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--brand-cobalt)]">
          VIGIL
        </p>
        <h3 className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
          {vigil.title}
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {vigil.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[var(--ink-primary)]" style={{ fontSize: "var(--text-body)" }}>
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--healthy)]" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
