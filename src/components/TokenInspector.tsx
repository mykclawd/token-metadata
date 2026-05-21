"use client";

import { useState, useCallback } from "react";
import { isValidEvmAddress } from "@/lib/utils";
import { JsonViewer } from "./JsonViewer";
import { ProbeResults } from "./ProbeResults";
import { SocialLinks } from "./SocialLinks";
import { ImageGallery } from "./ImageGallery";

interface ERC20Metadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

interface ProbeResult {
  fn: string;
  status: "success" | "reverted" | "unavailable" | "error";
  raw?: string;
  error?: string;
}

interface InspectResult {
  address: string;
  erc20: ERC20Metadata;
  discovered: {
    metadata: Record<string, unknown> | null;
    imageUrls: string[];
    socialLinks: Record<string, string>;
  };
  probeResults: ProbeResult[];
  rawResponses: Record<string, string>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-900/60 hover:bg-gray-800/60 transition-colors text-left"
      >
        <span className="font-semibold text-gray-100">{title}</span>
        <span className="text-gray-500 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="p-5 bg-gray-950/40">{children}</div>}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-500 text-sm w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-100 text-sm font-mono break-all">{String(value)}</span>
    </div>
  );
}

export function TokenInspector() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectResult | null>(null);

  const inspect = useCallback(async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    if (!isValidEvmAddress(trimmed)) {
      setError("Enter a valid EVM address.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/inspect?address=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Inspection failed.");
      } else {
        setResult(data as InspectResult);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") inspect();
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(null); }}
          onKeyDown={handleKey}
          placeholder="0x... ERC-20 contract address"
          className="flex-1 px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={inspect}
          disabled={loading || !address.trim()}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold transition-colors flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Inspecting…
            </span>
          ) : "Inspect"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Address badge */}
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded bg-green-900/40 border border-green-700 text-green-400 text-xs font-medium">ERC-20</span>
            <a
              href={`https://etherscan.io/token/${result.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 font-mono text-xs break-all transition-colors"
            >
              {result.address}
            </a>
          </div>

          {/* Images */}
          {result.discovered.imageUrls.length > 0 && (
            <ImageGallery urls={result.discovered.imageUrls} />
          )}

          {/* 1. Standard ERC-20 */}
          <Section title="1. Standard ERC-20 Metadata">
            <div>
              <MetaRow label="Name" value={result.erc20.name} />
              <MetaRow label="Symbol" value={result.erc20.symbol} />
              <MetaRow label="Decimals" value={result.erc20.decimals} />
              <MetaRow label="Total Supply" value={`${result.erc20.totalSupply} ${result.erc20.symbol}`} />
            </div>
          </Section>

          {/* 2. Discovered Metadata */}
          <Section title="2. Discovered Metadata">
            {result.discovered.metadata ? (
              <div className="space-y-4">
                {Object.keys(result.discovered.socialLinks).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Social Links</p>
                    <SocialLinks links={result.discovered.socialLinks} />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Metadata</p>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm font-mono leading-relaxed max-h-96">
                    <JsonViewer data={result.discovered.metadata} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No additional metadata discovered.</p>
            )}
          </Section>

          {/* 3. Raw Responses */}
          <Section title="3. Raw Responses">
            {Object.keys(result.rawResponses).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(result.rawResponses).map(([fn, raw]) => (
                  <div key={fn}>
                    <p className="text-xs text-gray-500 mb-1 font-mono">{fn}</p>
                    <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-48 whitespace-pre-wrap break-all">{raw}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No raw responses to display.</p>
            )}
          </Section>

          {/* 4. Probe Results */}
          <Section title="4. Probe Results">
            <ProbeResults results={result.probeResults} />
          </Section>
        </div>
      )}
    </div>
  );
}
