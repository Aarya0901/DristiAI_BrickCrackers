interface BadgeRailProps {
  items: string[];
}

export function BadgeRail({ items }: BadgeRailProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-[var(--radius-sm)] border border-[var(--line-strong)] px-3 py-1.5 font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-primary)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
