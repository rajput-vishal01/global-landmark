"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import type { PublicImage } from "@/lib/db/public-columns";
import { useModalLock } from "@/lib/hooks";

/**
 * Tiles on the page for a given photo count — never a half-empty grid.
 * 1 → one wide image; 2 → a pair; 3–4 → one large + two stacked; 5+ → one
 * large + four. Everything past the tiles lives behind the last one.
 */
function tileCount(count: number): number {
  if (count >= 5) return 5;
  if (count >= 3) return 3;
  return count;
}

const GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3 md:grid-rows-2",
  5: "grid-cols-2 md:grid-cols-4 md:grid-rows-2",
};

/**
 * The property's photographs as a mosaic — one large, four small — rather
 * than every upload stacked down the page. The fifth tile carries a
 * "+N photos" cover when there are more; every tile opens the viewer.
 *
 * Quality: the tiles go through next/image at 95 (resized to the tile, so
 * the page stays light), but the full-screen viewer shows the ORIGINAL
 * upload, not a re-encoded copy. Uploads are stored untouched, so what the
 * broker uploaded is exactly what a buyer sees when they look closely.
 */
export function PropertyGallery({ images, title }: { images: PublicImage[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  const step = useCallback(
    (dir: -1 | 1) =>
      setOpenIndex((prev) => (prev === null ? prev : (prev + dir + count) % count)),
    [count]
  );

  useModalLock(
    openIndex !== null,
    useCallback(() => setOpenIndex(null), [])
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    // Keep the current thumbnail in view in the strip.
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-thumb="${openIndex}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, step]);

  if (count === 0) return null;

  const tiles = images.slice(0, tileCount(count));
  const hidden = count - tiles.length;
  const single = count === 1;
  const layout = tiles.length;

  return (
    <>
      <div className={`grid gap-2 md:gap-3 ${GRID[layout]}`}>
        {tiles.map((img, i) => {
          const isLead = i === 0;
          const isLast = i === tiles.length - 1 && hidden > 0;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Open photo ${i + 1} of ${count}`}
              className={`group relative cursor-zoom-in overflow-hidden bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                layout === 1
                  ? "aspect-[16/9]"
                  : layout === 2
                    ? "aspect-[4/3]"
                    : isLead
                      ? "col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto"
                      : // A phone shows the lead and two tiles, the second
                        // carrying the "+N" cover.
                        `aspect-[4/3] ${i === 1 || i === layout - 1 ? "" : "max-md:hidden"}`
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${title} — photo ${i + 1}`}
                fill
                priority={isLead}
                sizes={
                  isLead || layout < 3
                    ? "(min-width: 768px) 60vw, 100vw"
                    : "(min-width: 768px) 25vw, 50vw"
                }
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
              />
              {isLast && (
                <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white transition-colors group-hover:bg-black/45">
                  <span className="font-serif text-h3 leading-none">+{hidden}</span>
                  <span className="text-eyebrow mt-2 font-sans font-semibold uppercase tracking-[0.18em]">
                    View all {count}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!single && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setOpenIndex(0)}
            className="text-eyebrow inline-flex cursor-pointer items-center gap-2 border border-border bg-white px-4 py-2.5 font-sans font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-gold"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            All {count} photos
          </button>
        </div>
      )}

      <AnimatePresence>
        {openIndex !== null && (
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} photos`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-50 flex flex-col bg-[#0d0c0b]/97 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between px-5 py-4 md:px-8">
              <span className="font-sans text-meta tabular-nums text-cream/70">
                {openIndex + 1} / {count}
              </span>
              <span className="hidden max-w-[50vw] truncate font-serif text-body text-cream/90 md:block">
                {title}
              </span>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                aria-label="Close photos"
                className="cursor-pointer p-2 text-cream/80 transition-colors hover:text-cream"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 md:px-20">
              {/* The original file, not a next/image copy: full resolution,
                  never re-encoded. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={images[openIndex].id}
                src={images[openIndex].url}
                alt={images[openIndex].alt || `${title} — photo ${openIndex + 1}`}
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
              {count > 1 && (
                <>
                  <ArrowButton dir={-1} onClick={() => step(-1)} />
                  <ArrowButton dir={1} onClick={() => step(1)} />
                </>
              )}
            </div>

            {count > 1 && (
              <div ref={stripRef} className="flex gap-2 overflow-x-auto px-5 py-4 md:justify-center md:px-8">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    data-thumb={i}
                    onClick={() => setOpenIndex(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === openIndex ? "true" : undefined}
                    className={`relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden transition-opacity ${
                      i === openIndex ? "opacity-100 outline outline-2 outline-gold" : "opacity-45 hover:opacity-80"
                    }`}
                  >
                    <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ArrowButton({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === -1 ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-cream backdrop-blur-sm transition-colors hover:bg-white/20 ${
        dir === -1 ? "left-3 md:left-6" : "right-3 md:right-6"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d={dir === -1 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
