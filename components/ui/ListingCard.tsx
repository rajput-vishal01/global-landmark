import Image from "next/image";
import Link from "next/link";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";
import {
  POSSESSION_STATUSES,
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

/**
 * Inline SVG rather than an icon package: three glyphs do not justify a
 * dependency, and these ship inside the RSC payload with no extra request.
 * All three are drawn on the same 24 grid at the same stroke weight so they
 * sit on one optical line with the label beside them.
 */
const SPEC_ICONS = {
  bed: (
    <>
      <path d="M2 18v-6h20v6" />
      <path d="M2 12V6" />
      <path d="M6 12v-2h5v2" />
      <path d="M2 18v2M22 18v2" />
    </>
  ),
  bath: (
    <>
      <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3z" />
      <path d="M6 12V6a2 2 0 0 1 4 0" />
      <path d="M6 19l-1 2M18 19l1 2" />
    </>
  ),
  area: (
    <>
      <path d="M3 3h18v18H3z" />
      <path d="M9 15l6-6M15 9h-4M15 9v4" />
    </>
  ),
} as const;

type SpecIcon = keyof typeof SPEC_ICONS;
type Spec = { icon: SpecIcon; label: string };

/**
 * The card's own spec list. `propertySpecs()` above stays the flat text
 * summary the detail page uses; this is the scannable version, which is
 * what makes a portal card readable at a glance.
 */
function cardSpecs(property: PublicPropertyWithMedia): Spec[] {
  const specs: Spec[] = [];
  // Same preference propertySpecs() makes: "3+1 BHK" beats "3 Beds".
  const bedLabel =
    property.configuration ||
    (property.beds != null
      ? `${property.beds} Bed${property.beds === 1 ? "" : "s"}`
      : "");
  if (bedLabel) specs.push({ icon: "bed", label: bedLabel });
  if (property.baths != null) {
    specs.push({
      icon: "bath",
      label: `${property.baths} Bath${property.baths === 1 ? "" : "s"}`,
    });
  }
  if (property.areaValue != null) {
    specs.push({ icon: "area", label: formatArea(property.areaValue, property.areaUnit) });
  }
  return specs;
}

function SpecRow({ specs }: { specs: Spec[] }) {
  if (specs.length === 0) return null;
  return (
    <ul className="text-meta flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-ink-muted">
      {specs.map((spec) => (
        <li key={spec.icon} className="flex items-center gap-1.5">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 shrink-0 text-gold-deep"
          >
            {SPEC_ICONS[spec.icon]}
          </svg>
          {spec.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The public face of `possessionStatus`. Deliberately NOT the admin's
 * StatusBadge: that one renders the internal listing status (Available /
 * Reserved / Sold), which by R-07 never reaches a visitor. This renders
 * build stage, which is the thing a buyer actually scans a portal for.
 */
function PossessionBadge({ status }: { status: string }) {
  return (
    <span className="text-eyebrow border border-gold/60 bg-white/95 px-2.5 py-1 font-sans font-semibold uppercase tracking-[0.12em] text-gold-deep">
      {status}
    </span>
  );
}

const PIN = (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="h-3.5 w-3.5 shrink-0"
  >
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const ARROW = (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Everything both layouts derive from a property, computed once. */
function cardModel(property: PublicPropertyWithMedia) {
  const collection = collectionOf(property.propertyType, property.kind);
  const possession =
    // A stale or hand-edited value must not render as a badge.
    property.possessionStatus &&
    (POSSESSION_STATUSES as readonly string[]).includes(property.possessionStatus)
      ? property.possessionStatus
      : null;
  return {
    cover: property.images[0],
    specs: cardSpecs(property),
    badge: collection
      ? collectionLabel(collection)
      : property.kind === "project"
        ? "Project"
        : "Property",
    // Society/project name augments the location rather than replacing it —
    // a buyer scans for "where" first, "which building" second.
    projectName: property.project?.name || property.society,
    possession,
    // R-05/R-07: no reference code on the card — refCode is internal only.
    priceLabel:
      property.publicPrice != null ? formatIndianShort(property.publicPrice) : "Price on request",
    // "Starts from" is only honest for a listing that covers several units —
    // a whole project, or a unit offered in more than one configuration.
    startsFrom:
      property.publicPrice != null &&
      (property.kind === "project" || (property.configurations?.length ?? 0) > 1),
  };
}

type CardModel = ReturnType<typeof cardModel>;

/** The photograph with its badges and the enquiry toggle — shared by both layouts. */
function CardImage({
  property,
  model,
  sizes,
  className,
  children,
}: {
  property: PublicPropertyWithMedia;
  model: CardModel;
  sizes: string;
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden bg-ink/5 ${className}`}>
      {model.cover && (
        <Image
          src={model.cover.url}
          alt={model.cover.alt || property.title}
          fill
          // Above Next's default of 75: these are the photographs a buyer
          // judges a listing on. Allowed values live in next.config.ts.
          quality={90}
          sizes={sizes}
          className="img-zoom"
        />
      )}
      {/* One positioned row, so long badges wrap instead of sliding under
          the enquiry toggle. */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-eyebrow max-w-full truncate bg-navy/90 px-2.5 py-1 font-sans font-semibold uppercase tracking-[0.14em] text-cream backdrop-blur-sm">
            {model.badge}
          </span>
          {model.possession && <PossessionBadge status={model.possession} />}
        </div>
        <EnquiryToggleButton
          item={toEnquiryCartItem(property)}
          className="text-eyebrow pointer-events-auto shrink-0 rounded-full bg-white/95 px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-cta hover:text-cta-ink"
        />
      </div>
      {children}
    </div>
  );
}

function Price({ model, tone }: { model: CardModel; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <span className="flex flex-col leading-tight">
      {model.startsFrom && (
        <span
          className={`text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] ${
            dark ? "text-cream/75" : "text-ink-muted"
          }`}
        >
          Starts from
        </span>
      )}
      <span className={`whitespace-nowrap font-serif text-h4 ${dark ? "text-white" : "text-heading"}`}>
        {model.priceLabel}
      </span>
    </span>
  );
}

function Location({ property, model }: { property: PublicPropertyWithMedia; model: CardModel }) {
  return (
    <p className="text-eyebrow flex items-center gap-1.5 font-sans font-semibold uppercase tracking-[0.14em] text-gold-deep">
      {PIN}
      <span className="truncate">
        {locationLine(property)}
        {model.projectName ? ` · ${model.projectName}` : ""}
      </span>
    </p>
  );
}

/**
 * Listing card, redesigned (Sep 2026).
 *
 * Grid: the price sits on the photograph over a soft fade, so the two facts
 * a buyer scans a portal for — what it looks like and what it costs — read
 * in one glance; under it, where, what, and the spec icons, then one quiet
 * "View details" line. List: a real horizontal card — photograph, then the
 * story (location, title, project, a two-line description, specs), then a
 * price column with the actions.
 *
 * The whole card is the link; the enquiry toggle stops its own click.
 */
export function ListingCard({
  property,
  variant = "grid",
  className = "",
}: {
  property: PublicPropertyWithMedia;
  /** `list` lays the card out horizontally for the listing page's list view. */
  variant?: "grid" | "list";
  className?: string;
}) {
  const model = cardModel(property);
  const href = `/properties/${property.slug}`;
  const frame =
    "group flex overflow-hidden border border-border bg-white transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_24px_48px_-28px_rgba(40,30,15,0.45)]";

  if (variant === "list") {
    return (
      <Link href={href} className={`${frame} flex-col md:flex-row ${className}`}>
        <CardImage
          property={property}
          model={model}
          sizes="(min-width: 768px) 22rem, 100vw"
          className="aspect-[4/3] shrink-0 md:aspect-auto md:w-[22rem] md:min-h-[15rem]"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 md:p-7">
          <Location property={property} model={model} />
          <h3 className="font-serif text-h3 leading-snug text-heading transition-colors duration-300 group-hover:text-gold-deep">
            {property.title}
          </h3>
          {property.description && (
            <p className="line-clamp-2 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
              {property.description}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
            <SpecRow specs={model.specs} />
            {property.propertyType && (
              <span className="text-meta border-l border-border pl-5 font-sans text-ink-muted">
                {property.propertyType}
              </span>
            )}
          </div>
        </div>

        {/* Price column: a clear endpoint to each row, the way a portal list
            reads — scan down the right edge and compare. */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-border bg-surface/60 p-5 md:w-64 md:flex-col md:items-start md:justify-center md:border-l md:border-t-0 md:p-7">
          <Price model={model} tone="light" />
          <span className="text-eyebrow inline-flex shrink-0 items-center gap-2 whitespace-nowrap bg-cta px-5 py-3 font-sans font-bold uppercase tracking-[0.14em] text-cta-ink transition-colors group-hover:bg-cta-hover">
            View details
            {ARROW}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className={`${frame} flex-col ${className}`}>
      <CardImage
        property={property}
        model={model}
        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 42vw, 100vw"
        className="aspect-[4/3]"
      >
        {/* The fade that carries the price: legible on any photograph. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
        />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
          <Price model={model} tone="dark" />
          {property.propertyType && (
            <span className="text-eyebrow shrink-0 border border-white/40 bg-white/10 px-2.5 py-1 font-sans font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              {property.propertyType}
            </span>
          )}
        </div>
      </CardImage>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <Location property={property} model={model} />
        <h3 className="line-clamp-2 font-serif text-h4 leading-snug text-heading transition-colors duration-300 group-hover:text-gold-deep">
          {property.title}
        </h3>
        <SpecRow specs={model.specs} />
        <span className="text-eyebrow mt-auto inline-flex items-center gap-2 border-t border-border pt-4 font-sans font-bold uppercase tracking-[0.16em] text-ink transition-colors duration-300 group-hover:text-gold-deep">
          View details
          {ARROW}
        </span>
      </div>
    </Link>
  );
}
