import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { seatGraphSections } from "../../content/seat-graph";
import { Reveal } from "../../components/ui/Reveal";
import { ButtonLink } from "../../components/ui/Button";
import { PairMock } from "../../components/mock/HowItWorksMocks";
import { EvidenceCard } from "../../components/mock/EvidenceCard";

export const metadata: Metadata = {
  title: "Seat Graph",
  description: "Relational evidence between anonymous seats. Reciprocal glances, coordinated rotation, and temporal responses become explainable edges — the basis for pairwise review requests.",
};

export default function SeatGraphPage() {
  const visuals: Record<string, React.ReactNode> = {
    "anomaly-insufficient": (
      <div className="card p-6" role="img" aria-label="Single seat anomaly: one glance could be a stiff neck.">
        <svg viewBox="0 0 280 160" className="h-auto w-full" aria-hidden="true">
          <circle cx="140" cy="70" r="24" fill="var(--review-soft)" stroke="var(--review)" />
          <text x="140" y="75" textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink-primary)">B4</text>
          <path d="M164 60 l24 -8 l0 16 z" fill="var(--review)" opacity="0.6" />
          <text x="140" y="50" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-muted)">? — stiff neck, pen drop, or something else?</text>
        </svg>
      </div>
    ),
    "seats-as-nodes": (
      <PairMock />
    ),
    "directed-reciprocal": (
      <PairMock />
    ),
    "temporal-fusion": (
      <div className="card p-6" role="img" aria-label="Evidence fusion: duration, repetition, baseline, geometry combined.">
        <svg viewBox="0 0 280 120" className="h-auto w-full" aria-hidden="true">
          {["duration", "repetition", "baseline", "geometry"].map((label, i) => (
            <rect key={label} x={14 + i * 66} y={40} width="56" height="56" rx="6" fill="var(--attention-soft)" stroke="var(--attention)" />
          ))}
          {["duration", "repetition", "baseline", "geometry"].map((label, i) => (
            <text key={label} x={42 + i * 66} y={72} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">{label}</text>
          ))}
          <text x="140" y="110" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--attention)">→ fused severity</text>
        </svg>
      </div>
    ),
    "counterfactual-card": (
      <EvidenceCard interactive={false} />
    ),
    "handoff-patterns": (
      <div className="card p-6" role="img" aria-label="Pair pattern: hand-to-neighbour transfer between seat B2 and B3">
        <svg viewBox="0 0 280 120" className="h-auto w-full" aria-hidden="true">
          <circle cx="70" cy="60" r="18" fill="var(--review-soft)" stroke="var(--review)" />
          <circle cx="210" cy="60" r="18" fill="var(--review-soft)" stroke="var(--review)" />
          <text x="70" y="65" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-primary)">B2</text>
          <text x="210" y="65" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-primary)">B3</text>
          <path d="M86 56 Q 140 40 194 56" fill="none" stroke="var(--attention)" strokeWidth="2" />
          <circle cx="118" cy="48" r="4" fill="var(--review)" opacity="0.7" />
          <circle cx="162" cy="48" r="4" fill="var(--review)" opacity="0.7" />
          <text x="140" y="35" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--review)">object transfer candidate</text>
        </svg>
      </div>
    ),
  };

  return (
    <>
      <PageHero
        eyebrow="Product · Seat Graph"
        heading="Behaviour becomes evidence when the room is understood relationally."
        support="The seat graph treats anonymous seats as nodes and behavioural interactions as edges — so the system can reason about what happened between two seats, not just what happened at one."
      />
      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        {seatGraphSections.map((sec, i) => (
          <section
            key={sec.id}
            id={sec.id}
            style={{ marginTop: i === 0 ? 0 : "clamp(72px, 10vw, 120px)", scrollMarginTop: "calc(var(--nav-h) + 24px)" }}
          >
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <span className="eyebrow">{sec.eyebrow}</span>
                  <h2 className="font-display mt-3 font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
                    {sec.heading}
                  </h2>
                  <p className="mt-3 text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)", lineHeight: 1.6 }}>
                    {sec.support}
                  </p>
                </div>
                <div>{visuals[sec.id] || null}</div>
              </div>
            </Reveal>
          </section>
        ))}
        <div className="flex justify-center py-24">
          <ButtonLink href="/demo" size="lg" arrow>Explore the live simulation</ButtonLink>
        </div>
      </div>
    </>
  );
}
