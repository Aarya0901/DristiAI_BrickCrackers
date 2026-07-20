import Link from "next/link";

interface GatewayCardProps {
  title: string;
  description: string;
  features: string[];
  stats: { label: string; value: string }[];
  cta: { label: string; href: string };
}

export function GatewayCard({ title, description, features, stats, cta }: GatewayCardProps) {
  return (
    <div className="flex flex-col justify-between border border-[var(--line-strong)] bg-[var(--surface-1)] p-7">
      <div>
        <h3 className="font-medium" style={{ fontSize: "var(--text-heading-lg)", letterSpacing: "var(--tracking-snug)" }}>
          {title}
        </h3>
        <p className="mt-3 text-[var(--ink-secondary)]" style={{ fontSize: "var(--text-body)" }}>
          {description}
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[14px] text-[var(--ink-primary)]">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-secondary)]" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 border-t border-[var(--line-subtle)] pt-5">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
              {s.label}
            </p>
            <p className="font-mono text-[15px] text-[var(--ink-primary)]">{s.value}</p>
          </div>
        ))}
      </div>

      <Link
        href={cta.href}
        className="mt-6 inline-flex items-center gap-2 self-start border-b border-[var(--brand-cobalt)] font-medium text-[var(--brand-cobalt)] transition-transform duration-[var(--duration-snap)] ease-[var(--ease-snap)] hover:translate-x-1"
      >
        {cta.label} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
