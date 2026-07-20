"use client";

import { useEffect, useRef, useState } from "react";
import { pipelineFlow } from "@/content/home";

export function PipelineDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <div className="relative flex min-w-max items-center gap-0 border border-[var(--line-strong)] bg-[var(--surface-1)] px-6 py-8">
        {pipelineFlow.map((stage, index) => (
          <div key={stage} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-28 items-center justify-center border border-[var(--line-strong)] bg-[var(--surface-1)] px-2 text-center">
                <span className="font-mono text-[12px] leading-tight text-[var(--ink-primary)]">{stage}</span>
              </div>
            </div>
            {index < pipelineFlow.length - 1 && (
              <svg width="36" height="14" viewBox="0 0 36 14" aria-hidden className="mx-1 shrink-0">
                <line x1="0" y1="7" x2="28" y2="7" stroke="var(--line-strong)" strokeWidth="1" />
                <path d="M24 3 L30 7 L24 11" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
              </svg>
            )}
          </div>
        ))}
        <div
          aria-hidden
          className="pipeline-packet absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--attention)]"
          style={{ animationPlayState: running ? "running" : "paused" }}
        />
      </div>
      <style>{`
        .pipeline-packet {
          left: 28px;
          animation: pipeline-travel 6s linear infinite;
        }
        @keyframes pipeline-travel {
          0% { left: 28px; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: calc(100% - 28px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pipeline-packet { display: none; }
        }
      `}</style>
    </div>
  );
}
