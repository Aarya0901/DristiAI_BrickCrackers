import Link from "next/link";
import { footerColumns, footerConnect } from "@/content/navigation";
import { VigilMark } from "@/components/brand/VigilMark";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--line-inverse)] bg-[var(--bg-inverse)] text-[var(--ink-inverse)]">
      <div
        className="mx-auto flex flex-col gap-[var(--space-9)] pb-[var(--space-9)] pt-[var(--space-9)]"
        style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
      >
        <div className="flex flex-col gap-[var(--space-6)] lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[420px]">
            <h2
              className="font-medium"
              style={{ fontSize: "var(--text-heading-lg)", lineHeight: "var(--lh-tight)", letterSpacing: "var(--tracking-tight)" }}
            >
              Attention intelligence
              <br />
              for physical exam halls.
            </h2>
            <p className="mt-4 text-[var(--ink-inverse-secondary)]" style={{ fontSize: "var(--text-body)" }}>
              Made for evidence, uncertainty, and human judgement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-7)] sm:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <p className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)]">
                  {col.heading}
                </p>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[15px] text-[var(--ink-inverse-secondary)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)] hover:text-[var(--ink-inverse)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--line-inverse)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <VigilMark className="h-5 w-5" variant="mono" />
            <span className="font-mono text-[13px] text-[var(--ink-inverse-secondary)]">
              © {year} VIGIL — an examination-integrity research project. Not a certified compliance product.
            </span>
          </div>
          <div className="flex items-center gap-5">
            {footerConnect.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)] hover:text-[var(--ink-inverse)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/privacy"
              className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)] hover:text-[var(--ink-inverse)]"
            >
              Privacy statement
            </Link>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden whitespace-nowrap text-center font-semibold text-[var(--surface-inverse-2)]"
        style={{
          fontSize: "clamp(4rem, 16vw, 13rem)",
          lineHeight: 1,
          letterSpacing: "var(--tracking-tight)",
          marginBottom: "clamp(-2.5rem, -6vw, -4.5rem)",
        }}
      >
        VIGIL
      </div>
    </footer>
  );
}
