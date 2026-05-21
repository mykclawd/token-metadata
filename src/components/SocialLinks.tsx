"use client";

const ICONS: Record<string, string> = {
  website: "🌐",
  twitter: "𝕏",
  telegram: "✈️",
  discord: "💬",
  farcaster: "🟣",
  github: "⌨️",
  medium: "📝",
  reddit: "🔴",
};

interface SocialLinksProps {
  links: Record<string, string>;
}

export function SocialLinks({ links }: SocialLinksProps) {
  const entries = Object.entries(links).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, url]) => {
        const href = url.startsWith("http") ? url : `https://${url}`;
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-200 transition-colors"
          >
            <span>{ICONS[key] ?? "🔗"}</span>
            <span className="capitalize">{key}</span>
          </a>
        );
      })}
    </div>
  );
}
