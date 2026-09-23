"use client";

import { useRef, useState } from "react";
import { VideoThumb } from "@/components/VideoThumb";
import { parseVideo, videoEmbed } from "@/lib/video";

export type TourMedium = { id: number | string; kind: string; url: string; label: string | null };

/**
 * The property page's videos and tours.
 *
 * Plays in place rather than sending the visitor to YouTube: the enquiry
 * buttons are on this page, and a new tab is where the visit ends.
 *
 * The embed is not loaded until someone presses play. A YouTube iframe pulls
 * several hundred kilobytes and sets its own cookies on load, which is a poor
 * trade on a page that most visitors scroll past — so what renders first is
 * the poster and a play button, and the iframe replaces it on the click that
 * also starts the video (`autoplay=1` in videoEmbed).
 *
 * Anything we cannot parse (a Matterport tour, a Drive link) keeps the old
 * behaviour and opens in a new tab.
 */
export function VideoPlayer({ items, labels }: { items: TourMedium[]; labels: Record<string, string> }) {
  const playable = items
    .map((m) => ({ ...m, video: parseVideo(m.url) }))
    .filter((m): m is TourMedium & { video: NonNullable<ReturnType<typeof parseVideo>> } => m.video !== null);
  const links = items.filter((m) => parseVideo(m.url) === null);

  return (
    <div className="flex flex-col gap-6">
      {playable.length > 0 && (
        <div className={`grid gap-5 ${playable.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {playable.map((m) => (
            <Frame
              key={m.id}
              title={m.label || labels[m.kind] || "Video"}
              provider={m.video.provider}
              videoId={m.video.videoId}
              url={m.url}
            />
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {links.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-eyebrow inline-flex items-center gap-2 border border-border px-5 py-3 font-sans font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-gold"
            >
              {m.label || labels[m.kind] || "Watch"} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Frame({
  title,
  provider,
  videoId,
  url,
}: {
  title: string;
  provider: "youtube" | "instagram";
  videoId: string;
  url: string;
}) {
  const [playing, setPlaying] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  /**
   * Full screen on the wrapper, not the iframe: YouTube's own button is
   * inside the video and an Instagram embed has none, so this is the one
   * control that works for both. Older Safari names it webkit*.
   */
  function goFullscreen() {
    const box = boxRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!box) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen();
    else box.webkitRequestFullscreen?.();
  }

  return (
    <figure className="flex flex-col gap-3">
      <div
        ref={boxRef}
        className="group relative aspect-video w-full overflow-hidden border border-border bg-dark-deep"
      >
        {playing ? (
          <iframe
            src={videoEmbed(provider, videoId)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
            className="absolute inset-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold"
          >
            <VideoThumb
              provider={provider}
              videoId={videoId}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/15">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg transition-transform duration-300 group-hover:scale-105">
                <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden>
                  <path d="M19 9.27a2 2 0 0 1 0 3.46L3 21.99a2 2 0 0 1-3-1.73V1.74A2 2 0 0 1 3 .01z" />
                </svg>
              </span>
            </span>
          </button>
        )}

        {playing && (
          <button
            type="button"
            onClick={goFullscreen}
            className="text-eyebrow absolute right-3 top-3 cursor-pointer bg-ink/80 px-3 py-2 font-sans font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors hover:bg-ink"
          >
            Full screen
          </button>
        )}
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="font-sans text-meta text-ink">{title}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-meta text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Open on {provider === "youtube" ? "YouTube" : "Instagram"} ↗
        </a>
      </figcaption>
    </figure>
  );
}
