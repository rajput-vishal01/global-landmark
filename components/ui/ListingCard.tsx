import Image from "next/image";
import Link from "next/link";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";
import { categoryLabel } from "@/lib/categories";
import {
  collectionOf,
  collectionLabel,
  formatArea,
  formatIndianShort,
} from "@/lib/attributes";
import { EnquiryToggleButton } from "@/components/EnquiryToggleButton";
import { toEnquiryCartItem } from "@/lib/enquiry-cart-item";

export function propertySpecs(property: PublicPropertyWithMedia): string {
  return [
    // Configuration ("3+1 BHK") reads better than bare bed counts when set.
    property.configuration ||
      [
        property.beds != null && `${property.beds} Bd`,
        property.baths != null && `${property.baths} Ba`,
      ]
        .filter(Boolean)
        .join(" · "),
    property.areaValue != null && formatArea(property.areaValue, property.areaUnit),
    property.possessionStatus,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Locality + sector reads better than the free-text address line on a card. */
function locationLine(property: PublicPropertyWithMedia): string {
  return (
    [property.locality, property.sector].filter(Boolean).join(", ") ||
    property.location
  );
}

export function ListingCard({
  property,
  className = "",
}: {
  property: PublicPropertyWithMedia;
  className?: string;
}) {
  const cover = property.images[0];
  const specs = propertySpecs(property);
  const collection = collectionOf(property.propertyType, property.kind);
  const badge = collection
    ? collectionLabel(collection)
    : property.kind === "project"
      ? "Project"
      : "Property";
  // Society/project name augments the locality line rather than replacing
  // it — a buyer scans for "where" first, "which building" second.
  const projectName = property.project?.name || property.society;
  const plc = property.plcAttributes ?? [];
  // R-05/R-07: no reference code on the card — refCode is internal only.
  const priceLabel =
    property.publicPrice != null
      ? formatIndianShort(property.publicPrice)
      : "Price on request";

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={`group flex flex-col gap-4 ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
        {cover && (
          <Image
            src={cover.url}
            alt={cover.alt || property.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 42vw, 100vw"
            className="img-zoom"
          />
        )}
        <span className="text-eyebrow absolute left-4 top-4 bg-dark-deep/70 px-3 py-1.5 font-sans font-medium uppercase tracking-[0.2em] text-cream backdrop-blur-sm">
          {badge}
        </span>
        <EnquiryToggleButton
          item={toEnquiryCartItem(property)}
          className="text-eyebrow absolute right-4 top-4 z-10 bg-dark-deep/70 px-3 py-1.5 font-sans font-medium uppercase tracking-[0.2em] text-cream backdrop-blur-sm transition-colors hover:bg-dark-deep/90"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-h4 text-ink">{property.title}</h3>
        <p className="text-meta font-sans text-ink-muted">
          {locationLine(property)}
          {projectName ? ` · ${projectName}` : ""}
        </p>
        {specs && <p className="text-meta font-sans text-ink-muted">{specs}</p>}

        {plc.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {plc.map((tag) => (
              <span
                key={tag}
                className="text-meta border border-border px-2 py-0.5 font-sans text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-2">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
            {categoryLabel(property.category)}
          </span>
          <span className="font-sans text-body font-medium text-ink">
            {priceLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
