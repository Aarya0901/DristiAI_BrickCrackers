import { ablationMatrix } from "@/content/home";

const columns = ["Baseline", "+ Seat anchor", "+ Baseline", "+ Pair evidence", "+ Abstention"];

export function AblationMatrix() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr>
              <th className="border border-[var(--line-subtle)] bg-[var(--surface-2)] p-3 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]">
                Component
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border border-[var(--line-subtle)] bg-[var(--surface-2)] p-3 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--ink-secondary)]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ablationMatrix.rows.map((row) => (
              <tr key={row}>
                <th
                  scope="row"
                  className="border border-[var(--line-subtle)] p-3 text-left font-medium"
                  style={{ fontSize: "14px" }}
                >
                  {row}
                </th>
                {columns.map((col) => (
                  <td key={col} className="border border-[var(--line-subtle)] p-3 text-center">
                    <span className="font-mono text-[12px] text-[var(--ink-secondary)]">—</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[var(--ink-secondary)]" style={{ fontSize: "13px" }}>
        {ablationMatrix.note}
      </p>
    </div>
  );
}
