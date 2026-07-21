"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { mobileNavLinks, primaryCta } from "../../content/navigation";
import { VigilWordmark } from "../brand/VigilMark";
import { ButtonLink } from "../ui/Button";

/**
 * Full-screen mobile drawer: large type, animated open/close, focus trap,
 * body-scroll lock, Escape to close. Not a default hamburger panel.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [];
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = Array.from(focusables());
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg-canvas)] lg:hidden"
      style={{
        transform: open ? "translateY(0)" : "translateY(-100%)",
        visibility: open ? "visible" : "hidden",
        transition: `transform 420ms var(--ease-out), visibility 0s linear ${open ? "0s" : "420ms"}`,
      }}
    >
      <div
        className="container-x flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
      >
        <VigilWordmark />
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line-subtle)] bg-[var(--surface-card)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" stroke="var(--ink-primary)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav aria-label="Mobile" className="container-x flex flex-1 flex-col justify-center gap-1">
        {mobileNavLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-display border-b border-[var(--line-subtle)] py-4 text-[var(--ink-primary)]"
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              opacity: open ? 1 : 0,
              transform: open ? "none" : "translateY(12px)",
              transition: `opacity 420ms var(--ease-out) ${80 + i * 40}ms, transform 420ms var(--ease-out) ${80 + i * 40}ms`,
            }}
          >
            {link.label}
          </Link>
        ))}
        <div
          className="pt-8"
          style={{
            opacity: open ? 1 : 0,
            transition: `opacity 420ms var(--ease-out) ${80 + mobileNavLinks.length * 40}ms`,
          }}
        >
          <ButtonLink href={primaryCta.href} size="lg" arrow className="w-full">
            {primaryCta.label}
          </ButtonLink>
        </div>
      </nav>
    </div>
  );
}
