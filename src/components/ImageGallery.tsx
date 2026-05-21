"use client";

import { resolveIpfsUri } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface ImageGalleryProps {
  urls: string[];
}

function TokenImage({ src }: { src: string }) {
  const [error, setError] = useState(false);
  const resolved = resolveIpfsUri(src);

  if (error) return null;

  return (
    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-700 bg-gray-900 flex-shrink-0">
      <Image
        src={resolved}
        alt="Token image"
        fill
        className="object-contain"
        unoptimized
        onError={() => setError(true)}
      />
    </div>
  );
}

export function ImageGallery({ urls }: ImageGalleryProps) {
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {urls.map((url) => (
        <a key={url} href={resolveIpfsUri(url)} target="_blank" rel="noopener noreferrer">
          <TokenImage src={url} />
        </a>
      ))}
    </div>
  );
}
