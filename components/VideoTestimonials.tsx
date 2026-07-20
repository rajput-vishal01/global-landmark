"use client";

import { EASE } from "@/lib/motion";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TestimonialVideo } from "@/lib/db/schema";
import { videoEmbed } from "@/lib/video";
import { VideoThumb } from "@/components/VideoThumb";

/**
 * Video grid with a lightbox player. YouTube shows its thumbnail; Instagram
 * (no reliable thumbnail) shows a branded card. Both play in the lightbox —
 * no player JS loads until a video is opened.
 */
export function VideoTestimonials({ videos }: { videos: TestimonialVideo[] }) {
  const [openVideo, setOpenVideo] = useState<TestimonialVideo | null>(null);

  useEffect(() => {
    if (!openVideo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenVideo(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openVideo]);

  const isInstagram = openVideo?.provider === "instagram";

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
        {videos.map((video) => (
          <figure key={video.id} data-reveal className="group flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setOpenVideo(video)}
              aria-label={`Play video${video.caption ? ` — ${video.caption}` : ""}`}
              className="relative block aspect-video cursor-pointer overflow-hidden bg-dark-deep"
            >
              <VideoThumb
                provider={video.provider}
                videoId={video.videoId}
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/15"
              />
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-dark-deep/70 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
              >
                <svg width="18" height="20" viewBox="0 0 18 20" fill="none" className="ml-1 text-cream">
                  <path d="M1 1.5v17L16.5 10 1 1.5Z" fill="currentColor" />
                </svg>
              </span>
            </button>
            {video.caption && (
              <figcaption className="flex items-baseline gap-3">
                <span className="h-px w-8 bg-gold" aria-hidden />
                <span className="text-meta font-sans text-ink">{video.caption}</span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {openVideo && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={openVideo.caption || "Video"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-deep/95 p-4 backdrop-blur-xl md:p-12"
            onClick={() => setOpenVideo(null)}
          >
            <button
              type="button"
              onClick={() => setOpenVideo(null)}
              aria-label="Close video"
              className="absolute right-5 top-5 cursor-pointer p-2 text-cream/80 transition-colors hover:text-cream"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </button>
            <motion.div
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
                src={videoEmbed(openVideo.provider, openVideo.videoId)}
                title={openVideo.caption || "Video"}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
