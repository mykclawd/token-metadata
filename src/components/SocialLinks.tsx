"use client";

const LABELS: Record<string, string> = {
  website:   "Web",
  twitter:   "X",
  telegram:  "TG",
  discord:   "DC",
  farcaster: "FC",
  github:    "GH",
  medium:    "MD",
  reddit:    "RD",
  instagram: "IG",
  linkedin:  "LI",
  youtube:   "YT",
};

interface SocialLinksProps {
  links: Record<string, string>;
}

export function SocialLinks({ links }: SocialLinksProps) {
  const entries = Object.entries(links).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {entries.map(([key, url]) => {
        const href = url.startsWith("http") ? url : `https://${url}`;
        const label = LABELS[key] ?? key.slice(0, 3).toUpperCase();
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.3rem 0.7rem",
              fontFamily: "var(--font-display)", fontSize: "0.65rem",
              fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--text-2)",
              background: "rgba(90,132,158,0.07)",
              border: "1px solid rgba(90,132,158,0.18)",
              borderRadius: "3px",
              textDecoration: "none",
              transition: "color 0.15s, border-color 0.15s, background 0.15s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.borderColor = "rgba(0,220,180,0.35)";
              e.currentTarget.style.background = "var(--accent-dim)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "var(--text-2)";
              e.currentTarget.style.borderColor = "rgba(90,132,158,0.18)";
              e.currentTarget.style.background = "rgba(90,132,158,0.07)";
            }}
          >
            <span style={{ opacity: 0.6, fontSize: "0.55rem" }}>↗</span>
            {label}
            <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.6rem" }}>
              {new URL(href).hostname.replace(/^www\./, "")}
            </span>
          </a>
        );
      })}
    </div>
  );
}
