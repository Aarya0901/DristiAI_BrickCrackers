export function SkeletonReplay() {
  return (
    <div className="border border-[var(--line-strong)] bg-[var(--bg-inverse)] p-6">
      <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label="Skeleton-first replay of the two seats involved">
        {[70, 250].map((cx, i) => (
          <g key={cx}>
            <rect x={cx - 40} y={40} width="80" height="60" fill="none" stroke="var(--line-inverse)" strokeWidth="1" />
            <circle cx={cx} cy={60} r="8" fill="var(--ink-inverse)" />
            <line
              x1={cx}
              y1={60}
              x2={i === 0 ? cx + 60 : cx - 60}
              y2={50}
              stroke="var(--attention)"
              strokeWidth="2"
              className="skeleton-replay-ray"
            />
            <line x1={cx} y1={68} x2={cx} y2={92} stroke="var(--ink-inverse)" strokeWidth="2" />
            <text x={cx} y={112} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink-inverse-secondary)">
              {i === 0 ? "B3" : "C2"}
            </text>
          </g>
        ))}
        <line x1="130" y1="55" x2="190" y2="55" stroke="var(--attention)" strokeWidth="1" strokeDasharray="3 3" />
      </svg>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)]">
        Skeleton-first replay · no raw video shown by default
      </p>
      <style>{`
        .skeleton-replay-ray {
          animation: skeleton-ray-sway 2.4s ease-in-out infinite;
        }
        @keyframes skeleton-ray-sway {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-replay-ray { animation: none; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
