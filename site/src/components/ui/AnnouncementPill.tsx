interface AnnouncementPillProps {
  children: string;
}

export function AnnouncementPill({ children }: AnnouncementPillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-[var(--text-label)] font-mono uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--attention)]" aria-hidden />
      {children}
    </div>
  );
}
