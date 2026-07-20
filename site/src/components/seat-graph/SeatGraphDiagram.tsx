const nodes = [
  { id: "A1", x: 60, y: 60 },
  { id: "A2", x: 180, y: 40 },
  { id: "B1", x: 60, y: 160 },
  { id: "B2", x: 180, y: 160 },
  { id: "B3", x: 300, y: 140 },
  { id: "C1", x: 60, y: 260 },
  { id: "C2", x: 300, y: 260 },
  { id: "D1", x: 180, y: 280 },
];

const edges: { from: string; to: string; kind: "directed" | "reciprocal" }[] = [
  { from: "A1", to: "A2", kind: "directed" },
  { from: "B2", to: "B3", kind: "reciprocal" },
  { from: "B1", to: "B2", kind: "directed" },
  { from: "C1", to: "D1", kind: "directed" },
  { from: "D1", to: "C2", kind: "reciprocal" },
];

function findNode(id: string) {
  return nodes.find((n) => n.id === id)!;
}

export function SeatGraphDiagram() {
  return (
    <div className="border border-[var(--line-strong)] bg-[var(--surface-1)] p-6">
      <svg viewBox="0 0 360 320" className="h-auto w-full" role="img" aria-label="Seat graph diagram">
        {edges.map((edge) => {
          const a = findNode(edge.from);
          const b = findNode(edge.to);
          const isReciprocal = edge.kind === "reciprocal";
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isReciprocal ? "var(--attention)" : "var(--line-strong)"}
                strokeWidth={isReciprocal ? 1.75 : 1}
                strokeDasharray={isReciprocal ? "5 4" : undefined}
                className={isReciprocal ? "seat-graph-edge-flow" : undefined}
              />
              {!isReciprocal && (
                <polygon
                  points="0,-3 6,0 0,3"
                  fill="var(--line-strong)"
                  transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2}) rotate(${
                    (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
                  })`}
                />
              )}
            </g>
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <rect x={node.x - 10} y={node.y - 10} width="20" height="20" fill="var(--ink-primary)" />
            <text
              x={node.x}
              y={node.y + 24}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill="var(--ink-secondary)"
            >
              {node.id}
            </text>
          </g>
        ))}
      </svg>
      <style>{`
        .seat-graph-edge-flow {
          animation: seat-graph-dash 1.2s linear infinite;
        }
        @keyframes seat-graph-dash {
          to { stroke-dashoffset: -18; }
        }
        @media (prefers-reduced-motion: reduce) {
          .seat-graph-edge-flow { animation: none; }
        }
      `}</style>
    </div>
  );
}
