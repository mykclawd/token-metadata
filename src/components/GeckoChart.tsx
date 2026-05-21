"use client";

import { useState } from "react";

const GECKO_NETWORKS: Record<number, string> = {
  1:       "eth",
  56:      "bsc",
  137:     "polygon_pos",
  8453:    "base",
  10:      "optimism",
  42161:   "arbitrum",
  43114:   "avax",
  59144:   "linea",
  534352:  "scroll",
  7777777: "zora",
};

interface GeckoChartProps {
  address: string;
  chainId: number;
  index?: number;
}

export function GeckoChart({ address, chainId, index = 0 }: GeckoChartProps) {
  const [open, setOpen] = useState(true);
  const network = GECKO_NETWORKS[chainId];
  if (!network) return null;

  const src =
    `https://www.geckoterminal.com/${network}/tokens/${address}` +
    `?embed=1&info=0&swaps=0&light_chart=0&bg_color=070a0f&chart_type=market_cap&resolution=1h`;

  return (
    <div
      className="card section-reveal overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          background: "transparent",
          borderBottom: open ? "1px solid var(--border)" : "none",
          cursor: "pointer",
          gap: "0.5rem",
        }}
      >
        <span className="section-label">00 · Price Chart</span>
        <span style={{ color: "var(--text-3)", fontSize: "0.85rem", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ position: "relative", height: "440px" }}>
          <iframe
            id="geckoterminal-embed"
            title="GeckoTerminal Embed"
            src={src}
            frameBorder="0"
            allow="clipboard-write"
            allowFullScreen
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      )}
    </div>
  );
}
