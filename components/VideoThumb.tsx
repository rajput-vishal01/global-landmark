"use client";

import { useState } from "react";
import type { VideoProvider } from "@/lib/video";
import { videoThumb } from "@/lib/video";

/**
 * Poster image for a video. Falls back to a branded card if the thumbnail
 * fails to load — Instagram refuses the poster for some reels.
 */
export function VideoThumb({
  provider,
  videoId,
  className = "",
}: {
  provider: VideoProvider;
  videoId: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = videoThumb(provider, videoId);

  if (failed) {
    return (
      <span className="flex h-full w-full items-end bg-dark-deep p-5">
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.25em] text-gold-highlight/60">
          {provider === "instagram" ? "Reel" : "Video"}
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external video-host thumbnails
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={className || "h-full w-full object-cover"}
    />
  );
}
