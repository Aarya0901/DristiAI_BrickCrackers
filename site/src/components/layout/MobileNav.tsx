"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { mobileNavLinks, primaryCta } from "@/content/navigation";
import { cn } from "@/lib/cn";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-[var(--bg-inverse)] text-[var(--ink-inverse)]",
        "transition-[opacity,transform] duration-[var(--duration-page)] ease-[var(--ease-reveal)]",
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--line-inverse)] px-[var(--content-pad)] py-5">
        <span className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-inverse-secondary)]">
          VIGIL / MENU
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="font-mono text-[var(--text-label)] uppercase tracking-[var(--tracking-wide)] border border-[var(--line-inverse)] rounded-[var(--radius-sm)] px-3 py-1.5 min-h-11 min-w-11"
        >
          Close
        </button>
      </div>
      <nav className="flex flex-1 flex-col justify-center gap-1 px-[var(--content-pad)]">
        {mobileNavLinks.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="group flex items-baseline gap-4 border-b border-[var(--line-inverse)] py-4 min-h-11"
          >
            <span className="font-mono text-[var(--text-label)] text-[var(--ink-inverse-secondary)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="font-medium transition-transform duration-[var(--duration-snap)] ease-[var(--ease-snap)] group-hover:translate-x-2"
              style={{ fontSize: "var(--text-heading-lg)", letterSpacing: "var(--tracking-snug)" }}
            >
              {link.label}
            </span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-[var(--line-inverse)] px-[var(--content-pad)] py-6">
        <Link
          href={primaryCta.href}
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-cobalt)] px-5 py-3 font-medium text-[var(--ink-inverse)]"
        >
          {primaryCta.label}
        </Link>
      </div>
    </div>
  );
}
