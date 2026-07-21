"use client";

import { useEffect, useState } from "react";
import { faqCategories, faqItems } from "../../content/faq";
import { SectionHeader } from "../ui/SectionHeader";

/**
 * FAQ — category filters, accordion, URL-hash deep-linking, ARIA-correct,
 * keyboard navigable.
 */
export function Faq() {
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // deep-link: #faq-<id> opens the item
  useEffect(() => {
    const hash = window.location.hash.replace("#faq-", "");
    if (hash && faqItems.some((f) => f.id === hash)) {
      setOpenId(hash);
      document.getElementById(`faq-${hash}`)?.scrollIntoView({ block: "center" });
    }
  }, []);

  const visible = category === "all" ? faqItems : faqItems.filter((f) => f.categories.includes(category));

  return (
    <section aria-labelledby="faq" className="container-x" style={{ marginTop: "var(--section-gap)" }}>
      <SectionHeader
        id="faq"
        eyebrow="FAQ"
        heading="The difficult questions, in plain English."
        support="No evasive answers. If the system cannot do something, that is the answer."
      />

      {/* filters */}
      <div className="mt-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter questions by category">
        {faqCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className="rounded-[var(--radius-pill)] border px-4 py-1.5 text-[length:var(--text-small)] font-medium transition-colors"
            style={{
              borderColor: category === c.id ? "var(--ink-primary)" : "var(--line-subtle)",
              background: category === c.id ? "var(--ink-primary)" : "var(--surface-card)",
              color: category === c.id ? "var(--ink-inverse)" : "var(--ink-secondary)",
              transitionDuration: "var(--dur-micro)",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-[880px]">
        <ul className="divide-y divide-[var(--line-subtle)] border-y border-[var(--line-subtle)]">
          {visible.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} id={`faq-${item.id}`} style={{ scrollMarginTop: "calc(var(--nav-h) + 24px)" }}>
                <h3>
                  <button
                    aria-expanded={open}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-display font-semibold text-[var(--ink-primary)]" style={{ fontSize: "1.0625rem", letterSpacing: "-0.01em" }}>
                      {item.question}
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                      className="shrink-0 text-[var(--ink-secondary)]"
                      style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform var(--dur-accordion) var(--ease-out)" }}
                    >
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${item.id}`}
                  role="region"
                  aria-label={item.question}
                  className="grid transition-[grid-template-rows]"
                  style={{
                    gridTemplateRows: open ? "1fr" : "0fr",
                    transitionDuration: "var(--dur-accordion)",
                    transitionTimingFunction: "var(--ease-out)",
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[70ch] pb-6 text-[length:var(--text-body)] leading-relaxed text-[var(--ink-secondary)]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
