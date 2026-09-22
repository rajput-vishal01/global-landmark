import Image from "next/image";
import Link from "next/link";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";
import {
  POSSESSION_STATUSES,
  collectionOf,
  collectionLabel,
  formatArea,
  formatIndianShort,
  headlineArea,
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
    areaLabel(property),
    property.possessionStatus,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function areaLabel(property: PublicPropertyWithMedia): string | null {
  const area = headlineArea(property);
  return area ? formatArea(area.value, area.unit) : null;
}

/** Locality + sector reads better than the free-text address line on a card. */
function locationLine(property: PublicPropertyWithMedia): string {
  return (
    [property.locality, property.sector].filter(Boolean).join(", ") ||
    property.location
  );
}

type SpecIcon = "bed" | "bath" | "area";
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
  const area = areaLabel(property);
  if (area) specs.push({ icon: "area", label: area });
  return specs;
}

/** Ease with weight: settles rather than stops. */
const MOTION = "duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]";

const PIN = (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-3.5 w-3.5 shrink-0"
  >
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const ARROW = (
  <svg
    aria-hidden
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`transition-transform ${MOTION} group-hover:translate-x-1`}
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Everything the card derives from a property, computed once. */
function cardModel(property: PublicPropertyWithMedia) {
  const collection = collectionOf(property.propertyType, property.kind);
  const projectName = property.project?.name || property.society;
  return {
    cover: property.images[0],
    badge: collection
      ? collectionLabel(collection)
      : property.kind === "project"
        ? "Project"
        : "Property",
    // Society/project name augments the location rather than replacing it —
    // a buyer scans for "where" first, "which building" second.
    where: `${locationLine(property)}${projectName ? ` · ${projectName}` : ""}`,
    // One plain line of facts; on a photograph, chips would be clutter.
    facts: cardSpecs(property)
      .map((s) => s.label)
      .join(" · "),
    // A stale or hand-edited value must not render.
    possession:
      property.possessionStatus &&
      (POSSESSION_STATUSES as readonly string[]).includes(property.possessionStatus)
        ? property.possessionStatus
        : null,
    // R-05/R-07: no reference code on the card — refCode is internal only.
    priceLabel:
      property.publicPrice != null ? formatIndianShort(property.publicPrice) : "Price on request",
    hasPrice: property.publicPrice != null,
    // "Starts from" is only honest for a listing that covers several units.
    startsFrom:
      property.publicPrice != null &&
      (property.kind === "project" || (property.configurations?.length ?? 0) > 1),
  };
}

/**
 * Listing card, immersive (Sep 2026, the client's pick of three directions).
 * One card for the landing page, the listings grid, the list view and area
 * pages.
 *
 * The photograph fills the card; everything a buyer scans for sits in white
 * over a dark fade at its foot — build stage, title, where, the facts, the
 * price. On a pointer device a "View details" bar slides up on hover; on
 * touch, where there is no hover, it is simply always there. Across the top:
 * the listing's kind and the enquiry toggle, nothing else.
 *
 * `list` is the same card as a wide banner, one per row, with room for the
 * description.
 */
export function ListingCard({
  property,
  variant = "grid",
  className = "",
}: {
  property: PublicPropertyWithMedia;
  /** `list` renders the card as a wide banner for the listing page's list view. */
  variant?: "grid" | "list";
  className?: string;
}) {
  const m = cardModel(property);
  const isList = variant === "list";

  return (
    <Link
      href={`/properties/${property.slug}`}
      className={`group relative isolate block overflow-hidden bg-dark-deep shadow-[0_24px_48px_-30px_rgba(20,15,10,0.6)] transition-shadow ${MOTION} hover:shadow-[0_36px_70px_-30px_rgba(20,15,10,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
        isList ? "aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/8]" : "aspect-[4/5]"
      } ${className}`}
    >
      {m.cover && (
        <Image
          src={m.cover.url}
          alt={m.cover.alt || property.title}
          fill
          // Above Next's default of 75: these are the photographs a buyer
          // judges a listing on. Allowed values live in next.config.ts.
          quality={90}
          sizes={
            isList
              ? "(min-width: 1024px) 90vw, 100vw"
              : "(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
          }
          className="-z-10 object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
        />
      )}

      {/* The fade that carries the text: heavy at the foot, gone by the top,
          and a whisper at the top edge so the tags read on a bright sky. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.6)_32%,rgba(0,0,0,0)_62%),linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_22%)] ${
          isList
            ? "sm:bg-[linear-gradient(to_right,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.5)_38%,rgba(0,0,0,0)_68%),linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0)_22%)]"
            : ""
        }`}
      />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        <span className="text-eyebrow border border-white/35 bg-black/25 px-2.5 py-1 font-sans font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-[2px]">
          {m.badge}
        </span>
        <EnquiryToggleButton
          icon
          item={toEnquiryCartItem(property)}
          className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/25 text-white backdrop-blur-[2px] transition-colors ${MOTION} hover:border-cta hover:bg-cta hover:text-cta-ink aria-pressed:border-cta aria-pressed:bg-cta aria-pressed:text-cta-ink`}
        />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col p-5 md:p-6 ${
          isList ? "sm:inset-y-0 sm:right-auto sm:w-[min(36rem,70%)] sm:justify-end sm:p-8" : ""
        }`}
      >
        {m.possession && (
          <span className="text-eyebrow mb-2 flex items-center gap-2 font-sans font-semibold uppercase tracking-[0.2em] text-cta">
            <span aria-hidden className="h-px w-6 bg-cta" />
            {m.possession}
          </span>
        )}
        <h3
          className={`text-balance font-serif leading-tight text-white ${
            isList ? "text-h3" : "line-clamp-2 text-[1.45rem]"
          }`}
        >
          {property.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 font-sans text-meta text-white/80">
          {PIN}
          <span className="truncate">{m.where}</span>
        </p>
        {m.facts && <p className="mt-1 font-sans text-meta text-white/70">{m.facts}</p>}
        {isList && property.description && (
          <p className="mt-3 line-clamp-2 hidden text-pretty font-sans text-meta leading-relaxed text-white/70 sm:block">
            {property.description}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/20 pt-4">
          <span className="flex flex-col leading-tight">
            {m.startsFrom && (
              <span className="text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] text-white/65">
                Starts from
              </span>
            )}
            <span
              className={`whitespace-nowrap font-serif text-white ${
                m.hasPrice ? "text-[1.6rem] leading-none" : "text-body"
              }`}
            >
              {m.priceLabel}
            </span>
          </span>
          {/* Always shown on touch; on a pointer device it rises on hover. */}
          <span
            className={`text-eyebrow inline-flex items-center gap-2 bg-cta px-4 py-2.5 font-sans font-bold uppercase tracking-[0.14em] text-cta-ink transition-[opacity,transform] ${MOTION} [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:translate-y-0 [@media(hover:hover)]:group-focus-visible:opacity-100`}
          >
            View details
            {ARROW}
          </span>
        </div>
      </div>
    </Link>
  );
}
