import { hero, trustRail } from "@/content/home";
import { AnnouncementPill } from "@/components/ui/AnnouncementPill";
import { Button } from "@/components/ui/Button";
import { SeatFieldCanvas } from "./SeatFieldCanvas";
import { TrustRail } from "./TrustRail";
import { CommandStrip } from "./CommandStrip";

export function Hero() {
  return (
    <section className="relative w-full border-b border-[var(--line-subtle)]">
      <div
        className="mx-auto grid gap-[var(--space-9)] pb-[var(--space-9)] pt-[var(--space-9)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
        style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
      >
        <div className="flex flex-col gap-[var(--space-6)]">
          <AnnouncementPill>{hero.announcement}</AnnouncementPill>

          <h1
            className="max-w-[640px] font-medium"
            style={{
              fontSize: "var(--text-hero)",
              lineHeight: "var(--lh-tight)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {hero.headlineLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p
            className="max-w-[540px] text-[var(--ink-secondary)]"
            style={{ fontSize: "var(--text-body-lg)", lineHeight: "var(--lh-loose)" }}
          >
            {hero.subheading}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button href={hero.ctaPrimary.href} variant="primary">
              {hero.ctaPrimary.label}
            </Button>
            <Button href={hero.ctaSecondary.href} variant="ghost">
              {hero.ctaSecondary.label}
            </Button>
          </div>

          <CommandStrip command={hero.commandStrip} />

          <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
            {hero.supportingLine}
          </p>
        </div>

        <div className="w-full">
          <SeatFieldCanvas />
        </div>
      </div>

      <TrustRail items={trustRail} />
    </section>
  );
}
