import { finalCta } from "../../content/home";
import { ButtonLink } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta" className="container-x" style={{ marginTop: "var(--section-gap)", marginBottom: "var(--section-gap)" }}>
      <Reveal>
        <div
          className="card flex flex-col items-center px-6 py-20 text-center sm:py-28"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <h2
            id="final-cta"
            className="font-display font-semibold text-[var(--ink-primary)]"
            style={{
              fontSize: "var(--text-section)",
              lineHeight: 1.1,
              letterSpacing: "var(--tracking-display)",
              maxWidth: "20ch",
              textWrap: "balance",
            }}
          >
            {finalCta.headline}
          </h2>
          <p className="mt-4 text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body-lg)" }}>
            {finalCta.subline}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={finalCta.ctaPrimary.href} size="lg" arrow>
              {finalCta.ctaPrimary.label}
            </ButtonLink>
            <ButtonLink href={finalCta.ctaSecondary.href} size="lg" variant="secondary" arrow>
              {finalCta.ctaSecondary.label}
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
