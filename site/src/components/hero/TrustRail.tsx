interface TrustRailProps {
  items: string[];
}

export function TrustRail({ items }: TrustRailProps) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-t border-[var(--line-subtle)] bg-[var(--surface-1)] py-4">
      <div className="trust-rail-track flex w-max items-center gap-10">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-2 whitespace-nowrap font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]"
          >
            <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--healthy)]" />
            {item}
          </span>
        ))}
      </div>
      <style>{`
        .trust-rail-track {
          animation: trust-rail-scroll 32s linear infinite;
        }
        @keyframes trust-rail-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .trust-rail-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
