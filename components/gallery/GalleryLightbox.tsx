"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import type { PropertyImage } from "@/lib/db/schema";
import { useModalLock } from "@/lib/hooks";
import { optimizedImage } from "@/lib/images";

/**
 * Editorial two-column gallery with a fullscreen lightbox. Keyboard:
 * Esc closes, arrows navigate.
 */
export function GalleryLightbox({
  images,
  title,
}: {
  images: PropertyImage[];
  title: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (dir: -1 | 1) =>
      setOpenIndex((prev) =>
        prev === null ? prev : (prev + dir + images.length) % images.length
      ),
    [images.length]
  );

  useModalLock(
    openIndex !== null,
    useCallback(() => setOpenIndex(null), [])
  );

  // Arrow-key navigation (Escape + scroll lock live in useModalLock).
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, step]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            data-reveal
            onClick={() => setOpenIndex(i)}
            aria-label={`Open image ${i + 1} of ${images.length}`}
            className={`group relative cursor-zoom-in overflow-hidden bg-ink/5 ${
              i % 3 === 0 ? "sm:col-span-2 aspect-[3/2]" : "aspect-[4/5]"
            }`}
          >
            <Image
              src={optimizedImage(img.url, 1000)}
              alt={img.alt || `${title} — image ${i + 1}`}
              fill
              sizes={
                i % 3 === 0
                  ? "(min-width: 1024px) 60vw, 100vw"
                  : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
              }
              className="img-zoom"
            />
            <span className="text-eyebrow absolute bottom-4 right-4 bg-dark-deep/60 px-2.5 py-1 font-sans tracking-[0.2em] text-cream opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              {String(i + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} gallery`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-50 flex flex-col bg-dark-deep/95 backdrop-blur-xl"
            onClick={() => setOpenIndex(null)}
          >
            <div className="flex items-center justify-between px-5 py-5 md:px-10">
              <span className="text-eyebrow font-sans tracking-[0.25em] text-cream/70">
                {String(openIndex + 1).padStart(2, "0")} /{" "}
                {String(images.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                aria-label="Close gallery"
                className="cursor-pointer p-2 text-cream/80 transition-colors hover:text-cream"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
            </div>

            <m.div
              key={openIndex}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative mx-5 mb-5 flex-1 md:mx-16 md:mb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={optimizedImage(images[openIndex].url, 1600)}
                alt={images[openIndex].alt || `${title} — image ${openIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </m.div>

            {images.length > 1 && (
              <div
                className="flex items-center justify-center gap-10 pb-8"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                  className="cursor-pointer p-2 text-cream/70 transition-colors hover:text-cream"
                >
                  <svg width="36" height="10" viewBox="0 0 36 10" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M36 5H2M6 1L2 5l4 4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next image"
                  className="cursor-pointer p-2 text-cream/70 transition-colors hover:text-cream"
                >
                  <svg width="36" height="10" viewBox="0 0 36 10" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M0 5h34M30 1l4 4-4 4" />
                  </svg>
                </button>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
