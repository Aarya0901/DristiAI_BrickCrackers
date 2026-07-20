import { counterStrip, finalCta } from "@/content/home";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="border-t border-[var(--line-subtle)] bg-[var(--bg-inverse)] text-[var(--ink-inverse)]">
      <div
        className="mx-auto flex flex-col gap-[var(--space-8)] py-[var(--section-pad-y)]"
        style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
      >
        <div className="max-w-[760px]">
          <h2
            className="font-medium"
            style={{ fontSize: "var(--text-section)", lineHeight: "var(--lh-tight)", letterSpacing: "var(--tracking-tight)" }}
          >
            {finalCta.headline}
          </h2>
          <p className="mt-4 text-[var(--ink-inverse-secondary)]" style={{ fontSize: "var(--text-body-lg)" }}>
            {finalCta.subline}
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Button href={finalCta.ctaPrimary.href} variant="inverse">
              {finalCta.ctaPrimary.label}
            </Button>
            <Button
              href={finalCta.ctaSecondary.href}
              variant="ghost"
              className="border-[var(--line-inverse)] text-[var(--ink-inverse)] hover:bg-[var(--ink-inverse)] hover:text-[var(--ink-primary)]"
            >
              {finalCta.ctaSecondary.label}
            </Button>
          </div>
        </div>

        <div className="grid gap-0 border border-[var(--line-inverse)] sm:grid-cols-3">
          {counterStrip.map((counter, index) => (
            <div
              key={counter.id}
              className={
                "flex flex-col gap-2 p-6" +
                (index < counterStrip.length - 1 ? " border-b sm:border-b-0 sm:border-r" : "") +
                " border-[var(--line-inverse)]"
              }
            >
              <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)]">
                {counter.label}
              </p>
              <p className="font-mono text-[var(--ink-inverse-secondary)]" style={{ fontSize: "var(--text-heading-md)" }}>
                Benchmark counter activates after validation.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
