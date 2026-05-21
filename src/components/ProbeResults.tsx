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

const statusConfig = {
  success: { label: "Success", bg: "bg-green-900/40", border: "border-green-700", text: "text-green-400", dot: "bg-green-500" },
  reverted: { label: "Reverted", bg: "bg-yellow-900/30", border: "border-yellow-700", text: "text-yellow-400", dot: "bg-yellow-500" },
  unavailable: { label: "N/A", bg: "bg-gray-800/40", border: "border-gray-700", text: "text-gray-500", dot: "bg-gray-600" },
  error: { label: "Error", bg: "bg-red-900/30", border: "border-red-700", text: "text-red-400", dot: "bg-red-500" },
};

export function ProbeResults({ results }: ProbeResultsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {results.map((r) => {
        const cfg = statusConfig[r.status];
        return (
          <div key={r.fn} className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              <code className="text-sm font-mono text-white">{r.fn}()</code>
              <span className={`ml-auto text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
            </div>
            {r.status === "success" && r.raw && (
              <p className="text-xs text-gray-400 truncate font-mono mt-1">{r.raw.slice(0, 80)}{r.raw.length > 80 ? "…" : ""}</p>
            )}
            {r.error && r.status !== "unavailable" && (
              <p className="text-xs text-gray-500 mt-1 truncate">{r.error.slice(0, 100)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
