"use client";

import { resolveIpfsUri } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface ImageGalleryProps {
  urls: string[];
  compact?: boolean;
}

function TokenImage({ src, size }: { src: string; size: number }) {
  const [error, setError] = useState(false);
  const resolved = resolveIpfsUri(src);
  if (error) return null;

  return (
    <a href={resolved} target="_blank" rel="noopener noreferrer">
      <div style={{
        position: "relative", width: size, height: size,
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "rgba(4,12,24,0.8)",
        flexShrink: 0,
        boxShadow: "0 0 16px rgba(0,220,180,0.08)",
      }}>
        <Image
          src={resolved} alt="Token image"
          fill className="object-contain"
          unoptimized
          onError={() => setError(true)}
        />
      </div>
    </a>
  );
}

export function ImageGallery({ urls, compact = false }: ImageGalleryProps) {
  if (urls.length === 0) return null;
  const size = compact ? 72 : 120;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {urls.map((url) => <TokenImage key={url} src={url} size={size} />)}
    </div>
  );
}
