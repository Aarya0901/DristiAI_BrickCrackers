/**
 * Shared page hero — cal.com-style inner-page masthead.
 * Eyebrow pill → H1 → support → optional CTA.
 */
export function PageHero({
  eyebrow,
  heading,
  support,
  children,
}: {
  eyebrow: string;
  heading: string;
  support?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="container-x flex flex-col items-center pt-36 pb-16 text-center"
      aria-labelledby="page-heading"
    >
      <span className="eyebrow">{eyebrow}</span>
      <h1
        id="page-heading"
        className="font-display mt-4 font-semibold text-[var(--ink-primary)]"
        style={{
          fontSize: "var(--text-hero)",
          lineHeight: "var(--lh-hero)",
          letterSpacing: "var(--tracking-display)",
          maxWidth: "16ch",
          textWrap: "balance",
        }}
      >
        {heading}
      </h1>
      {support && (
        <p
          className="mt-4 text-[var(--ink-secondary)]"
          style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.6, maxWidth: "58ch", textWrap: "pretty" }}
        >
          {support}
        </p>
      )}
      {children}
    </section>
  );
}
