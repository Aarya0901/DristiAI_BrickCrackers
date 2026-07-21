import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * cal.com section rhythm: eyebrow pill → H2 → one-line support → optional CTA row.
 */
export function SectionHeader({
  eyebrow,
  eyebrowIcon,
  heading,
  support,
  cta,
  align = "center",
  id,
}: {
  eyebrow: string;
  eyebrowIcon?: ReactNode;
  heading: string;
  support?: string;
  cta?: ReactNode;
  align?: "center" | "left";
  id?: string;
}) {
  const centered = align === "center";
  return (
    <div
      id={id}
      className={`flex flex-col ${centered ? "items-center text-center" : "items-start text-left"}`}
      style={{ gap: 16, scrollMarginTop: "calc(var(--nav-h) + 24px)" }}
    >
      <Reveal>
        <span className="eyebrow">
          {eyebrowIcon}
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={60}>
        <h2
          className="font-display font-semibold text-[var(--ink-primary)]"
          style={{
            fontSize: "var(--text-section)",
            lineHeight: 1.1,
            letterSpacing: "var(--tracking-display)",
            maxWidth: "22ch",
            textWrap: "balance",
          }}
        >
          {heading}
        </h2>
      </Reveal>
      {support && (
        <Reveal delay={120}>
          <p
            className="text-[var(--ink-secondary)]"
            style={{
              fontSize: "var(--text-body-lg)",
              lineHeight: 1.6,
              maxWidth: "58ch",
              textWrap: "pretty",
            }}
          >
            {support}
          </p>
        </Reveal>
      )}
      {cta && <Reveal delay={180}>{cta}</Reveal>}
    </div>
  );
}
