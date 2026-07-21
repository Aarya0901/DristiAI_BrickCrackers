import { hero } from "../../content/home";
import { ButtonLink } from "../ui/Button";
import { CommandChip } from "../mock/CommandChip";
import { HeroStage } from "./HeroStage";
import { Reveal } from "../ui/Reveal";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="container-x" style={{ paddingTop: "calc(var(--nav-h) + 48px)" }}>
      <div className="flex flex-col items-center text-center">
        <Reveal>
          <span className="eyebrow">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--attention)" }} />
            {hero.announcement}
          </span>
        </Reveal>

        <Reveal delay={70}>
          <h1
            id="hero-heading"
            className="font-display font-semibold text-[var(--ink-primary)]"
            style={{
              fontSize: "var(--text-hero)",
              lineHeight: "var(--lh-hero)",
              letterSpacing: "var(--tracking-display)",
              marginTop: 20,
              maxWidth: "17ch",
              textWrap: "balance",
            }}
          >
            {hero.headlineLines[0]}
            <br />
            {hero.headlineLines[1]}
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p
            className="text-[var(--ink-secondary)]"
            style={{ fontSize: "var(--text-body-lg)", lineHeight: 1.6, marginTop: 20, maxWidth: "62ch", textWrap: "pretty" }}
          >
            {hero.subheading}
          </p>
        </Reveal>

        <Reveal delay={210}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={hero.ctaPrimary.href} size="lg" arrow>
              {hero.ctaPrimary.label}
            </ButtonLink>
            <ButtonLink href={hero.ctaSecondary.href} size="lg" variant="secondary" arrow>
              {hero.ctaSecondary.label}
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={280}>
          <div className="mt-8 flex justify-center">
            <CommandChip command={hero.commandStrip} />
          </div>
        </Reveal>

        <Reveal delay={340}>
          <p className="mt-5 text-[length:var(--text-small)] text-[var(--ink-muted)]">{hero.supportingLine}</p>
        </Reveal>
      </div>

      {/* hero visual shell card — cal.com floats its booking widget the same way */}
      <Reveal delay={420} className="mt-14">
        <div className="card overflow-hidden p-3 sm:p-5" style={{ borderRadius: "var(--radius-xl)" }}>
          <HeroStage />
        </div>
      </Reveal>
    </section>
  );
}
