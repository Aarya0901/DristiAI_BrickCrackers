import { capabilityRail } from "../../content/home";

/**
 * Capability rail — cal.com's logo-marquee slot, but VIGIL has no customers,
 * so it runs capability chips instead. Seamless duplicated loop, fade mask,
 * pause on hover, static under reduced motion.
 */
export function CapabilityMarquee() {
  const items = [...capabilityRail, ...capabilityRail];
  return (
    <section aria-label="Capabilities overview" className="container-x" style={{ marginTop: 72 }}>
      <div className="marquee marquee-mask overflow-hidden py-2">
        <ul className="marquee-track flex w-max items-center gap-3" aria-hidden="true">
          {items.map((label, i) => (
            <li
              key={`${label}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--line-subtle)] bg-[var(--surface-card)] px-4 py-2 text-[length:var(--text-small)] text-[var(--ink-secondary)]"
            >
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--attention)" }} />
              {label}
            </li>
          ))}
        </ul>
        <ul className="sr-only">
          {capabilityRail.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
