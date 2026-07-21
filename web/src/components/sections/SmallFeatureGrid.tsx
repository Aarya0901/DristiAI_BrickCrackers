import type { ReactNode } from "react";
import { smallFeatures } from "../../content/home";
import { SectionHeader } from "../ui/SectionHeader";
import { Reveal } from "../ui/Reveal";

const icons: Record<string, ReactNode> = {
  shield: (
    <path d="M12 2.5 4.5 5v5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V5L12 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.5a3.2 3.2 0 1 1 1.8 5.9M17 14.3c2 .5 3.3 2 3.7 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  list: (
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  ),
  trash: (
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  offline: (
    <>
      <path d="M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
};

export function SmallFeatureGrid() {
  return (
    <section aria-labelledby="and-more" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader id="and-more" eyebrow="Principles" heading="…and so much more" />

      <div className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {smallFeatures.map((f, i) => (
          <Reveal key={f.id} delay={i * 40}>
            <div className="card flex h-full flex-col items-center gap-4 p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--line-subtle)] bg-[var(--surface-inset)] text-[var(--ink-secondary)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {icons[f.icon]}
                </svg>
              </span>
              <span className="text-[length:var(--text-small)] font-medium leading-snug text-[var(--ink-primary)]">
                {f.title}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
