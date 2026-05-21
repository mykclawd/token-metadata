"use client";

interface ProbeResult {
  fn: string;
  status: "success" | "reverted" | "unavailable" | "error";
  raw?: string;
  error?: string;
}

interface ProbeResultsProps {
  results: ProbeResult[];
}

const STATUS = {
  success:     { label: "OK",  color: "var(--accent)",  bg: "rgba(0,220,180,0.07)",  dot: "var(--accent)" },
  reverted:    { label: "REVERTED", color: "var(--warn)",     bg: "rgba(245,166,35,0.06)", dot: "var(--warn)" },
  unavailable: { label: "N/A", color: "var(--text-3)",   bg: "transparent",           dot: "var(--text-3)" },
  error:       { label: "ERR", color: "var(--danger)",   bg: "rgba(255,77,106,0.06)", dot: "var(--danger)" },
};

export function ProbeResults({ results }: ProbeResultsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {results.map((r) => {
        const s = STATUS[r.status];
        return (
          <div
            key={r.fn}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              background: s.bg,
              borderRadius: "3px",
              border: `1px solid ${r.status === "unavailable" ? "transparent" : `${s.color}25`}`,
            }}
          >
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
              background: s.dot,
              boxShadow: r.status === "success" ? `0 0 6px ${s.dot}` : "none",
            }} />
            <code style={{
              fontFamily: "var(--font-mono)", fontSize: "0.8rem",
              color: r.status === "unavailable" ? "var(--text-3)" : "var(--text-1)",
              flex: 1,
            }}>
              {r.fn}()
            </code>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.12em",
              color: s.color,
            }}>
              {s.label}
            </span>
            {r.status === "success" && r.raw && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                color: "var(--text-3)",
                maxWidth: "12rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.raw.slice(0, 60)}{r.raw.length > 60 ? "…" : ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
