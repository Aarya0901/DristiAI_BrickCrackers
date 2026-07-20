import type { ReactNode } from "react";

interface PageHeroProps {
  breadcrumb: string;
  heading: ReactNode;
  support?: ReactNode;
  visual?: ReactNode;
}

export function PageHero({ breadcrumb, heading, support, visual }: PageHeroProps) {
  return (
    <section className="border-b border-[var(--line-subtle)]">
      <div
        className="mx-auto grid gap-10 py-[var(--space-9)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
      >
        <div>
          <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            {breadcrumb}
          </p>
          <h1
            className="mt-4 max-w-[640px] font-medium"
            style={{ fontSize: "var(--text-hero)", lineHeight: "var(--lh-tight)", letterSpacing: "var(--tracking-tight)" }}
          >
            {heading}
          </h1>
          {support && (
            <p
              className="mt-5 max-w-[540px] text-[var(--ink-secondary)]"
              style={{ fontSize: "var(--text-body-lg)", lineHeight: "var(--lh-loose)" }}
            >
              {support}
            </p>
          )}
        </div>
        {visual && <div className="w-full">{visual}</div>}
      </div>
    </section>
  );
}
