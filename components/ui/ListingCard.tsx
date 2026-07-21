import Image from "next/image";
import Link from "next/link";
import type { PropertyWithImages } from "@/lib/db/schema";
import { categoryLabel } from "@/lib/categories";
import { formatArea } from "@/lib/attributes";
import { optimizedImage } from "@/lib/images";

export function propertySpecs(property: PropertyWithImages): string {
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
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ListingCard({
  property,
  className = "",
}: {
  property: PropertyWithImages;
  className?: string;
}) {
  const cover = property.images[0];
  const specs = propertySpecs(property);

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={`group flex flex-col gap-4 ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
        {cover && (
          <Image
            src={optimizedImage(cover.url, 800)}
            alt={cover.alt || property.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 42vw, 100vw"
            className="img-zoom"
          />
        )}
        <span className="text-eyebrow absolute left-4 top-4 bg-dark-deep/70 px-3 py-1.5 font-sans font-medium uppercase tracking-[0.2em] text-cream backdrop-blur-sm">
          {property.kind === "project" ? "Project" : "Property"}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-h4 text-ink">{property.title}</h3>
        <p className="text-meta font-sans text-ink-muted">
          {property.location}
          {property.project && !property.location.includes(property.project.name)
            ? ` · ${property.project.name}`
            : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
            {categoryLabel(property.category)}
          </span>
          {specs && (
            <span className="text-meta font-sans text-ink-muted">{specs}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
