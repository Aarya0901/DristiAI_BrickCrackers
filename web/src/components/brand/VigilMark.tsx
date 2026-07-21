/**
 * VIGIL mark — a seat field read as a graph: a 3×3 grid of seat nodes with
 * one reciprocal pair connected (the C7↔C8 edge). Geometric, abstract,
 * no eye imagery. Variants: full lockup, monogram (mark only), inverse.
 */
export function VigilMark({
  size = 22,
  inverse = false,
  className,
}: {
  size?: number;
  inverse?: boolean;
  className?: string;
}) {
  const ink = inverse ? "#F4F4F5" : "#242424";
  const accent = inverse ? "#7FD4E3" : "#0E9FBE";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="VIGIL"
      className={className}
    >
      {/* seat field */}
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke={ink} strokeWidth="1.6" />
      <circle cx="8" cy="8" r="1.5" fill={ink} />
      <circle cx="12" cy="8" r="1.5" fill={ink} />
      <circle cx="16" cy="8" r="1.5" fill={ink} />
      <circle cx="8" cy="12" r="1.5" fill={ink} />
      {/* reciprocal pair */}
      <circle cx="13.4" cy="12" r="1.7" fill={accent} />
      <circle cx="17.2" cy="14.8" r="1.7" fill={accent} />
      <path d="M13.4 12 L17.2 14.8 M17.2 14.8 L13.4 12" stroke={accent} strokeWidth="1.2" />
      <circle cx="8" cy="16" r="1.5" fill={ink} />
      <circle cx="12" cy="16" r="1.5" fill={ink} opacity="0.35" />
    </svg>
  );
}

export function VigilWordmark({
  inverse = false,
  className,
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <VigilMark size={22} inverse={inverse} />
      <span
        className="font-display"
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: inverse ? "var(--ink-inverse)" : "var(--ink-primary)",
        }}
      >
        VIGIL
      </span>
    </span>
  );
}
