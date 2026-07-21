import type { ReactNode } from "react";
import { AnchorMock, HeatMock, PairMock } from "../mock/HowItWorksMocks";
import { EvidenceCard } from "../mock/EvidenceCard";

/** Small live visual per capability, used in the catalog right panel. */
export function CapabilityVisual({ id }: { id: string }) {
  switch (id) {
    case "drishti":
      return <HeatMock />;
    case "tracking":
      return <AnchorMock />;
    case "relational-evidence":
      return <PairMock />;
    case "explainability":
      return <EvidenceCard interactive={false} />;
    case "baselines":
      return <BaselineMock />;
    case "objects":
      return <WristMock />;
    case "abstention":
      return <AbstainMock />;
    default:
      return null;
  }
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="card p-4" role="img" aria-label={label}>
      {children}
    </div>
  );
}

function BaselineMock() {
  return (
    <Frame label="Personal baseline: a seat's own behaviour distribution with the review threshold set relative to it">
      <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
        {/* baseline band */}
        <rect x="24" y="46" width="272" height="42" rx="6" fill="var(--healthy-soft)" />
        <text x="30" y="40" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-muted)">seat C7 baseline (90 s rolling)</text>
        {/* signal line */}
        <path
          d="M24 92 C 60 84, 80 70, 110 74 S 160 60, 185 66 S 225 34, 250 30 S 285 26, 296 24"
          fill="none"
          stroke="var(--attention)"
          strokeWidth="2"
        />
        {/* threshold */}
        <line x1="24" y1="28" x2="296" y2="28" stroke="var(--review)" strokeWidth="1.4" strokeDasharray="5 4" />
        <text x="232" y="20" fontSize="10" fontFamily="var(--font-mono)" fill="var(--review)">review gate · own baseline +2σ</text>
        <circle cx="252" cy="29" r="4" fill="var(--review)" />
      </svg>
      <div className="mono mt-2 flex justify-between text-[length:0.6875rem] text-[var(--ink-muted)]">
        <span>deviation from own normal</span>
        <span>not a population threshold</span>
      </div>
    </Frame>
  );
}

function WristMock() {
  return (
    <Frame label="Object and hand signals: wrist trajectory approaching a hand zone near the desk edge">
      <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
        <rect x="36" y="96" width="120" height="34" rx="6" fill="var(--surface-inset)" stroke="var(--line-subtle)" />
        <text x="46" y="117" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-muted)">desk zone</text>
        <rect x="196" y="88" width="86" height="42" rx="6" fill="var(--review-soft)" stroke="var(--review)" strokeDasharray="4 3" />
        <text x="204" y="82" fontSize="10" fontFamily="var(--font-mono)" fill="var(--review)">hand zone</text>
        <path d="M70 40 C 110 30, 150 44, 186 66 S 226 92, 240 102" fill="none" stroke="var(--attention)" strokeWidth="2" strokeDasharray="2 4" />
        <circle cx="70" cy="40" r="4" fill="var(--attention)" />
        <circle cx="240" cy="102" r="5" fill="none" stroke="var(--review)" strokeWidth="1.6" />
        <text x="222" y="146" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">object candidate 0.52</text>
      </svg>
      <div className="mono mt-2 flex justify-between text-[length:0.6875rem] text-[var(--ink-muted)]">
        <span>wrist trajectory</span>
        <span>temporal confirmation required</span>
      </div>
    </Frame>
  );
}

function AbstainMock() {
  return (
    <Frame label="Visibility abstention: a seat below the visibility floor is excluded from assessment, shown in neutral grey">
      <svg viewBox="0 0 320 150" className="h-auto w-full" aria-hidden="true">
        <defs>
          <pattern id="ab-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="var(--unobservable-soft)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--unobservable)" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        {[0, 1, 2].map((c) => (
          <rect key={c} x={24 + c * 96} y="40" width="76" height="56" rx="8" fill="var(--surface-inset)" stroke="var(--line-subtle)" />
        ))}
        <rect x="216" y="40" width="76" height="56" rx="8" fill="url(#ab-hatch)" stroke="var(--unobservable)" />
        <text x="62" y="70" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">D3 ✓</text>
        <text x="158" y="70" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">D4 ✓</text>
        <text x="228" y="64" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-secondary)">D5</text>
        <text x="222" y="82" fontSize="9" fontFamily="var(--font-mono)" fill="var(--unobservable)">abstains</text>
        <text x="24" y="128" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-muted)">visibility 0.31 &lt; floor 0.45 → unobservable (neutral, not suspicious)</text>
      </svg>
    </Frame>
  );
}
