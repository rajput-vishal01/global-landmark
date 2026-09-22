import Image from "next/image";
import Link from "next/link";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";
import { categoryLabel } from "@/lib/categories";
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
 *
 * A launch is the one stage worth accenting, and gold stays a rule here —
 * a border and a text colour, never a fill.
 */
const POSSESSION_ACCENT: Record<string, string> = {
  "New Launch": "border-gold text-gold-deep",
};

function PossessionBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-eyebrow border bg-surface/95 px-2.5 py-1 font-sans font-medium uppercase tracking-[0.14em] ${
        POSSESSION_ACCENT[status] ?? "border-border text-ink"
      }`}
    >
      {status}
    </span>
  );
}

/** Shared chip for the type / category / PLC tag row. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-meta border border-border px-2 py-0.5 font-sans text-ink-muted">
      {children}
    </span>
  );
}

/**
 * Portal card: framed, tight, and with one obvious way in.
 *
 * The redesign traded the tall editorial 4:5 crop for a 4:3 one and pulled
 * the copy in under a hairline frame. That is worth roughly a third of a
 * card's height, which is the whole point — the client's complaint was that
 * three listings filled a screen where the reference fits nine. Nothing was
 * dropped to buy the space: badge, specs, tags and price all still render.
 *
 * The "Details" chip is the portal affordance the card was missing. The
 * whole card is already the link, so the chip is a span that fills yellow
 * on card hover rather than a second, nested anchor.
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
  const isList = variant === "list";
  const cover = property.images[0];
  const specs = cardSpecs(property);
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
  // A stale or hand-edited value must not render as a badge, so the status
  // shows only while it is still one of the taxonomy's own.
  const possession =
    property.possessionStatus &&
    (POSSESSION_STATUSES as readonly string[]).includes(property.possessionStatus)
      ? property.possessionStatus
      : null;
  // R-05/R-07: no reference code on the card — refCode is internal only.
  const priceLabel =
    property.publicPrice != null
      ? formatIndianShort(property.publicPrice)
      : "Price on request";
  // "Starts from" is only honest for a listing that covers several units —
  // a whole project, or a unit offered in more than one configuration. On a
  // single resale flat it would understate a price that is already fixed.
  const startsFrom =
    property.publicPrice != null &&
    (property.kind === "project" || (property.configurations?.length ?? 0) > 1);

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={`group flex border border-border bg-surface transition-colors duration-300 hover:border-gold ${
        isList ? "flex-col sm:flex-row" : "flex-col"
      } ${className}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-ink/5 ${
          isList ? "aspect-[4/3] sm:w-64" : "aspect-[4/3]"
        }`}
      >
        {cover && (
          <Image
            src={cover.url}
            alt={cover.alt || property.title}
            fill
            // Above Next's default of 75. These are the photographs a buyer
            // judges a listing on, and the default was visibly softening them.
            // Allowed values are declared in next.config.ts's images.qualities.
            quality={90}
            sizes={
              isList
                ? "(min-width: 640px) 16rem, 100vw"
                : "(min-width: 1024px) 30vw, (min-width: 768px) 42vw, 100vw"
            }
            className="img-zoom"
          />
        )}
        {/* One positioned row, not two independently-positioned corners.
            The badges and the enquiry toggle were each absolutely placed
            (left-3 / right-3) with no shared layout, so on a card whose
            badges ran long — "Kothi" plus "Ready to Move" — the pair slid
            under the toggle and the text collided. Laying them out as a
            single justify-between row means the two groups can never
            occupy the same space: the badges wrap or truncate, and the
            toggle keeps its width via shrink-0. */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="text-eyebrow max-w-full truncate bg-navy/85 px-2.5 py-1 font-sans font-medium uppercase tracking-[0.16em] text-cream backdrop-blur-sm">
              {badge}
            </span>
            {possession && <PossessionBadge status={possession} />}
          </div>
          <EnquiryToggleButton
            item={toEnquiryCartItem(property)}
            className="text-eyebrow pointer-events-auto shrink-0 bg-navy/85 px-2.5 py-1 font-sans font-medium uppercase tracking-[0.16em] text-cream backdrop-blur-sm transition-colors hover:bg-navy-deep"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-1.5 p-4 pb-3">
          <h3 className="font-serif text-h4 leading-snug text-heading">{property.title}</h3>
          <p className="text-meta font-sans text-ink-muted">
            {locationLine(property)}
            {projectName ? ` · ${projectName}` : ""}
          </p>

          <SpecRow specs={specs} />

          <div className="flex flex-wrap gap-1.5">
            {property.propertyType && <Tag>{property.propertyType}</Tag>}
            <Tag>{categoryLabel(property.category)}</Tag>
            {plc.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>

        {/* Price and the way in share one footer rule, so every card in a
            grid lands its price on the same line however tall the copy
            above it runs. */}
        <div className="flex items-end justify-between gap-3 border-t border-border px-4 py-3">
          <span className="flex flex-col leading-tight">
            {startsFrom && (
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted">
                Starts from
              </span>
            )}
            <span className="font-sans text-body font-semibold text-ink">
              {priceLabel}
            </span>
          </span>
          <span className="text-eyebrow border border-ink/20 px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 group-hover:border-cta group-hover:bg-cta group-hover:text-cta-ink">
            Details
          </span>
        </div>
      </div>
    </Link>
  );
}
