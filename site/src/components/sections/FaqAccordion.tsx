"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { faqCategories, faqItems } from "@/content/faq";
import { cn } from "@/lib/cn";

function FaqPanel({ id, isOpen, answer }: { id: string; isOpen: boolean; answer: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (isOpen && ref.current) {
      setMaxHeight(ref.current.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [isOpen, answer]);

  return (
    <div
      id={`${id}-panel`}
      role="region"
      style={{
        maxHeight,
        overflow: "hidden",
        transition: "max-height var(--duration-reveal) var(--ease-reveal)",
      }}
    >
      <p
        ref={ref}
        className="max-w-[680px] pb-5 text-[var(--ink-secondary)]"
        style={{ fontSize: "var(--text-body)" }}
      >
        {answer}
      </p>
    </div>
  );
}

export function FaqAccordion() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && faqItems.some((f) => f.id === hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL hash on mount
      setOpenId(hash);
      const el = document.getElementById(hash);
      el?.scrollIntoView({ block: "center" });
    }
  }, []);

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? faqItems
        : faqItems.filter((item) => item.categories.includes(activeCategory)),
    [activeCategory]
  );

  function toggle(id: string) {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) {
      window.history.replaceState(null, "", `#${next}`);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--line-subtle)] pb-5" role="tablist" aria-label="FAQ categories">
        {faqCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "rounded-[var(--radius-sm)] border px-3.5 py-2 font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] transition-colors duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
              activeCategory === cat.id
                ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-[var(--ink-inverse)]"
                : "border-[var(--line-subtle)] text-[var(--ink-secondary)] hover:border-[var(--ink-primary)] hover:text-[var(--ink-primary)]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <ul className="mt-2">
        {filtered.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id} id={item.id} className="border-b border-[var(--line-subtle)]">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`${item.id}-panel`}
                className="flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-medium" style={{ fontSize: "var(--text-body-lg)" }}>
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "shrink-0 font-mono text-[var(--ink-secondary)] transition-transform duration-[var(--duration-snap)] ease-[var(--ease-snap)]",
                    isOpen && "rotate-45"
                  )}
                >
                  +
                </span>
              </button>
              <FaqPanel id={item.id} isOpen={isOpen} answer={item.answer} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
