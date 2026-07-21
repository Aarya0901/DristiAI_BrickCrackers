import Link from "next/link";
import { footerColumns, footerConnect } from "../../content/navigation";
import { VigilMark } from "../brand/VigilMark";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--line-subtle)]" aria-label="Site footer">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.2fr_repeat(4,1fr)_0.8fr] lg:gap-8">
        <div>
          <span className="inline-flex items-center gap-2">
            <VigilMark size={26} />
            <span className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">VIGIL</span>
          </span>
          <p className="mt-4 max-w-[26ch] text-[length:var(--text-small)] leading-relaxed text-[var(--ink-muted)]">
            Sees behaviour. Explains evidence. Never accuses.
          </p>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.heading} aria-label={`Footer — ${col.heading}`}>
            <h3 className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">
              {col.heading}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[length:var(--text-small)] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav aria-label="Footer — Connect">
          <h3 className="text-[length:var(--text-small)] font-semibold text-[var(--ink-primary)]">Connect</h3>
          <ul className="mt-4 space-y-2.5">
            {footerConnect.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-[length:var(--text-small)] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* large wordmark treatment */}
      <div className="container-x overflow-hidden" aria-hidden="true">
        <div
          className="font-display select-none text-center font-semibold"
          style={{
            fontSize: "clamp(6rem, 22vw, 20rem)",
            lineHeight: 0.78,
            letterSpacing: "-0.04em",
            color: "var(--ink-primary)",
            opacity: 0.06,
            transform: "translateY(0.18em)",
          }}
        >
          VIGIL
        </div>
      </div>

      <div className="border-t border-[var(--line-subtle)]">
        <div className="container-x flex flex-col gap-3 py-6 text-[length:0.8125rem] text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} VIGIL — Vision-based Invigilation with Graph Intelligence and Explainability</span>
          <span>Built by the VIGIL research team · Privacy: no facial recognition, no identity linkage</span>
        </div>
      </div>
    </footer>
  );
}
