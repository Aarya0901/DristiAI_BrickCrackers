import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { privacyPrinciples, dpdpDisclaimer, dpdpAlignment } from "../../content/privacy";
import { Reveal } from "../../components/ui/Reveal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "No identity is required to understand behaviour. VIGIL uses no facial recognition, keeps no identity linkage, and defaults to skeleton-first replay.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Principles"
        heading="No identity is required to understand behaviour."
        support="VIGIL's privacy posture isn't an afterthought — it starts at the pixel and carries through every design decision."
      />

      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        {/* principles */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {privacyPrinciples.map((p, i) => (
            <Reveal key={p.id} delay={i * 40}>
              <article className="card h-full" style={{ padding: "var(--card-pad)" }}>
                <span className="mono inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-inset)] text-[length:0.75rem] text-[var(--ink-secondary)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-4 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-card-title)", letterSpacing: "var(--tracking-card)" }}>
                  {p.title}
                </h3>
                <p className="mt-2 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* DPDP alignment */}
        <section className="mt-24" id="dpdp">
          <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
            Designed for DPDP-aligned deployment
          </h2>
          <ul className="mt-8 space-y-4">
            {dpdpAlignment.map((item) => (
              <li key={item} className="flex gap-3 text-[length:var(--text-small)] leading-relaxed text-[var(--ink-secondary)]">
                <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--attention)]" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-inset)] p-5">
            <p className="text-[length:var(--text-small)] leading-relaxed text-[var(--ink-muted)]">{dpdpDisclaimer}</p>
          </div>
        </section>
      </div>
      <div style={{ height: "var(--section-gap)" }} />
    </>
  );
}
