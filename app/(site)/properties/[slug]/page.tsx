import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ContactForm } from "@/components/ContactForm";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { ListingCard, areaLabel, propertySpecs } from "@/components/ui/ListingCard";
import { EnquiryToggleButton } from "@/components/EnquiryToggleButton";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { AreaConverter } from "@/components/AreaConverter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { SectionNav } from "@/components/property/SectionNav";
import { TourRequestForm } from "@/components/property/TourRequestForm";
import { FormDialog } from "@/components/property/FormDialog";
import { amenityIcon } from "@/components/amenity-icons";
import { SectionHeading, SECTION } from "../../_components/page-chrome";
import { toEnquiryCartItem } from "@/lib/enquiry-cart-item";
import { getPropertyBySlug, listProperties } from "@/lib/db/queries";
import { getPropertyDetailExtras } from "@/lib/db/property-detail";
import { categoryLabel } from "@/lib/categories";
import {
  AMENITY_GROUPS,
  POSSESSION_STATUSES,
  collectionLabel,
  collectionOf,
  formatArea,
  formatIndianShort,
  headlineArea,
} from "@/lib/attributes";
import { isAreaUnit } from "@/lib/taxonomy/area";
import { rankSimilar } from "@/lib/similar";
import { whatsAppHref, whatsAppShareHref, propertyShareMessage } from "@/lib/whatsapp";
import { COMPANY, PROPERTY_DETAIL } from "@/lib/data";
import { resolveCompany } from "@/lib/site-settings";
import { breadcrumbJsonLd, canonical, jsonLdHtml, OG_DEFAULTS, ORG_ID } from "@/lib/seo";
import { listingDescription, listingTitle, photoAlt } from "@/lib/page-meta";
import { isCity } from "@/lib/locations";
import { propertiesHref } from "@/lib/properties-url";

// ISR: cached and served instantly; admin edits bust the cache on save.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Not found", robots: { index: false } };
  const path = `/properties/${property.slug}`;
  // Built from the listing's facts (type, BHK, society, place) to fit 60
  // characters with the site suffix; admin titles are unbounded.
  const area = areaLabel(property);
  const title = listingTitle(property, area);
  const description = listingDescription(property, area);
  // The cover photo — a floor plan makes a poor preview — else the branded
  // card. Absolute: uploads are same-origin paths, and a social crawler has
  // no origin to resolve them against.
  const cover = property.images.find((img) => img.mediaKind !== "floor_plan") ?? property.images[0];
  const ogImages = cover ? [{ url: canonical(cover.url) }] : OG_DEFAULTS.images;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OG_DEFAULTS,
      type: "website",
      title,
      description,
      url: canonical(path),
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title, description, images: ogImages },
  };
}

const EYEBROW = "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-gold-deep";
const CHIP = "border border-border bg-white px-3.5 py-2 font-sans text-meta text-ink";
/** Anchored sections clear the site header plus the sticky jump bar. */
const ANCHOR = "scroll-mt-36";

const RAIL_PRIMARY =
  "text-eyebrow inline-flex w-full justify-center bg-cta px-6 py-[1.125rem] text-center font-sans font-bold uppercase tracking-[0.18em] text-cta-ink transition-colors duration-200 hover:bg-cta-hover";
const RAIL_SECONDARY =
  "text-eyebrow inline-flex w-full items-center justify-center gap-2 border border-border px-6 py-4 text-center font-sans font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-gold";
const LINK_BUTTON =
  "text-eyebrow inline-flex items-center gap-2 border border-border bg-white px-5 py-3 font-sans font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold";

const MEDIA_LABELS: Record<string, string> = {
  video: "Watch video",
  drone: "Drone footage",
  virtual_tour: "Virtual tour",
  google_map: "View on Google Maps",
  brochure: "Download brochure",
};

/** The schema.org type of the unit a listing sells, for the JSON-LD. Plots are a plain Place. */
const SCHEMA_UNIT_TYPE: Record<string, "Apartment" | "House"> = {
  "Flat/Apartment": "Apartment",
  Penthouse: "Apartment",
  "Independent House": "House",
  Villa: "House",
};

/** One content section of the page: eyebrow, serif title, then the body. */
function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${ANCHOR} border-t border-border pt-12 first:border-t-0 first:pt-0`}>
      <p className={EYEBROW}>{eyebrow}</p>
      <h2 className="mt-2 mb-8 font-serif text-h3 text-heading">{title}</h2>
      {children}
    </section>
  );
}

/** Google's keyless embed: coordinates in the pasted link win over the address. */
function mapEmbedSrc(mapsUrl: string, location: string): string {
  const coords = mapsUrl.match(/[@=](-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  const q = coords ? `${coords[1]},${coords[2]}` : location;
  return `https://www.google.com/maps?${new URLSearchParams({ q, output: "embed" })}`;
}

const PIN = (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0">
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

/**
 * The property page (Sep 2026 redesign).
 *
 * A graphite header carrying the title, the key facts and the price; the
 * photographs as a five-tile mosaic with a full-screen viewer behind it
 * (never every upload stacked down the page); then one scrolling page of
 * sections — overview, details, amenities, plans, location — with a sticky
 * jump bar, beside a sticky enquiry card. The two forms (book a visit,
 * request details) open in a dialog from their buttons, never inline. Every section renders
 * only when the listing has something to put in it.
 */
export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const company = await resolveCompany();
  // A document arrives here only when its own `isPublic` is true — gated in
  // SQL, see lib/db/property-detail.ts.
  const { unitSizes, documents } = await getPropertyDetailExtras(property.id);
  // R-45: ranked on locality → configuration → budget, from the same cached
  // pool /properties already warms.
  const similar = rankSimilar(property, await listProperties(), 3);
  const cityListings = property.city && isCity(property.city) ? property.city : null;

  const specs = propertySpecs(property);
  const headline = headlineArea(property);
  const area = areaLabel(property);
  const floorPlans = property.images.filter((img) => img.mediaKind === "floor_plan");
  const photos = property.images.filter((img) => img.mediaKind !== "floor_plan");
  // Alt text from the listing's facts wherever the broker left it empty, or
  // put the listing's title on every photo, which describes none of them.
  const galleryPhotos = photos.map((img, i) =>
    img.alt && img.alt !== property.title
      ? img
      : { ...img, alt: photoAlt(property, area, i + 1, photos.length) }
  );
  const collection = collectionOf(property.propertyType, property.kind);
  const possession =
    property.possessionStatus &&
    (POSSESSION_STATUSES as readonly string[]).includes(property.possessionStatus)
      ? property.possessionStatus
      : null;

  // R-13: resolved server-side — null unless the listing is flagged public.
  const priceLabel =
    property.publicPrice != null ? formatIndianShort(property.publicPrice) : "Price on request";
  const startsFrom =
    property.publicPrice != null &&
    (property.kind === "project" || (property.configurations?.length ?? 0) > 1);

  const whatsApp = whatsAppHref(`${PROPERTY_DETAIL.whatsAppMessagePrefix} ${property.title}.`, company.phoneHref);
  // R-44: forward-to-a-friend — opens the visitor's own contact picker.
  const shareHref = whatsAppShareHref(
    propertyShareMessage({
      title: property.title,
      location: property.location,
      specs,
      publicPrice: property.publicPrice,
      url: canonical(`/properties/${property.slug}`),
    })
  );

  // The headline facts under the title, as chips.
  const heroFacts = [
    property.propertyType,
    property.configuration,
    area,
    possession,
  ].filter((v): v is string => Boolean(v));

  const details = (
    [
      ["Property type", property.propertyType],
      ["Listing", property.kind === "project" ? "Whole project" : "Single unit"],
      ["For", categoryLabel(property.category)],
      ["Configuration", property.configuration],
      ["Bedrooms", property.beds != null ? String(property.beds) : null],
      ["Bathrooms", property.baths != null ? String(property.baths) : null],
      ["Area", area],
      ["Facing", property.facing],
      ["Possession", possession],
      ["Property age", property.propertyAge],
      ["Furnishing", property.furnishing],
      [
        "Parking",
        [
          (property.parkingTypes ?? []).join(", "),
          property.parkingSlots != null
            ? `${property.parkingSlots} slot${property.parkingSlots === 1 ? "" : "s"}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ") || null,
      ],
      ["Project", property.project?.name],
      ["Builder", property.project?.builderName],
      ["Road width", property.roadWidth != null ? `${property.roadWidth} ft` : null],
      ["Corner property", property.isCorner ? "Yes" : null],
      ["Park facing", property.isParkFacing ? "Yes" : null],
    ] as [string, string | null | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const legalFlags = property.legalFlags ?? [];
  const reraNumber = property.reraNumber ?? property.project?.reraNumber ?? null;
  const loanFlags = property.loanFlags ?? [];
  const banksOnPanel = property.banksOnPanel ?? [];
  const furnishingInventory = property.furnishingInventory ?? [];
  const plcAttributes = property.plcAttributes ?? [];
  const extras = property.extras ?? [];

  // R-22: one grid, in the taxonomy’s group order, free-typed ones last. Group
  // headings are left out: a listing usually has one or two per group, and
  // a heading over a single tile is noise.
  const amenities = property.amenities ?? [];
  const amenityList = [
    ...AMENITY_GROUPS.flatMap((group) => group.items.filter((item) => amenities.includes(item))),
    ...amenities.filter((item) => !AMENITY_GROUPS.some((g) => g.items.includes(item))),
  ];

  // R-28: videos and tours; map and brochure links go with the location.
  const media = property.media ?? [];
  const tourMedia = media.filter((m) => ["video", "drone", "virtual_tour"].includes(m.kind));
  const linkMedia = media.filter((m) => m.kind === "google_map" || m.kind === "brochure");

  const hasPlans = unitSizes.length > 0 || floorPlans.length > 0;
  const hasLocation = Boolean(property.mapsUrl) || linkMedia.length > 0;
  const nav = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    ...(amenityList.length ? [{ id: "amenities", label: "Amenities" }] : []),
    ...(hasPlans ? [{ id: "plans", label: "Plans" }] : []),
    ...(tourMedia.length ? [{ id: "videos", label: "Videos" }] : []),
    ...(hasLocation ? [{ id: "location", label: "Location" }] : []),
  ];

  // Only an Accommodation (Apartment, House) takes room counts in
  // schema.org; a plot is a plain Place and a whole project a Residence.
  const unitType = property.kind === "project" ? undefined : SCHEMA_UNIT_TYPE[property.propertyType ?? ""];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    ...(property.description ? { description: property.description } : {}),
    url: canonical(`/properties/${property.slug}`),
    ...(property.images.length ? { image: property.images.map((img) => canonical(img.url)) } : {}),
    provider: { "@type": "RealEstateAgent", "@id": ORG_ID, name: COMPANY.legalName, url: canonical("/") },
    about: {
      "@type": property.kind === "project" ? "Residence" : (unitType ?? "Place"),
      name: property.title,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.location,
        addressLocality: property.city || property.location,
        addressCountry: "IN",
      },
      ...(unitType && property.beds != null ? { numberOfBedrooms: property.beds } : {}),
      ...(unitType && property.baths != null ? { numberOfBathroomsTotal: property.baths } : {}),
      ...(property.mapsUrl ? { hasMap: property.mapsUrl } : {}),
    },
    // No Offer. Listings go out as "Price on request", and even a published
    // price makes a thin Offer — no sale-or-rent function, no rent period —
    // that says less than the page itself does.
  };
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: property.title, path: `/properties/${property.slug}` },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      <Header />
      <main>
        {/* The header: graphite, no photograph behind it — the photographs
            get their own mosaic directly below, at full strength. */}
        <section className="bg-navy px-5 pb-12 pt-32 md:px-12 md:pb-14 md:pt-40">
          <div>
            <Breadcrumbs items={breadcrumbItems} tone="dark" />
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.24em] text-cta">
                  {[collection ? collectionLabel(collection) : null, property.project?.name]
                    .filter(Boolean)
                    .join(" · ") || categoryLabel(property.category)}
                </p>
                <h1 className="mt-4 text-balance font-serif text-h2 leading-[1.08] text-cream">
                  {property.title}
                </h1>
                <p className="mt-4 flex items-center gap-2 font-sans text-body text-cream/75">
                  {PIN}
                  {property.location}
                </p>
                {(heroFacts.length > 0 || plcAttributes.length > 0) && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {[...heroFacts, ...plcAttributes].map((fact) => (
                      <li
                        key={fact}
                        className="border border-cream/25 bg-white/5 px-3.5 py-1.5 font-sans text-meta text-cream/90"
                      >
                        {fact}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-4 lg:items-end lg:text-right">
                <div>
                  <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-cream/60">
                    {startsFrom ? "Starts from" : "Price"}
                  </p>
                  <p
                    className={`mt-1 font-serif leading-none text-cream ${
                      property.publicPrice != null ? "text-h2" : "text-h3"
                    }`}
                  >
                    {priceLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
<FormDialog
                    label="Book a site visit"
                    className={"text-eyebrow inline-flex items-center bg-cta px-6 py-3.5 font-sans font-bold uppercase tracking-[0.18em] text-cta-ink transition-colors hover:bg-cta-hover"}
                    eyebrow="See it in person"
                    title="Book a site visit"
                    sub={`${property.title}. Pick a day and a time and we will confirm by phone — in person, or a video call if you are outside the Tricity.`}
                  >
                    <TourRequestForm propertyId={property.id} propertyTitle={property.title} />
                  </FormDialog>
                  <EnquiryToggleButton
                    icon
                    item={toEnquiryCartItem(property)}
                    className="flex h-12 w-12 cursor-pointer items-center justify-center border border-cream/30 text-cream transition-colors hover:border-cta hover:text-cta aria-pressed:border-cta aria-pressed:bg-cta aria-pressed:text-cta-ink"
                  />
                  <a
                    href={shareHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share this property on WhatsApp"
                    title="Share"
                    className="flex h-12 w-12 items-center justify-center border border-cream/30 text-cream transition-colors hover:border-cta hover:text-cta"
                  >
                    <svg aria-hidden width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {photos.length > 0 && (
          <section className="bg-surface px-5 pt-8 md:px-12 md:pt-10">
            <div>
              <PropertyGallery images={galleryPhotos} title={property.title} />
            </div>
          </section>
        )}

        {/* A direct child of <main>, so it stays stuck for the whole page. */}
        <SectionNav items={nav} />

        <div className="bg-surface px-5 py-12 md:px-12 md:py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_27rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-20">
            <div className="flex min-w-0 flex-col gap-12">
              <Section id="overview" eyebrow="Overview" title="About this property">
                {property.description ? (
                  <div className="flex max-w-3xl flex-col gap-5">
                    {property.description
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((paragraph, i) => (
                        <p key={i} className="text-pretty text-body font-sans leading-relaxed text-ink">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className="font-sans text-body text-ink-muted">
                    Ask us for the full details — we know this one first-hand.
                  </p>
                )}
                {extras.length > 0 && (
                  <dl className="mt-10 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2">
                    {extras.map((extra) => (
                      <div key={extra.title} className="border-b border-r border-border bg-white px-5 py-4">
                        <dt className="text-eyebrow font-sans font-semibold uppercase tracking-[0.15em] text-ink-muted">
                          {extra.title}
                        </dt>
                        <dd className="mt-1.5 font-sans text-body text-ink">{extra.description}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Section>

              <Section id="details" eyebrow="The facts" title="Property details">
                <dl className="grid grid-cols-2 border-l border-t border-border md:grid-cols-3">
                  {details.map(([label, value]) => (
                    <div key={label} className="border-b border-r border-border bg-white px-5 py-4">
                      <dt className="text-eyebrow font-sans font-semibold uppercase tracking-[0.15em] text-ink-muted">
                        {label}
                      </dt>
                      <dd className="mt-1.5 break-words font-sans text-body text-ink">
                        {/* The unit's own project page: the society's other units, builder and RERA. */}
                        {label === "Project" && property.project ? (
                          <Link
                            href={`/projects/${property.project.slug}`}
                            className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                          >
                            {value}
                          </Link>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                {headline && isAreaUnit(headline.unit) && (
                  <div className="mt-6 max-w-md">
                    <AreaConverter value={headline.value} unit={headline.unit} />
                  </div>
                )}

                {furnishingInventory.length > 0 && (
                  <div className="mt-10">
                    <p className={EYEBROW}>What is included</p>
                    <ul className="mt-4 flex flex-wrap gap-2.5">
                      {furnishingInventory.map((item) => (
                        <li key={item} className={CHIP}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(legalFlags.length > 0 || reraNumber || loanFlags.length > 0 || banksOnPanel.length > 0) && (
                  <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                    {(legalFlags.length > 0 || reraNumber) && (
                      <div className="border border-border bg-white p-6">
                        <p className={EYEBROW}>Legal &amp; approvals</p>
                        <ul className="mt-4 flex flex-col gap-2.5">
                          {legalFlags.map((flag) => (
                            <li key={flag} className="flex items-center gap-2.5 font-sans text-body text-ink">
                              <Check />
                              {flag}
                            </li>
                          ))}
                        </ul>
                        {reraNumber && (
                          <p className="mt-4 font-sans text-meta text-ink-muted">RERA No. {reraNumber}</p>
                        )}
                      </div>
                    )}
                    {(loanFlags.length > 0 || banksOnPanel.length > 0) && (
                      <div className="border border-border bg-white p-6">
                        <p className={EYEBROW}>Home loan</p>
                        <ul className="mt-4 flex flex-col gap-2.5">
                          {loanFlags.map((flag) => (
                            <li key={flag} className="flex items-center gap-2.5 font-sans text-body text-ink">
                              <Check />
                              {flag}
                            </li>
                          ))}
                        </ul>
                        {banksOnPanel.length > 0 && (
                          <p className="mt-4 font-sans text-meta text-ink-muted">
                            Banks on panel: {banksOnPanel.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </Section>

              {amenityList.length > 0 && (
                <Section id="amenities" eyebrow="Living here" title="Amenities">
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {amenityList.map((amenity) => (
                      <li
                        key={amenity}
                        className="flex items-center gap-3 border border-border bg-white px-4 py-3.5"
                      >
                        <span className="shrink-0 text-gold-deep">{amenityIcon(amenity)}</span>
                        <span className="font-sans text-meta text-ink">{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {hasPlans && (
                <Section id="plans" eyebrow="Layouts" title="Plans &amp; unit sizes">
                  {unitSizes.length > 0 && (
                    <div className="overflow-x-auto border border-border bg-white">
                      <table className="w-full min-w-[26rem] text-left">
                        <thead>
                          <tr className="border-b border-border">
                            {["Unit", "Area", "Price"].map((h) => (
                              <th
                                key={h}
                                className="text-eyebrow px-5 py-3.5 font-sans font-semibold uppercase tracking-[0.15em] text-ink-muted"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {unitSizes.map((row) => (
                            <tr key={row.id} className="border-b border-border last:border-b-0">
                              <td className="px-5 py-3.5 font-sans text-body text-ink">{row.unitLabel}</td>
                              <td className="px-5 py-3.5 font-sans text-meta tabular-nums text-ink">
                                {row.areaValue != null ? formatArea(row.areaValue, row.areaUnit ?? "sqft") : "—"}
                              </td>
                              <td className="px-5 py-3.5 font-sans text-meta tabular-nums text-ink">
                                {row.price != null ? formatIndianShort(row.price) : "On request"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {floorPlans.length > 0 && (
                    <div className={unitSizes.length > 0 ? "mt-10" : ""}>
                      <GalleryLightbox images={floorPlans} title={`${property.title} layout plans`} />
                    </div>
                  )}
                </Section>
              )}

              {tourMedia.length > 0 && (
                <Section id="videos" eyebrow="See it moving" title="Videos &amp; tours">
                  <div className="flex flex-wrap gap-3">
                    {tourMedia.map((m) => (
                      <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className={LINK_BUTTON}>
                        {m.label || MEDIA_LABELS[m.kind] || "Watch"} ↗
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {hasLocation && (
                <Section id="location" eyebrow="Where it is" title="Location">
                  {property.mapsUrl && (
                    <div className="relative h-72 w-full overflow-hidden border border-border bg-cream md:h-80">
                      <iframe
                        src={mapEmbedSrc(property.mapsUrl, property.location)}
                        title={`Map showing the location of ${property.title}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        tabIndex={-1}
                        className="pointer-events-none h-full w-full"
                      />
                      <a
                        href={property.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group absolute inset-0 flex items-end justify-end p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold"
                      >
                        <span className="text-eyebrow inline-flex items-center gap-2 bg-ink px-4 py-2.5 font-sans font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-cta group-hover:text-cta-ink">
                          Open in Google Maps ↗
                        </span>
                      </a>
                    </div>
                  )}
                  <p className="mt-4 flex items-center gap-2 font-sans text-body text-ink">
                    <span className="text-gold-deep">{PIN}</span>
                    {property.location}
                  </p>
                  {linkMedia.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {linkMedia.map((m) => (
                        <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className={LINK_BUTTON}>
                          {m.label || MEDIA_LABELS[m.kind] || "Open link"} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </Section>
              )}

            </div>

            {/* The enquiry card: price and every way to act, always in reach. */}
            <aside className="lg:sticky lg:top-36 lg:self-start">
              <div className="border border-border bg-white p-8 shadow-[0_24px_48px_-36px_rgba(40,30,15,0.45)] xl:p-10">
                <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted">
                  {startsFrom ? "Starts from" : "Price"}
                </p>
                <p
                  className={`mt-2 font-serif leading-tight text-heading ${
                    property.publicPrice != null ? "text-h2" : "text-h3"
                  }`}
                >
                  {priceLabel}
                </p>
                {property.publicPrice == null && (
                  <p className="mt-2 text-pretty font-sans text-meta text-ink-muted">
                    {PROPERTY_DETAIL.sidebarNote}
                  </p>
                )}
                {(area || possession) && (
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
                    {area && <MiniFact label="Area" value={area} />}
                    {possession && <MiniFact label="Possession" value={possession} />}
                  </dl>
                )}
                <div className="mt-6 flex flex-col gap-2.5">
<FormDialog
                    label="Book a site visit"
                    className={RAIL_PRIMARY}
                    eyebrow="See it in person"
                    title="Book a site visit"
                    sub={`${property.title}. Pick a day and a time and we will confirm by phone — in person, or a video call if you are outside the Tricity.`}
                  >
                    <TourRequestForm propertyId={property.id} propertyTitle={property.title} />
                  </FormDialog>
                  <FormDialog
                    label="Request details"
                    className={RAIL_SECONDARY}
                    eyebrow="Enquire"
                    title={PROPERTY_DETAIL.inquiryHeading}
                    sub={`About ${property.title}. ${PROPERTY_DETAIL.inquirySub}`}
                  >
                    {/* The listing travels with the enquiry, so the lead in the
                        admin says which property it is about. */}
                    <ContactForm idPrefix="detail-" propertyIds={[property.id]} source="property_page" />
                  </FormDialog>
                  <div className="grid grid-cols-2 gap-2.5">
                    <a href={company.phoneHref} className={RAIL_SECONDARY}>
                      Call
                    </a>
                    <a href={whatsApp} target="_blank" rel="noopener noreferrer" className={RAIL_SECONDARY}>
                      WhatsApp
                    </a>
                  </div>
                  <EnquiryToggleButton item={toEnquiryCartItem(property)} className={RAIL_SECONDARY} />
                </div>
                <p className="mt-4 text-center font-sans text-meta text-ink-muted">
                  or call <a href={company.phoneHref} className="text-ink underline-offset-4 hover:underline">{company.phone}</a>
                </p>

                {/* Published documents only — gated in SQL. */}
                {documents.length > 0 && (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Downloads
                    </p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {documents.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.url}
                            className="flex items-baseline justify-between gap-4 font-sans text-meta text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                          >
                            <span className="min-w-0 break-words">{doc.docType}</span>
                            <span className="shrink-0 tabular-nums text-ink-muted">
                              {Math.max(1, Math.round(doc.sizeBytes / 1024))} KB
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {similar.length > 0 && (
          <section className={SECTION}>
            <div>
              <SectionHeading
                eyebrow="You may also like"
                title="Similar properties"
                aside={
                  // The listing's own city, as a filtered page, when it has a
                  // known one; otherwise the whole portfolio.
                  <Link
                    href={cityListings ? propertiesHref({}, { city: cityListings }) : "/properties"}
                    className="font-sans transition-colors hover:text-ink"
                  >
                    {cityListings ? `More listings in ${cityListings}` : "View all listings"}
                  </Link>
                }
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((p) => (
                  <ListingCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* R-45. Records this view and renders the visitor's own history. */}
        <RecentlyViewed record={toEnquiryCartItem(property)} />

        <CTABand />
      </main>
      <Footer />
    </>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-eyebrow font-sans font-semibold uppercase tracking-[0.15em] text-ink-muted">{label}</dt>
      <dd className="mt-1 font-sans text-meta text-ink">{value}</dd>
    </div>
  );
}

function Check() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gold-deep">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
