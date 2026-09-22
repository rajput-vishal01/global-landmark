"use client";

import { useState } from "react";
import type { PublicImage } from "@/lib/db/public-columns";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";

/**
 * Gallery / Map switch above the fold.
 *
 * The map is the footer's pattern: a Google Maps embed as a preview, with
 * the whole frame a link to the Google Maps link the admin pasted. The
 * embed takes no API key, and a pasted share link (maps.app.goo.gl/…)
 * cannot itself be embedded, so the preview is searched from coordinates
 * when the link carries them and from the address when it does not.
 *
 * `mapsUrl` is null unless the admin pasted a link; then there is no Map
 * button at all.
 */
export function GalleryMapToggle({
  images,
  title,
  location,
  mapsUrl,
}: {
  images: PublicImage[];
  title: string;
  location: string;
  mapsUrl: string | null;
}) {
  const [view, setView] = useState<"gallery" | "map">(images.length ? "gallery" : "map");
  const showMap = mapsUrl !== null && view === "map";

  return (
    <div className="flex flex-col gap-6">
      {mapsUrl && images.length > 0 && (
        <div className="flex gap-3">
          <ToggleButton
            isActive={view === "gallery"}
            onClick={() => setView("gallery")}
            label="Gallery"
          />
          <ToggleButton
            isActive={view === "map"}
            onClick={() => setView("map")}
            label="Map"
          />
        </div>
      )}

      {showMap ? (
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-cream sm:aspect-[16/9]">
            <iframe
              src={embedSrc(mapsUrl, location)}
              title={`Map showing the location of ${title}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
              className="pointer-events-none h-full w-full"
            />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group absolute inset-0 flex items-end justify-end p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold"
            >
              <span className="text-eyebrow inline-flex items-center gap-2 bg-ink px-4 py-2.5 font-sans font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-cta group-hover:text-cta-ink">
                Open in Google Maps
                <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </span>
            </a>
          </div>
          <p className="font-sans text-meta text-ink-muted">{location}</p>
        </div>
      ) : (
        images.length > 0 && <GalleryLightbox images={images} title={title} />
      )}
    </div>
  );
}

/** Coordinates in the link ("@30.71,76.80" or "q=30.71,76.80") win over the address. */
function embedSrc(mapsUrl: string, location: string): string {
  const coords = mapsUrl.match(/[@=](-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  const q = coords ? `${coords[1]},${coords[2]}` : location;
  return `https://www.google.com/maps?${new URLSearchParams({ q, output: "embed" })}`;
}

function ToggleButton({
  isActive,
  onClick,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`text-eyebrow cursor-pointer border px-5 py-2.5 font-sans font-medium uppercase tracking-[0.15em] transition-colors ${
        isActive
          ? "border-gold text-ink"
          : "border-border text-ink-muted hover:border-ink/25 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
