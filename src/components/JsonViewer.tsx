"use client";

import { resolveIpfsUri } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  depth?: number;
}

function isUrl(val: string) {
  return val.startsWith("http://") || val.startsWith("https://") || val.startsWith("ipfs://");
}

function isImageUrl(val: string) {
  return (
    val.match(/\.(png|jpg|jpeg|gif|svg|webp)/i) !== null ||
    val.startsWith("data:image/") ||
    val.includes("ipfs") ||
    val.includes("image")
  );
}

export function JsonViewer({ data, depth = 0 }: JsonViewerProps) {
  const indent = depth * 16;

  if (data === null || data === undefined) {
    return <span className="text-gray-400 italic">null</span>;
  }

  if (typeof data === "boolean") {
    return <span className="text-purple-400">{String(data)}</span>;
  }

  if (typeof data === "number") {
    return <span className="text-blue-400">{String(data)}</span>;
  }

  if (typeof data === "string") {
    if (isUrl(data)) {
      const resolved = resolveIpfsUri(data);
      return (
        <a
          href={resolved}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline break-all"
        >
          {data}
        </a>
      );
    }
    return <span className="text-green-400 break-all">"{data}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-400">[]</span>;
    return (
      <div style={{ marginLeft: indent }}>
        <span className="text-gray-400">[</span>
        {data.map((item, i) => (
          <div key={i} className="ml-4">
            <JsonViewer data={item} depth={depth + 1} />
            {i < data.length - 1 && <span className="text-gray-500">,</span>}
          </div>
        ))}
        <span className="text-gray-400">]</span>
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-gray-400">{"{}"}</span>;
    return (
      <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        <span className="text-gray-400">{"{"}</span>
        {entries.map(([k, v], i) => (
          <div key={k} className="ml-4">
            <span className="text-yellow-300">&quot;{k}&quot;</span>
            <span className="text-gray-400">: </span>
            {typeof v === "string" && isUrl(v) && isImageUrl(v) ? (
              <span className="inline-block">
                <a
                  href={resolveIpfsUri(v)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline break-all"
                >
                  "{v}"
                </a>
              </span>
            ) : (
              <JsonViewer data={v} depth={depth + 1} />
            )}
            {i < entries.length - 1 && <span className="text-gray-500">,</span>}
          </div>
        ))}
        <span className="text-gray-400">{"}"}</span>
      </div>
    );
  }

  return <span className="text-gray-300">{String(data)}</span>;
}
