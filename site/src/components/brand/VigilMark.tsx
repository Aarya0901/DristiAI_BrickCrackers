interface VigilMarkProps {
  className?: string;
  /** "mono" draws everything in currentColor. "accent" tints the edge cyan. */
  variant?: "mono" | "accent";
}

/**
 * VIGIL monogram: four corner brackets imply a field of view / review
 * bracket without a literal eye icon. A 3x2 seat grid sits inside, with one
 * edge highlighted — the reciprocal seat-graph connection that is VIGIL's
 * core idea. Pure geometry, fully original.
 */
export function VigilMark({ className, variant = "accent" }: VigilMarkProps) {
  const edgeColor = variant === "accent" ? "var(--attention)" : "currentColor";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="VIGIL mark"
    >
      {/* corner brackets: field of view */}
      <path d="M2 9V3h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 9V3h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 23v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 23v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* seat grid: 3x2 anonymous nodes */}
      {[10, 16, 22].map((cx) =>
        [12, 20].map((cy) => (
          <rect key={`${cx}-${cy}`} x={cx - 1.5} y={cy - 1.5} width="3" height="3" fill="currentColor" />
        ))
      )}

      {/* one reciprocal edge, highlighted */}
      <line x1="10" y1="12" x2="22" y2="20" stroke={edgeColor} strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="10" cy="12" r="2.5" fill={edgeColor} />
      <circle cx="22" cy="20" r="2.5" fill={edgeColor} />
    </svg>
  );
}
