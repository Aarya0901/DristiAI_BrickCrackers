import { cn } from "@/lib/cn";

interface CapabilityVisualProps {
  id: string;
  className?: string;
}

/** One shared node/line/label vocabulary; each capability gets a distinct small diagram. */
export function CapabilityVisual({ id, className }: CapabilityVisualProps) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] w-full items-center justify-center border border-[var(--line-strong)] bg-[var(--surface-1)] p-8",
        className
      )}
    >
      <svg viewBox="0 0 200 150" className="h-full w-full" role="img" aria-hidden>
        {renderDiagram(id)}
      </svg>
    </div>
  );
}

function renderDiagram(id: string) {
  switch (id) {
    case "drishti":
      return (
        <g>
          {[40, 100, 160].map((x) =>
            [40, 100].map((y) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y} r="26" fill="var(--attention-soft)" opacity={0.6} />
                <rect x={x - 8} y={y - 8} width="16" height="16" fill="var(--ink-primary)" />
              </g>
            ))
          )}
        </g>
      );
    case "tracking":
      return (
        <g stroke="var(--ink-primary)" strokeWidth="1" fill="none">
          {[30, 80, 130, 180].map((x, i) => (
            <rect key={x} x={x - 12} y={50 + (i % 2) * 30} width="24" height="24" />
          ))}
          <text x="18" y="30" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-secondary)">
            C1  C2  C3  C4
          </text>
        </g>
      );
    case "relational-evidence":
      return (
        <g>
          <rect x="30" y="20" width="24" height="24" fill="var(--ink-primary)" />
          <rect x="150" y="100" width="24" height="24" fill="var(--ink-primary)" />
          <line
            x1="54"
            y1="44"
            x2="150"
            y2="100"
            stroke="var(--attention)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle cx="42" cy="32" r="4" fill="var(--attention)" />
          <circle cx="162" cy="112" r="4" fill="var(--attention)" />
        </g>
      );
    case "explainability":
      return (
        <g>
          <rect x="30" y="20" width="140" height="110" fill="var(--surface-1)" stroke="var(--line-strong)" />
          {[36, 52, 68, 84].map((y, i) => (
            <rect
              key={y}
              x="42"
              y={y}
              width={i === 0 ? 70 : 100}
              height="6"
              fill={i === 0 ? "var(--ink-primary)" : "var(--line-subtle)"}
            />
          ))}
          <rect x="42" y="106" width="60" height="14" fill="var(--review-soft)" stroke="var(--review)" />
        </g>
      );
    case "baselines":
      return (
        <g stroke="var(--ink-primary)" fill="none" strokeWidth="1.5">
          <polyline points="20,120 60,90 100,100 140,50 180,60" />
          <line x1="20" y1="75" x2="180" y2="75" stroke="var(--line-subtle)" strokeDasharray="3 3" />
          <text x="140" y="70" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-secondary)">
            P95
          </text>
        </g>
      );
    case "objects":
      return (
        <g>
          <rect x="70" y="30" width="60" height="90" fill="none" stroke="var(--ink-primary)" strokeWidth="1.5" />
          <circle cx="100" cy="75" r="6" fill="var(--review)" />
          <text x="55" y="20" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-secondary)">
            object candidate
          </text>
        </g>
      );
    case "abstention":
      return (
        <g>
          <rect x="60" y="30" width="80" height="80" fill="var(--unobservable-soft)" stroke="var(--unobservable)" />
          <line x1="60" y1="30" x2="140" y2="110" stroke="var(--unobservable)" strokeWidth="1" />
          <line x1="140" y1="30" x2="60" y2="110" stroke="var(--unobservable)" strokeWidth="1" />
          <text x="45" y="128" fontFamily="var(--font-mono)" fontSize="9" fill="var(--unobservable)">
            visibility insufficient
          </text>
        </g>
      );
    default:
      return null;
  }
}
