import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionFrameProps {
  id?: string;
  eyebrow: string;
  heading: ReactNode;
  support?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** When true, removes the top hairline (use for the first section after hero). */
  noTopBorder?: boolean;
  tone?: "canvas" | "inverse";
  headingId?: string;
}

/**
 * Every numbered marketing section ("〉SECTION NAME [n/9]") shares this
 * frame: eyebrow, heading, optional support copy, top/bottom hairlines,
 * and the shared --section-pad-y rhythm. Pages never hand-roll padding.
 */
export function SectionFrame({
  id,
  eyebrow,
  heading,
  support,
  children,
  className,
  noTopBorder = false,
  tone = "canvas",
  headingId,
}: SectionFrameProps) {
  const isInverse = tone === "inverse";
  return (
    <section
      id={id}
      className={cn(
        "relative w-full",
        !noTopBorder && "border-t",
        isInverse
          ? "bg-[var(--bg-inverse)] text-[var(--ink-inverse)] border-[var(--line-inverse)]"
          : "border-[var(--line-subtle)]",
        className
      )}
      style={{ paddingBlock: "var(--section-pad-y)" }}
    >
      <div
        className="mx-auto flex flex-col gap-[var(--space-6)]"
        style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
      >
        <div className="flex flex-col gap-[var(--space-4)]">
          <p
            className={cn(
              "font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)]",
              isInverse ? "text-[var(--ink-inverse-secondary)]" : "text-[var(--ink-secondary)]"
            )}
          >
            {eyebrow}
          </p>
          <h2
            id={headingId}
            className="max-w-[820px] font-medium"
            style={{
              fontSize: "var(--text-section)",
              lineHeight: "var(--lh-tight)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {heading}
          </h2>
          {support && (
            <p
              className={cn(
                "max-w-[560px]",
                isInverse ? "text-[var(--ink-inverse-secondary)]" : "text-[var(--ink-secondary)]"
              )}
              style={{ fontSize: "var(--text-body-lg)", lineHeight: "var(--lh-loose)" }}
            >
              {support}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
