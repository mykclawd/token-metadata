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

function isTweetUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/(i\/status|[^/]+\/status)\//.test(url);
}

function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s"'<>(),]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s"'<>(),]*)?/g) ?? [];
  return matches
    .map((m) => (m.startsWith("http") ? m : `https://${m}`))
    .filter((m) => {
      try { new URL(m); return true; } catch { return false; }
    });
}

export function extractSocialLinks(obj: unknown): Record<string, string> {
  // Key aliases use whole-key matching (exact or starts-with) to avoid
  // "tweet_url" accidentally matching the "url" website alias.
  const socialKeys: Record<string, string[]> = {
    website: ["website", "homepage", "web", "site"],
    twitter: ["twitter", "tweet", "x_url", "x_link"],
    telegram: ["telegram", "tg"],
    discord: ["discord"],
    farcaster: ["farcaster", "warpcast"],
    github: ["github"],
    medium: ["medium"],
    reddit: ["reddit"],
  };

  const found: Record<string, string> = {};

  function matchKey(k: string): string | null {
    const lower = k.toLowerCase().replace(/[-_]/g, "");
    for (const [social, aliases] of Object.entries(socialKeys)) {
      if (aliases.some((a) => lower === a || lower.startsWith(a))) {
        return social;
      }
    }
    return null;
  }

  function walk(val: unknown, depth = 0) {
    if (depth > 5) return;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (typeof v === "string" && v.length > 0) {
          // Explicitly route tweet URLs to twitter regardless of key name
          if (isTweetUrl(v)) {
            found.twitter = found.twitter ?? v;
          } else {
            const social = matchKey(k);
            if (social) found[social] = found[social] ?? v;
          }
        }
        walk(v, depth + 1);
      }
    } else if (Array.isArray(val)) {
      val.forEach((item) => walk(item, depth + 1));
    }
  }
  walk(obj);

  // If no website found, look for a URL in the description field
  if (!found.website) {
    const description = (obj as Record<string, unknown>)?.description;
    if (typeof description === "string") {
      const candidates = extractUrlsFromText(description).filter(
        (u) => !isTweetUrl(u) && !/twitter\.com|x\.com|t\.me|discord\.gg|github\.com/i.test(u)
      );
      if (candidates.length > 0) found.website = candidates[0];
    }
  }

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
