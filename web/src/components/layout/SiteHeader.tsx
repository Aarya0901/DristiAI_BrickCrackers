"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNav, productDropdown, primaryCta, secondaryUtilityLink } from "../../content/navigation";
import { VigilWordmark } from "../brand/VigilMark";
import { ButtonLink } from "../ui/Button";
import { MobileDrawer } from "./MobileDrawer";

export function SiteHeader() {
  const [dropOpen, setDropOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDropOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-colors"
        style={{
          height: "var(--nav-h)",
          background: scrolled ? "rgb(244 244 244 / 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--line-subtle)" : "1px solid transparent",
        }}
      >
        <div className="container-x flex h-full items-center justify-between">
          <Link href="/" aria-label="VIGIL home" className="shrink-0">
            <VigilWordmark />
          </Link>

          {/* centre nav */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            <div
              ref={dropRef}
              className="relative"
              onMouseEnter={() => setDropOpen(true)}
              onMouseLeave={() => setDropOpen(false)}
            >
              <button
                aria-expanded={dropOpen}
                aria-haspopup="true"
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-1 rounded-[var(--radius-sm)] px-3 py-2 text-[length:var(--text-small)] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
                style={{ fontWeight: 500 }}
              >
                {productDropdown.label}
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
                  className="transition-transform"
                  style={{ transform: dropOpen ? "rotate(180deg)" : "none", transitionDuration: "var(--dur-micro)" }}
                >
                  <path d="m2 3.5 3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* mega dropdown panel */}
              <div
                role="menu"
                aria-label="Product"
                className="absolute left-1/2 top-full pt-2 transition-all"
                style={{
                  transform: `translateX(-50%) translateY(${dropOpen ? 0 : 6}px)`,
                  opacity: dropOpen ? 1 : 0,
                  pointerEvents: dropOpen ? "auto" : "none",
                  transitionDuration: "var(--dur-micro)",
                  transitionTimingFunction: "var(--ease-out)",
                }}
              >
                <div
                  className="card grid w-[520px] grid-cols-2 gap-1 p-2"
                  style={{ boxShadow: "var(--shadow-pop)" }}
                >
                  {productDropdown.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="rounded-[var(--radius-sm)] p-3 transition-colors hover:bg-[var(--surface-inset)]"
                    >
                      <span className="block text-[length:var(--text-small)] font-medium text-[var(--ink-primary)]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[length:0.8125rem] leading-snug text-[var(--ink-muted)]">
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {primaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-[var(--radius-sm)] px-3 py-2 text-[length:var(--text-small)] transition-colors hover:text-[var(--ink-primary)] ${
                  pathname === link.href ? "text-[var(--ink-primary)]" : "text-[var(--ink-secondary)]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* right side */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={secondaryUtilityLink.href}
              className="rounded-[var(--radius-sm)] px-3 py-2 text-[length:var(--text-small)] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
            >
              {secondaryUtilityLink.label}
            </Link>
            <ButtonLink href={primaryCta.href} arrow>
              {primaryCta.label}
            </ButtonLink>
          </div>

          {/* mobile toggle */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--surface-card)] lg:hidden"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              {drawerOpen ? (
                <path d="m4 4 8 8M12 4l-8 8" stroke="var(--ink-primary)" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2 5h12M2 11h12" stroke="var(--ink-primary)" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
