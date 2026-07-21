"use client";

import { useState } from "react";

/** CommandChip — cal.com's short-link chip equivalent. */
export function CommandChip({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--line-subtle)] bg-[var(--surface-card)] py-2 pl-4 pr-2 shadow-[var(--shadow-card)]">
      <code className="mono overflow-x-auto whitespace-nowrap text-[length:var(--text-mono-sm)] text-[var(--ink-primary)] [scrollbar-width:none]">
        {command}
      </code>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard unavailable — no-op */
          }
        }}
        aria-label={copied ? "Copied" : "Copy command"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line-subtle)] bg-[var(--surface-card)] text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="m2.5 6.5 2.5 2.5 4.5-5.5" stroke="var(--healthy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 4V2.8A1.3 1.3 0 0 0 6.7 1.5H2.8A1.3 1.3 0 0 0 1.5 2.8v3.9A1.3 1.3 0 0 0 2.8 8H4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>
    </div>
  );
}
