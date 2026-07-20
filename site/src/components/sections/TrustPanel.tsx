interface TrustPanelProps {
  index: number;
  title: string;
  body: string;
}

export function TrustPanel({ index, title, body }: TrustPanelProps) {
  return (
    <div className="flex flex-col gap-4 border border-[var(--line-strong)] bg-[var(--surface-1)] p-8">
      <span className="font-mono text-[var(--text-label)] text-[var(--ink-secondary)]">
        {String(index).padStart(2, "0")} /
      </span>
      <h3 className="font-medium" style={{ fontSize: "var(--text-heading-lg)", letterSpacing: "var(--tracking-snug)" }}>
        {title}
      </h3>
      <p className="text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)" }}>
        {body}
      </p>
    </div>
  );
}
