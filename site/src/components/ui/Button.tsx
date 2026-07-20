import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "inverse";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-medium " +
  "transition-[background-color,color,border-color,transform] duration-[var(--duration-snap)] " +
  "ease-[var(--ease-snap)] px-5 py-2.5 text-[15px] tracking-[var(--tracking-snug)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-cobalt)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-cobalt)] border-[var(--brand-cobalt)] text-[var(--ink-inverse)] hover:bg-[var(--brand-cobalt-ink)] hover:border-[var(--brand-cobalt-ink)]",
  ghost:
    "bg-transparent border-[var(--line-strong)] text-[var(--ink-primary)] hover:bg-[var(--ink-primary)] hover:text-[var(--ink-inverse)]",
  inverse:
    "bg-[var(--ink-inverse)] border-[var(--ink-inverse)] text-[var(--ink-primary)] hover:bg-transparent hover:text-[var(--ink-inverse)]",
};

interface ButtonAsLink extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
}

interface ButtonAsButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

export function Button({ variant = "primary", className, children, icon, ...props }: ButtonProps) {
  const classes = cn(base, variants[variant], className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonAsButton)}>
      {children}
      {icon}
    </button>
  );
}
