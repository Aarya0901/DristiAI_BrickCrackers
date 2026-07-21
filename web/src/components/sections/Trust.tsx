import { trustPanels } from "../../content/home";
import { SectionHeader } from "../ui/SectionHeader";
import { Reveal } from "../ui/Reveal";
import { EvidenceCard } from "../mock/EvidenceCard";

/**
 * Trust principles — replaces the reference's testimonial wall.
 * VIGIL is pre-pilot: no testimonials, no customer logos. Honesty is the section.
 */
export function Trust() {
  return (
    <section aria-labelledby="trust-principles" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="trust-principles"
        eyebrow="Trust principles"
        heading="The uncomfortable parts are part of the product."
        support="VIGIL is pre-pilot. There are no customer quotes to show you — so instead, here are the rules the system holds itself to."
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {trustPanels.map((panel, i) => (
          <Reveal key={panel.id} delay={i * 60}>
            <article className="card h-full" style={{ padding: "var(--card-pad)" }}>
              <span className="mono inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-inset)] text-[length:0.75rem] text-[var(--ink-secondary)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-4 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                {panel.title}
              </h3>
              <p className="mt-2 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                {panel.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      {/* evidence card showcase — the site's best interactive component */}
      <Reveal delay={120}>
        <div className="mt-6">
          <EvidenceCard />
        </div>
      </Reveal>
    </section>
  );
}
