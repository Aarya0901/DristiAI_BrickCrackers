import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

/**
 * Audited button geometry (docs/design-system.md):
 * h 36px (lg 46px), px 16, radius --radius-md, 14px/500.
 * Variants: primary (near-black), secondary (white + hairline), ghost (inset grey).
 */

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 500,
  fontSize: "var(--text-small)",
  borderRadius: "var(--btn-radius)",
  transition: `background var(--dur-micro) var(--ease-out), border-color var(--dur-micro) var(--ease-out), color var(--dur-micro) var(--ease-out)`,
  whiteSpace: "nowrap",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--ink-primary)] text-white hover:bg-black border border-[var(--ink-primary)]",
  secondary:
    "bg-[var(--surface-card)] text-[var(--ink-primary)] border border-[var(--line-subtle)] hover:border-[var(--line-strong)]",
  ghost: "bg-[var(--surface-inset)] text-[var(--ink-primary)] border border-transparent hover:bg-[var(--unobservable-soft)]",
};

const sizes: Record<Size, CSSProperties> = {
  md: { height: "var(--btn-h)", paddingInline: "var(--btn-px)" },
  lg: { height: "var(--btn-h-lg)", paddingInline: 22, fontSize: "0.9375rem" },
};

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-[3px]">
      <path d="M2.5 6h7M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  children: ReactNode;
  className?: string;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  children,
  className = "",
  href,
  ...rest
}: CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      className={`group ${variants[variant]} ${className}`}
      style={{ ...base, ...sizes[size] }}
      {...rest}
    >
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  children,
  className = "",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={`group ${variants[variant]} ${className}`}
      style={{ ...base, ...sizes[size] }}
      {...rest}
    >
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
