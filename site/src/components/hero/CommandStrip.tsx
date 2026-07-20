"use client";

import { useEffect, useState } from "react";

interface CommandStripProps {
  command: string;
}

export function CommandStrip({ command }: CommandStripProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from a browser API unavailable during SSR
      setTyped(command);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTyped(command.slice(0, i));
      if (i >= command.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [command]);

  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--bg-inverse)] px-4 py-2.5 font-mono text-[13px] text-[var(--ink-inverse)]">
      <span aria-hidden className="text-[var(--attention)]">
        ›
      </span>
      <span>{typed}</span>
      <span className="animate-pulse text-[var(--attention)]" aria-hidden>
        _
      </span>
    </div>
  );
}
