"use client";

import Link from "next/link";
import { useState } from "react";
import {
  primaryCta,
  primaryNav,
  productDropdown,
  secondaryUtilityLink,
} from "@/content/navigation";
import { MobileNav } from "./MobileNav";
import { VigilMark } from "@/components/brand/VigilMark";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm"
        style={{ height: "71px" }}
      >
        <div
          className="mx-auto flex h-full items-center justify-between"
          style={{ maxWidth: "var(--content-max)", paddingInline: "var(--content-pad)" }}
        >
          <Link href="/" className="flex items-center gap-2.5" aria-label="VIGIL home">
            <VigilMark className="h-6 w-6" />
            <span
              className="font-semibold"
              style={{ fontSize: "17px", letterSpacing: "var(--tracking-snug)" }}
            >
              VIGIL
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {primaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[15px] font-medium tracking-[var(--tracking-snug)] text-[var(--ink-primary)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)] hover:text-[var(--brand-cobalt)]"
              >
                {link.label}
              </Link>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setProductOpen(true)}
              onMouseLeave={() => setProductOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-[15px] font-medium tracking-[var(--tracking-snug)] text-[var(--ink-primary)] hover:text-[var(--brand-cobalt)]"
                aria-expanded={productOpen}
                aria-haspopup="true"
                onClick={() => setProductOpen((v) => !v)}
              >
                Product
                <span aria-hidden className="text-[10px]">▾</span>
              </button>
              {productOpen && (
                <div
                  className="absolute left-1/2 top-full w-72 -translate-x-1/2 border border-[var(--line-strong)] bg-[var(--surface-1)] p-2 shadow-none"
                  role="menu"
                >
                  {productDropdown.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="block rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)] hover:bg-[var(--surface-2)]"
                    >
                      <span className="block text-[15px] font-medium">{item.label}</span>
                      {item.description && (
                        <span className="block text-[13px] text-[var(--ink-secondary)]">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href={secondaryUtilityLink.href}
              className="font-mono text-[13px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            >
              {secondaryUtilityLink.label}
            </Link>
            <Link
              href={primaryCta.href}
              className="rounded-[var(--radius-sm)] bg-[var(--brand-cobalt)] px-4 py-2 text-[15px] font-medium text-[var(--ink-inverse)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)] hover:bg-[var(--brand-cobalt-ink)]"
            >
              {primaryCta.label}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line-strong)] lg:hidden"
            aria-label="Open menu"
          >
            <span className="font-mono text-[13px] uppercase">Menu</span>
          </button>
        </div>
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
