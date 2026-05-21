"use client";

import { resolveIpfsUri } from "@/lib/utils";

interface JsonViewerProps { data: unknown; depth?: number; }

function isUrl(val: string) {
  return val.startsWith("http://") || val.startsWith("https://") || val.startsWith("ipfs://");
}

const C = {
  bracket: "var(--text-3)",
  key:     "var(--text-2)",
  str:     "#7ecfa0",
  url:     "var(--accent)",
  num:     "#7eb8f5",
  bool:    "var(--warn)",
  null:    "var(--text-3)",
  comma:   "var(--text-3)",
};

export function JsonViewer({ data, depth = 0 }: JsonViewerProps) {
  if (data === null || data === undefined)
    return <span style={{ color: C.null, fontStyle: "italic" }}>null</span>;

  if (typeof data === "boolean")
    return <span style={{ color: C.bool }}>{String(data)}</span>;

  if (typeof data === "number")
    return <span style={{ color: C.num }}>{String(data)}</span>;

  if (typeof data === "string") {
    if (isUrl(data)) {
      return (
        <a href={resolveIpfsUri(data)} target="_blank" rel="noopener noreferrer"
          style={{ color: C.url, wordBreak: "break-all", textDecoration: "underline", textDecorationColor: "rgba(0,220,180,0.3)" }}>
          &quot;{data}&quot;
        </a>
      );
    }
    return <span style={{ color: C.str, wordBreak: "break-all" }}>&quot;{data}&quot;</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: C.bracket }}>[]</span>;
    return (
      <div style={{ marginLeft: depth * 14 }}>
        <span style={{ color: C.bracket }}>[</span>
        {data.map((item, i) => (
          <div key={i} style={{ marginLeft: 14 }}>
            <JsonViewer data={item} depth={depth + 1} />
            {i < data.length - 1 && <span style={{ color: C.comma }}>,</span>}
          </div>
        ))}
        <span style={{ color: C.bracket }}>]</span>
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span style={{ color: C.bracket }}>{"{}"}</span>;
    return (
      <div style={{ marginLeft: depth > 0 ? 14 : 0 }}>
        <span style={{ color: C.bracket }}>{"{"}</span>
        {entries.map(([k, v], i) => (
          <div key={k} style={{ marginLeft: 14 }}>
            <span style={{ color: C.key }}>&quot;{k}&quot;</span>
            <span style={{ color: C.bracket }}>: </span>
            <JsonViewer data={v} depth={depth + 1} />
            {i < entries.length - 1 && <span style={{ color: C.comma }}>,</span>}
          </div>
        ))}
        <span style={{ color: C.bracket }}>{"}"}</span>
      </div>
    );
  }

  return <span style={{ color: "var(--text-1)" }}>{String(data)}</span>;
}
