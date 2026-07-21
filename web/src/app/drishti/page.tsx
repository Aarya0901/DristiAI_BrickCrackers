import type { Metadata } from "next";
import { PageHero } from "../../components/layout/PageHero";
import { drishtiSections, drishtiTiers } from "../../content/drishti";
import { Reveal } from "../../components/ui/Reveal";
import { ButtonLink } from "../../components/ui/Button";
import { HeatMock } from "../../components/mock/HowItWorksMocks";

export const metadata: Metadata = {
  title: "Drishti Attention Field",
  description:
    "Room-level attention estimation from ordinary CCTV. Gaze-target heatmaps projected onto the seat map build a live attention field — no identity, no facial recognition.",
};

export default function DrishtiPage() {
  return (
    <>
      <PageHero
        eyebrow="Product · Drishti"
        heading="See where attention accumulates."
        support="Drishti (दृष्टि — gaze) is VIGIL's perception layer. It produces scene-level attention estimates for every visible person, projects them onto the calibrated seat map, and builds a live, room-level attention field — without ever knowing who anyone is."
      />

      {/* sections */}
      <div style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--container-pad)" }}>
        {drishtiSections.map((sec, i) => (
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
                <div>{getDrishtiVisual(i)}</div>
              </div>
            </Reveal>
          </section>
        ))}

        {/* Tiers */}
        <section className="mt-16" id="tiers">
          <h2 className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "var(--text-section)", lineHeight: 1.1, letterSpacing: "var(--tracking-display)" }}>
            Capability tiers
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {drishtiTiers.map((t) => (
              <div key={t.tier} className="card" style={{ padding: "var(--card-pad)" }}>
                <span className="eyebrow">Tier {t.tier} · {t.label}</span>
                <p className="mt-3 text-[length:var(--text-small)] text-[var(--ink-secondary)]">{t.pixelFloor}</p>
                <p className="mt-1 text-[length:var(--text-small)] text-[var(--ink-secondary)]">{t.signal}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex justify-center py-24">
          <ButtonLink href="/demo" size="lg" arrow>Open dashboard preview</ButtonLink>
        </div>
      </div>
    </>
  );
}

function getDrishtiVisual(index: number) {
  switch (index) {
    case 0:
      return (
        <div className="card rounded-[var(--radius-lg)] p-6" role="img" aria-label="Head direction classes: left, centre, right shown as arrows on a seat grid">
          <svg viewBox="0 0 320 180" className="h-auto w-full" aria-hidden="true">
            {[
              { x: 60, y: 80, dir: "L" },
              { x: 160, y: 50, dir: "C" },
              { x: 260, y: 90, dir: "R" },
            ].map((d) => (
              <g key={`${d.x}-${d.y}`}>
                <circle cx={d.x} cy={d.y} r="22" fill="var(--surface-inset)" stroke="var(--line-subtle)" />
                <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">{d.dir}</text>
                {d.dir === "L" ? (
                  <path d={`M${d.x - 8} ${d.y} l-12 -6 l0 12 z`} fill="var(--ink-muted)" />
                ) : d.dir === "R" ? (
                  <path d={`M${d.x + 8} ${d.y} l12 -6 l0 12 z`} fill="var(--ink-muted)" />
                ) : null}
              </g>
            ))}
            <text x="160" y="150" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-muted)">3 buckets — what about eyes down?</text>
          </svg>
        </div>
      );
    case 1:
      return <HeatMock />;
    default:
      return null;
  }
}
