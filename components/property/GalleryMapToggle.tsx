"use client";

import { useState } from "react";
import type { PublicImage } from "@/lib/db/public-columns";
import type { PublicMapPin } from "@/lib/db/property-detail";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";

/**
 * Gallery / Map switch above the fold (Phase E).
 *
 * The map is an OpenStreetMap embed — a plain <iframe>, no Leaflet, no map
 * library. A static frame with one marker is all a buyer needs here, and
 * adding a pannable JS map would ship a dependency and its tile plumbing to
 * every property page for a pin.
 *
 * `pin` arrives already gated: lib/db/property-detail.ts selects the
 * coordinates only when `showMapPublicly` is true, so a null pin here means
 * the coordinates were never sent to the browser at all. This component
 * cannot render a map for a listing whose pin is unpublished, because it is
 * not given one — the Map button simply does not exist.
 */
export function GalleryMapToggle({
  images,
  title,
  location,
  pin,
}: {
  images: PublicImage[];
  title: string;
  location: string;
  pin: PublicMapPin | null;
}) {
  const [view, setView] = useState<"gallery" | "map">("gallery");
  const showMap = pin !== null && view === "map";

  return (
    <div className="flex flex-col gap-6">
      {pin && (
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
          <iframe
            // The bbox is ~1.3 km across and the marker sits at coordinates
            // already rounded to ~110 m upstream: an area, not a doorstep.
            src={osmEmbedSrc(pin)}
            title={`Map showing the approximate location of ${title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="aspect-[4/3] w-full border border-border bg-cream sm:aspect-[16/9]"
          />
          <p className="font-sans text-meta text-ink-muted">
            Approximate location — {location}. Exact address is shared on enquiry.
          </p>
        </div>
      ) : (
        images.length > 0 && <GalleryLightbox images={images} title={title} />
      )}
    </div>
  );
}

function osmEmbedSrc({ latitude, longitude }: PublicMapPin): string {
  const dLat = 0.006;
  const dLng = 0.008;
  const bbox = [
    longitude - dLng,
    latitude - dLat,
    longitude + dLng,
    latitude + dLat,
  ].join(",");
  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
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
