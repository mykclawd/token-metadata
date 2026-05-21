"use client";

import { useState, useCallback } from "react";
import { isValidEvmAddress } from "@/lib/utils";
import { JsonViewer } from "./JsonViewer";
import { ProbeResults } from "./ProbeResults";
import { SocialLinks } from "./SocialLinks";
import { ImageGallery } from "./ImageGallery";
import { GeckoChart } from "./GeckoChart";

const CHAINS = [
  { id: 8453,    label: "Base" },
  { id: 1,       label: "Ethereum" },
  { id: 42161,   label: "Arbitrum" },
  { id: 10,      label: "Optimism" },
  { id: 137,     label: "Polygon" },
  { id: 56,      label: "BNB Chain" },
  { id: 43114,   label: "Avalanche" },
  { id: 7777777, label: "Zora" },
  { id: 59144,   label: "Linea" },
  { id: 534352,  label: "Scroll" },
];

interface ERC20Metadata { name: string; symbol: string; decimals: number; totalSupply: string; }
interface ProbeResult { fn: string; status: "success"|"reverted"|"unavailable"|"error"; raw?: string; error?: string; }
interface InspectResult {
  address: string; chainId: number; chainName: string;
  erc20: ERC20Metadata;
  discovered: { metadata: Record<string, unknown>|null; imageUrls: string[]; socialLinks: Record<string, string>; };
  probeResults: ProbeResult[];
  rawResponses: Record<string, string>;
}

function Section({
  title, index, children,
}: { title: string; index: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className="card section-reveal overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          background: "transparent",
          borderBottom: open ? "1px solid var(--border)" : "none",
          cursor: "pointer",
          gap: "0.5rem",
        }}
      >
        <span className="section-label">{title}</span>
        <span style={{ color: "var(--text-3)", fontSize: "0.85rem", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "1.25rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", gap: "1rem", padding: "0.5rem 0",
      borderBottom: "1px solid var(--border)",
      alignItems: "baseline",
    }}>
      <span style={{
        fontFamily: "var(--font-display)", fontSize: "0.65rem", fontWeight: 600,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--text-2)", flexShrink: 0, width: "7rem",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
        fontSize: mono ? "0.85rem" : "0.9rem",
        color: "var(--text-1)", wordBreak: "break-all",
      }}>
        {String(value)}
      </span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(0,220,180,0.25)" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
        </path>
      </svg>
      Scanning…
    </span>
  );
}

export function TokenInspector() {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(8453);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectResult | null>(null);

  const inspect = useCallback(async () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    if (!isValidEvmAddress(trimmed)) { setError("Enter a valid EVM address."); return; }

    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`/api/inspect?address=${encodeURIComponent(trimmed)}&chainId=${chainId}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Inspection failed.");
      else setResult(data as InspectResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [address, chainId]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") inspect(); };

  const explorerBase = chainId === 8453 ? "https://basescan.org"
    : chainId === 1 ? "https://etherscan.io"
    : chainId === 42161 ? "https://arbiscan.io"
    : chainId === 10 ? "https://optimistic.etherscan.io"
    : chainId === 137 ? "https://polygonscan.com"
    : chainId === 56 ? "https://bscscan.com"
    : "https://etherscan.io";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Search row ── */}
      <div
        className={`${!loading && !result && !error ? "scanner" : ""} card`}
        style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            className="field"
            style={{ flex: 1, minWidth: "0" }}
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setError(null); }}
            onKeyDown={handleKey}
            placeholder="0x contract address"
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
          />
          <select
            className="field"
            style={{ flexShrink: 0, cursor: "pointer" }}
            value={chainId}
            onChange={(e) => { setChainId(Number(e.target.value)); setResult(null); setError(null); }}
            disabled={loading}
          >
            {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button
            className="btn-primary"
            onClick={inspect}
            disabled={loading || !address.trim()}
          >
            {loading ? <LoadingSpinner /> : "Inspect"}
          </button>
        </div>

        {error && (
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.8rem",
            color: "var(--danger)", padding: "0.5rem 0.75rem",
            background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)",
            borderRadius: "3px",
          }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {result && (
        <>
          {/* Address strip */}
          <div
            className="section-reveal"
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
              padding: "0.6rem 0",
            }}
          >
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "var(--accent)", background: "var(--accent-dim)",
              border: "1px solid rgba(0,220,180,0.25)",
              padding: "0.2rem 0.5rem", borderRadius: "3px",
            }}>ERC-20</span>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "var(--text-2)", background: "rgba(90,132,158,0.08)",
              border: "1px solid rgba(90,132,158,0.2)",
              padding: "0.2rem 0.5rem", borderRadius: "3px",
            }}>{result.chainName}</span>
            <a
              href={`${explorerBase}/token/${result.address}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono)", fontSize: "0.72rem",
                color: "var(--text-2)", transition: "color 0.15s", wordBreak: "break-all",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {result.address}
            </a>
          </div>

          {/* Token identity hero */}
          <div
            className="card section-reveal"
            style={{
              padding: "1.5rem 1.25rem",
              display: "flex", alignItems: "center", gap: "1.5rem",
              animationDelay: "40ms",
            }}
          >
            {result.discovered.imageUrls.length > 0 && (
              <ImageGallery urls={result.discovered.imageUrls} compact />
            )}
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "clamp(1.4rem, 4vw, 2rem)", letterSpacing: "-0.02em",
                color: "var(--text-1)", lineHeight: 1.1,
              }}>
                {result.erc20.name}
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.85rem",
                color: "var(--accent)", marginTop: "0.2rem",
              }}>
                {result.erc20.symbol}
              </div>
            </div>
          </div>

          {/* 1. Standard ERC-20 */}
          <Section title="01 · ERC-20 Standard" index={2}>
            <div>
              <DataRow label="Name"         value={result.erc20.name} />
              <DataRow label="Symbol"       value={result.erc20.symbol} />
              <DataRow label="Decimals"     value={result.erc20.decimals} />
              <DataRow label="Total Supply" value={`${result.erc20.totalSupply} ${result.erc20.symbol}`} />
            </div>
          </Section>

          {/* 2. Discovered */}
          <Section title="02 · Discovered Metadata" index={3}>
            {result.discovered.metadata || Object.keys(result.discovered.socialLinks).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {Object.keys(result.discovered.socialLinks).length > 0 && (
                  <div>
                    <p className="section-label" style={{ marginBottom: "0.6rem" }}>Links</p>
                    <SocialLinks links={result.discovered.socialLinks} />
                  </div>
                )}
                {result.discovered.metadata && (
                  <div>
                    <p className="section-label" style={{ marginBottom: "0.6rem" }}>Metadata</p>
                    <div style={{
                      background: "rgba(4,12,24,0.7)", borderRadius: "4px", padding: "1rem",
                      fontFamily: "var(--font-mono)", fontSize: "0.8rem",
                      lineHeight: 1.7, overflowX: "auto", maxHeight: "24rem", overflowY: "auto",
                      border: "1px solid var(--border)",
                    }}>
                      <JsonViewer data={result.discovered.metadata} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-3)" }}>
                No additional metadata discovered.
              </span>
            )}
          </Section>

          {/* 3. Raw */}
          <Section title="03 · Raw Responses" index={4}>
            {Object.keys(result.rawResponses).length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {Object.entries(result.rawResponses).map(([fn, raw]) => (
                  <div key={fn}>
                    <p style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                      color: "var(--accent)", marginBottom: "0.35rem", letterSpacing: "0.05em",
                    }}>{fn}</p>
                    <pre style={{
                      background: "rgba(4,12,24,0.7)", border: "1px solid var(--border)",
                      borderRadius: "4px", padding: "0.75rem", fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)", color: "var(--text-2)",
                      overflowX: "auto", maxHeight: "12rem", overflowY: "auto",
                      whiteSpace: "pre-wrap", wordBreak: "break-all",
                    }}>{raw}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-3)" }}>
                No raw responses to display.
              </span>
            )}
          </Section>

          {/* 4. Probe results */}
          <Section title="04 · Probe Results" index={5}>
            <ProbeResults results={result.probeResults} />
          </Section>

          {/* Price chart — last */}
          <GeckoChart address={result.address} chainId={result.chainId} index={6} />
        </>
      )}
    </div>
  );
}
