import Image from "next/image";
import { TokenInspector } from "@/components/TokenInspector";

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen px-4 py-14 sm:py-20 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1">
        <header className="mb-12 animate-fade-up flex flex-col-reverse sm:flex-row items-center gap-8">
          <div className="w-full sm:flex-none">
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
            <p style={{ color: "var(--text-2)", fontSize: "0.875rem", marginTop: "0.75rem", fontFamily: "var(--font-mono)", maxWidth: "32ch" }}>
              Metadata for any ERC-20 contract. Get links from the contract source, not a third-party.
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <Image
              src="/logo.png"
              alt="Token Inspector"
              width={340}
              height={200}
              style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
              priority
            />
          </div>
        </header>
        <TokenInspector />
      </div>
      <footer
        className="max-w-2xl mx-auto w-full mt-16 pt-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <a
          href="https://github.com/mykclawd/token-metadata"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
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
        </a>
      </footer>
    </main>
  );
}
