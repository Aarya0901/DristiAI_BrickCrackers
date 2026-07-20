interface CodePanelProps {
  code: string;
  label?: string;
}

export function CodePanel({ code, label }: CodePanelProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line-inverse)] bg-[var(--bg-inverse)]">
      <div className="flex items-center gap-2 border-b border-[var(--line-inverse)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--unobservable)]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--review)]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--healthy)]" aria-hidden />
        {label && (
          <span className="ml-3 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)]">
            {label}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-[var(--ink-inverse)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
