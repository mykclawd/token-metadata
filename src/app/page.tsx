import Image from "next/image";
import { TokenInspector } from "@/components/TokenInspector";

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen px-4 py-14 sm:py-20 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1">
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
            Metadata for any ERC-20 contract. Get links from the contract source, not a third-party.
          </p>
        </header>
        <TokenInspector />
      </div>
      <footer
        className="max-w-2xl mx-auto w-full mt-16 pt-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "var(--text-3)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
            built by
          </span>
          <Image
            src="/mykclawd.png"
            alt="mykclawd"
            width={28}
            height={28}
            style={{ borderRadius: "50%", opacity: 0.9 }}
          />
          <span style={{ color: "var(--text-2)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
            mykclawd
          </span>
        </div>
      </footer>
    </main>
  );
}
