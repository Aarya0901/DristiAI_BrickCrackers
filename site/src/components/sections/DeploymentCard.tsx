interface DeploymentCardProps {
  index: string;
  title: string;
  tagline: string;
  points: string[];
}

export function DeploymentCard({ index, title, tagline, points }: DeploymentCardProps) {
  return (
    <div className="flex flex-col gap-4 border border-[var(--line-strong)] bg-[var(--surface-1)] p-7">
      <div className="flex aspect-[5/3] w-full items-center justify-center border border-[var(--line-subtle)] bg-[var(--surface-2)]">
        <DeploymentGlyph index={index} />
      </div>
      <p className="font-mono text-[var(--text-label)] text-[var(--ink-secondary)]">{index} /</p>
      <div>
        <h3 className="font-medium" style={{ fontSize: "var(--text-heading-md)" }}>
          {title}
        </h3>
        <p className="text-[var(--ink-secondary)]" style={{ fontSize: "14px" }}>
          {tagline}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2" style={{ fontSize: "14px" }}>
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-secondary)]" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeploymentGlyph({ index }: { index: string }) {
  return (
    <svg viewBox="0 0 160 100" className="h-2/3 w-2/3" aria-hidden>
      {index === "01" && (
        <g stroke="var(--ink-primary)" fill="none" strokeWidth="1.5">
          <rect x="20" y="20" width="120" height="60" />
          <rect x="60" y="45" width="40" height="30" fill="var(--attention-soft)" stroke="var(--attention)" />
        </g>
      )}
      {index === "02" && (
        <g stroke="var(--ink-primary)" fill="none" strokeWidth="1.5">
          <rect x="15" y="60" width="24" height="24" />
          <rect x="68" y="60" width="24" height="24" />
          <rect x="121" y="60" width="24" height="24" />
          <rect x="60" y="16" width="40" height="24" fill="var(--attention-soft)" stroke="var(--attention)" />
          <line x1="27" y1="60" x2="70" y2="40" />
          <line x1="80" y1="60" x2="80" y2="40" />
          <line x1="133" y1="60" x2="90" y2="40" />
        </g>
      )}
      {index === "03" && (
        <g stroke="var(--ink-primary)" fill="none" strokeWidth="1.5">
          <rect x="40" y="30" width="80" height="50" />
          <circle cx="80" cy="55" r="10" fill="var(--healthy-soft)" stroke="var(--healthy)" />
          <line x1="55" y1="80" x2="55" y2="86" />
          <line x1="105" y1="80" x2="105" y2="86" />
        </g>
      )}
    </svg>
  );
}
