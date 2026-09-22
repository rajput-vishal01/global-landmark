"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import type { TestimonialVideo } from "@/lib/db/schema";
import { useModalLock } from "@/lib/hooks";
import { videoEmbed } from "@/lib/video";
import { VideoThumb } from "@/components/VideoThumb";

/**
 * Video grid with a lightbox player. YouTube shows its thumbnail; Instagram
 * (no reliable thumbnail) shows a branded card. Both play in the lightbox —
 * no player JS loads until a video is opened.
 */
export function VideoTestimonials({ videos }: { videos: TestimonialVideo[] }) {
  const [openVideo, setOpenVideo] = useState<TestimonialVideo | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const closeVideo = useCallback(() => setOpenVideo(null), []);

  /**
   * Arrow controls, because a hidden scrollbar left the rail with no way to
   * move on a desktop: a mouse wheel scrolls the PAGE, not a horizontal
   * container, so the scrollbar had been the only affordance. Touch and
   * trackpads still swipe natively; these are for everyone else.
   */
  const syncArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    // 2px of slack: sub-pixel widths mean scrollLeft rarely lands exactly on
    // the maximum, which would leave the right arrow enabled forever.
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    syncArrows();
    window.addEventListener("resize", syncArrows);
    return () => window.removeEventListener("resize", syncArrows);
  }, [syncArrows]);

  function scrollRail(direction: -1 | 1) {
    const el = railRef.current;
    if (!el) return;
    // Roughly one card and its gap, so a click advances the rail by a whole
    // reel rather than an arbitrary distance.
    el.scrollBy({ left: direction * (el.clientWidth * 0.6), behavior: "smooth" });
  }

  return (
    <>
      {/* Arrows sit above the rail, aligned with its right edge. Hidden
          when the whole rail already fits — controls for a rail that cannot
          move are just decoration. */}
      {!(atStart && atEnd) && (
        <div className="mb-5 flex justify-end gap-2 px-5 md:px-12">
          {(
            [
              [-1, "Previous videos", "M15 5l-7 7 7 7"],
              [1, "Next videos", "M9 5l7 7-7 7"],
            ] as const
          ).map(([direction, label, path]) => {
            const disabled = direction === -1 ? atStart : atEnd;
            return (
              <button
                key={label}
                type="button"
                onClick={() => scrollRail(direction)}
                disabled={disabled}
                aria-label={label}
                className="flex h-11 w-11 cursor-pointer items-center justify-center border border-cream/25 text-cream transition-colors duration-300 hover:border-cta hover:text-cta disabled:cursor-not-allowed disabled:border-cream/10 disabled:text-cream/25"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d={path} />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* A rail of portrait cards, not a 16:9 grid: these are reels, and a
          9:16 video in a landscape box is mostly black bars. Native
          scroll-snap does the paging — no carousel library, and it swipes
          on touch and scrolls on a trackpad for free. */}
      <div
        ref={railRef}
        onScroll={syncArrows}
        tabIndex={0}
        role="region"
        aria-label="Client video reels"
        className="no-scrollbar snap-x snap-mandatory overflow-x-auto px-5 focus-visible:outline-2 focus-visible:outline-gold md:px-12"
      >
        <ul className="flex gap-5 md:gap-6">
          {videos.map((video) => (
            <li key={video.id} className="w-[15rem] shrink-0 snap-start md:w-[17rem]">
              <figure className="group flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setOpenVideo(video)}
                  aria-label={`Play video${video.caption ? ` — ${video.caption}` : ""}`}
                  className="relative block aspect-[9/16] w-full cursor-pointer overflow-hidden bg-dark-deep"
                >
                  <VideoThumb
                    provider={video.provider}
                    videoId={video.videoId}
                    className="img-zoom h-full w-full"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25 transition-colors duration-300 group-hover:from-black/60"
                  />
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-dark-deep/70 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                  >
                    <svg width="16" height="18" viewBox="0 0 18 20" fill="none" className="ml-1 text-cream">
                      <path d="M1 1.5v17L16.5 10 1 1.5Z" fill="currentColor" />
                    </svg>
                  </span>
                </button>
                {video.caption && (
                  <figcaption className="flex items-baseline gap-3">
                    <span className="h-px w-6 shrink-0 bg-gold" aria-hidden />
                    <span className="text-meta font-sans text-cream/80">
                      {video.caption}
                    </span>
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <VideoLightbox video={openVideo} onClose={closeVideo} />
    </>
  );
}

/**
 * The player overlay, shared by the reel rail and the 3D ring
 * (components/VideoRing.tsx). No player JS loads until a video is opened.
 */
export function VideoLightbox({
  video,
  onClose,
}: {
  video: TestimonialVideo | null;
  onClose: () => void;
}) {
  useModalLock(video !== null, onClose);
  const isInstagram = video?.provider === "instagram";

  return (
    <AnimatePresence>
      {video && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label={video.caption || "Video"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-deep/95 p-4 backdrop-blur-xl md:p-12"
          onClick={() => onClose()}
        >
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close video"
            className="absolute right-5 top-5 cursor-pointer p-2 text-cream/80 transition-colors hover:text-cream"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="M4 4l16 16M20 4L4 20" />
            </svg>
          </button>
          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className={
              isInstagram
                ? "relative aspect-[9/16] w-[min(480px,92vw,48dvh)] overflow-hidden bg-black"
                : "aspect-video w-full max-w-4xl bg-black"
            }
          >
            {/* Instagram's embed ships its own header and like/comment
                footer. The frame is sized to the 9:16 media exactly and
                the iframe overdrawn past both edges, so only the video
                shows. */}
            <iframe
              src={videoEmbed(video.provider, video.videoId)}
              title={video.caption || "Video"}
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              scrolling="no"
              className={
                isInstagram
                  ? "absolute left-0 top-[-58px] h-[calc(100%+290px)] w-full"
                  : "h-full w-full"
              }
            />
          </m.div>
        </m.div>
      )}
    </AnimatePresence>  );
}
