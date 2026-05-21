import { isAddress } from "viem";

export function isValidEvmAddress(address: string): boolean {
  return isAddress(address);
}

export function resolveIpfsUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export function safeJsonParse(raw: string): unknown | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export async function fetchJsonOrText(
  url: string
): Promise<{ data: unknown; raw: string; contentType: string }> {
  const resolved = resolveIpfsUri(url);
  const res = await fetch(resolved, { signal: AbortSignal.timeout(10000) });
  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text();
  if (contentType.includes("application/json") || raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
    const parsed = safeJsonParse(raw);
    return { data: parsed ?? raw, raw, contentType };
  }
  return { data: raw, raw, contentType };
}

export function extractImageUrls(obj: unknown): string[] {
  const urls: string[] = [];
  const imageKeys = ["image", "image_url", "imageURL", "imageUri", "imageURI", "image_uri", "logo", "icon", "thumbnail"];
  function walk(val: unknown) {
    if (typeof val === "string") {
      if (
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("ipfs://") ||
        val.startsWith("data:image/")
      ) {
        urls.push(val);
      }
    } else if (Array.isArray(val)) {
      val.forEach(walk);
    } else if (val && typeof val === "object") {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (imageKeys.some((ik) => k.toLowerCase().includes(ik.toLowerCase()))) {
          if (typeof v === "string") urls.push(v);
        } else {
          walk(v);
        }
      }
    }
  }
  walk(obj);
  return [...new Set(urls)];
}

export function extractSocialLinks(obj: unknown): Record<string, string> {
  const socialKeys: Record<string, string[]> = {
    website: ["website", "url", "homepage", "web"],
    twitter: ["twitter", "x", "twitterUrl", "twitter_url", "x_url"],
    telegram: ["telegram", "tg", "telegramUrl", "telegram_url"],
    discord: ["discord", "discordUrl", "discord_url"],
    farcaster: ["farcaster", "warpcast"],
    github: ["github", "githubUrl", "github_url"],
    medium: ["medium", "mediumUrl"],
    reddit: ["reddit"],
  };

  const found: Record<string, string> = {};

  function walk(val: unknown, depth = 0) {
    if (depth > 5) return;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        for (const [social, aliases] of Object.entries(socialKeys)) {
          if (aliases.some((a) => k.toLowerCase().includes(a.toLowerCase()))) {
            if (typeof v === "string" && v.length > 0) {
              found[social] = v;
            }
          }
        }
        walk(v, depth + 1);
      }
    } else if (Array.isArray(val)) {
      val.forEach((item) => walk(item, depth + 1));
    }
  }
  walk(obj);
  return found;
}

export function normalizeMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { _raw: raw };
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") {
      const parsed = safeJsonParse(v);
      result[k] = parsed !== null ? parsed : v;
    } else {
      result[k] = v;
    }
  }
  return result;
}
