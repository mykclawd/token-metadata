import { TokenInspector } from "@/components/TokenInspector";

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen px-4 py-14 sm:py-20">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 animate-fade-up">
          <p className="section-label mb-3">ERC-20 · Multi-chain</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 6vw, 3.25rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--text-1)",
            }}
          >
            Token<br />
            <span style={{ color: "var(--accent)" }}>Inspector</span>
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.875rem", marginTop: "0.75rem", fontFamily: "var(--font-mono)" }}>
            Decode every onchain + offchain signal from any ERC-20 contract.
          </p>
        </header>
        <TokenInspector />
      </div>
    </main>
  );
}
