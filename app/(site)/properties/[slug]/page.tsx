import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ContactForm } from "@/components/ContactForm";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { ListingCard, propertySpecs } from "@/components/ui/ListingCard";
import { EnquiryToggleButton } from "@/components/EnquiryToggleButton";
import { EmiCalculator } from "@/components/EmiCalculator";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { AreaConverter } from "@/components/AreaConverter";
import { GalleryMapToggle } from "@/components/property/GalleryMapToggle";
import { PropertyTabs, type PropertyTab } from "@/components/property/PropertyTabs";
import { TourRequestForm } from "@/components/property/TourRequestForm";
import { amenityIcon } from "@/components/amenity-icons";
import {
  PageHeader,
  SectionHeading,
  SECTION,
  SECTION_BAND,
} from "../../_components/page-chrome";
import { toEnquiryCartItem } from "@/lib/enquiry-cart-item";
import { getPropertyBySlug, listProperties } from "@/lib/db/queries";
import { getPropertyDetailExtras } from "@/lib/db/property-detail";
import { categoryLabel } from "@/lib/categories";
import { AMENITY_GROUPS, formatArea, formatIndianShort } from "@/lib/attributes";
import { isAreaUnit } from "@/lib/taxonomy/area";
import { rankSimilar } from "@/lib/similar";
import { whatsAppHref, whatsAppShareHref, propertyShareMessage } from "@/lib/whatsapp";
import { COMPANY, PROPERTY_DETAIL } from "@/lib/data";
import { breadcrumbJsonLd, canonical, jsonLdHtml } from "@/lib/seo";

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
  // SERPs truncate around 60-65 chars; admin titles are unbounded.
  const title = `${property.title} — ${property.location}`.slice(0, 65);
  const description =
    property.description.slice(0, 160) ||
    `${categoryLabel(property.category)} in ${property.location}.`;
  // Absolute: uploaded images are same-origin paths, and a social crawler
  // has no origin to resolve them against.
  const ogImages = property.images[0]
    ? [{ url: canonical(property.images[0].url) }]
    : undefined;
  // Both blocks set explicitly: a page that overrides openGraph but not
  // twitter would inherit the homepage's generic Twitter card.
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: COMPANY.legalName,
      title,
      description,
      url: canonical(path),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

const EYEBROW =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted";

/** One titled block inside a tab panel — the repeated eyebrow + body pair. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <span className={`mb-6 block ${EYEBROW}`}>{title}</span>
      {children}
    </div>
  );
}

/** The pill used for every "this listing has X" tag row. */
const TAG =
  "border border-border bg-white px-3.5 py-2 font-sans text-meta text-ink";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const cover = property.images[0];
  const gallery = property.images.slice(1);
  const floorPlans = property.images.filter((img) => img.mediaKind === "floor_plan");
  const specs = propertySpecs(property);
  // Phase E. Three reads gated in SQL rather than at render time: the map
  // pin exists here only when `showMapPublicly` is true, and a document only
  // when its own `isPublic` is true. See lib/db/property-detail.ts — this
  // page has no way to obtain either without the broker having said so.
  const { unitSizes, documents, mapPin } = await getPropertyDetailExtras(property.id);
  // R-45: rank the whole published pool on locality → configuration →
  // budget instead of taking the three newest listings that happen to share
  // a category. One unfiltered listProperties() call, which is the same
  // cache entry /properties already warms, rather than a second filtered
  // query per detail page.
  const similar = rankSimilar(property, await listProperties(), 3);
  const whatsApp = whatsAppHref(
    `${PROPERTY_DETAIL.whatsAppMessagePrefix} ${property.title}.`
  );
  // R-44: forward-to-a-friend. Deliberately a different URL shape from
  // `whatsApp` above — that one messages us, this one opens the visitor's
  // own contact picker.
  const shareHref = whatsAppShareHref(
    propertyShareMessage({
      title: property.title,
      location: property.location,
      specs,
      publicPrice: property.publicPrice,
      url: canonical(`/properties/${property.slug}`),
    })
  );

  const facts = (
    [
      ["Category", categoryLabel(property.category)],
      ["Listing", property.kind === "project" ? "Project / Society" : "Individual Unit"],
      ["Type", property.propertyType],
      ["Configuration", property.configuration],
      ["Project", property.project?.name],
      ["Builder", property.project?.builderName],
      ["RERA", property.project?.reraNumber],
      ["Location", property.location],
      ["Bedrooms", property.beds != null ? String(property.beds) : null],
      ["Bathrooms", property.baths != null ? String(property.baths) : null],
      [
        "Area",
        property.areaValue != null
          ? formatArea(property.areaValue, property.areaUnit)
          : null,
      ],
    ] as [string, string | null | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  // R-13: the figure is already resolved server-side (null unless the
  // listing is flagged showPricePublicly) — never a raw price to gate here.
  const priceLabel =
    property.publicPrice != null ? formatIndianShort(property.publicPrice) : "Price on request";

  // R-25: the two-column spec table. Facing/possession/age join the CFF
  // group-20 measures here rather than the quick-facts sidebar, so they
  // aren't listed twice.
  const specRows = (
    [
      ["Facing", property.facing],
      ["Possession", property.possessionStatus],
      ["Property Age", property.propertyAge],
      ["Road Width", property.roadWidth != null ? `${property.roadWidth} ft` : null],
      ["Entrance Width", property.entranceWidth != null ? `${property.entranceWidth} ft` : null],
      ["Ceiling Height", property.ceilingHeight != null ? `${property.ceilingHeight} ft` : null],
      ["Corner Property", property.isCorner ? "Yes" : null],
      ["Park Facing", property.isParkFacing ? "Yes" : null],
    ] as [string, string | null | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  // R-21: compact legal strip — only flags actually ticked, never a table
  // row for an absent one.
  const legalFlags = property.legalFlags ?? [];

  // R-22: grouped amenities — a group only earns a heading when at least
  // one of its items is actually on this listing.
  const amenities = property.amenities ?? [];
  const amenityGroups = AMENITY_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => amenities.includes(item)),
  })).filter((group) => group.items.length > 0);
  // Free-typed amenities belong to no group. Previously they were simply
  // dropped from the page — the grid renders them under "Other" instead,
  // with the fallback glyph.
  const ungrouped = amenities.filter(
    (item) => !AMENITY_GROUPS.some((group) => group.items.includes(item))
  );

  // R-16: inventory only means something once a furnishing level is set.
  const furnishingInventory = property.furnishingInventory ?? [];

  // R-20: loan is a selling point, the circle-rate comparison stays internal
  // (and isn't on this public type at all).
  const loanFlags = property.loanFlags ?? [];
  const banksOnPanel = property.banksOnPanel ?? [];

  // R-23
  const parkingTypes = property.parkingTypes ?? [];

  // R-05 / PLC highlights — small tag row near the hero.
  const plcAttributes = property.plcAttributes ?? [];

  // `extras` is the {title, description}[] the admin fills in freely; on the
  // reference portal this is the "Highlights" block (RERA ID, tower count,
  // club size). Same data, a name a buyer understands.
  const extras = property.extras ?? [];

  // R-28: link media splits into a video/tour strip and a separate
  // map/brochure link row. No iframe for these: next.config.ts's CSP
  // frame-src allowlists only youtube-nocookie, instagram and
  // openstreetmap, so an embed of an arbitrary pasted link would silently
  // render nothing. Outbound links work regardless of host.
  const media = property.media ?? [];
  const tourMedia = media.filter((m) => m.kind === "video" || m.kind === "drone" || m.kind === "virtual_tour");
  const linkMedia = media.filter((m) => m.kind === "google_map" || m.kind === "brochure");
  const MEDIA_LABELS: Record<string, string> = {
    video: "Watch Video",
    drone: "Drone Footage",
    virtual_tour: "Virtual Tour",
    google_map: "View on Google Maps",
    brochure: "Download Brochure",
  };

    // The enquiry rail. Every control in it has to be the same full-width
  // block, and two of them open a third-party app in a new tab, which the
  // Link-based <Button> cannot express — so the rail keeps plain anchors and
  // uses the CTA tokens directly. One yellow action, the rest quiet.
  const RAIL_PRIMARY =
    "text-eyebrow inline-flex justify-center bg-cta px-7 py-4 text-center font-sans font-semibold uppercase tracking-[0.2em] text-cta-ink transition-colors duration-200 hover:bg-cta-hover";
  const RAIL_SECONDARY =
    "text-eyebrow inline-flex justify-center border border-border px-7 py-4 text-center font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold";

  const LINK_BUTTON =
    "text-eyebrow inline-flex items-center gap-2 border border-border px-5 py-3 font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold";

  // The tab panels. Built as values rather than inline JSX so the tab list
  // below can simply drop any panel with nothing in it — a listing with no
  // amenities should not offer an empty Amenities tab.
  const descriptionPanel = (
    <div className="flex flex-col gap-16">
      <div className="flex max-w-2xl flex-col gap-5">
        {property.description
          .split(/\n+/)
          .filter(Boolean)
          .map((paragraph, i) => (
            <p key={i} className="text-pretty text-body font-sans leading-relaxed text-ink">
              {paragraph}
            </p>
          ))}
      </div>

      {extras.length > 0 && (
        <Block title="Highlights">
          <dl className="max-w-2xl">
            {extras.map((extra) => (
              <div
                key={extra.title}
                className="flex flex-col gap-1 border-t border-border py-4 first:border-t-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <dt className="text-eyebrow shrink-0 font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                  {extra.title}
                </dt>
                <dd className="font-sans text-body text-ink sm:text-right">
                  {extra.description}
                </dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {specRows.length > 0 && (
        <Block title="Specifications">
          <dl className="grid max-w-2xl grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            {specRows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1.5 border-t border-border pt-4">
                <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                  {label}
                </dt>
                <dd className="font-sans text-body text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {(legalFlags.length > 0 || property.reraNumber) && (
        <Block title="Legal Status">
          <div className="flex max-w-2xl flex-wrap items-center gap-3 border border-border bg-white px-6 py-5">
            {legalFlags.map((flag) => (
              <span
                key={flag}
                className="text-eyebrow border border-gold/40 px-3 py-1.5 font-sans font-medium tracking-[0.12em] text-gold-deep"
              >
                {flag}
              </span>
            ))}
            {property.reraNumber && (
              <span className="font-sans text-meta text-ink-muted">
                RERA No. {property.reraNumber}
              </span>
            )}
          </div>
        </Block>
      )}

      {(property.furnishing || furnishingInventory.length > 0) && (
        <Block title="Furnishing">
          <div className="max-w-2xl">
            {property.furnishing && (
              <p className="font-serif text-h4 text-heading">{property.furnishing}</p>
            )}
            {furnishingInventory.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {furnishingInventory.map((item) => (
                  <li key={item} className={TAG}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Block>
      )}

      {(parkingTypes.length > 0 || property.parkingSlots != null) && (
        <Block title="Parking">
          <p className="max-w-2xl font-sans text-body text-ink">
            {parkingTypes.join(" · ")}
            {property.parkingSlots != null
              ? `${parkingTypes.length > 0 ? " — " : ""}${property.parkingSlots} slot${property.parkingSlots === 1 ? "" : "s"}`
              : ""}
          </p>
        </Block>
      )}

      {(loanFlags.length > 0 || banksOnPanel.length > 0) && (
        <Block title="Financing">
          <div className="max-w-2xl">
            {loanFlags.length > 0 && (
              <ul className="flex flex-wrap gap-2.5">
                {loanFlags.map((flag) => (
                  <li key={flag} className={TAG}>
                    {flag}
                  </li>
                ))}
              </ul>
            )}
            {banksOnPanel.length > 0 && (
              <p className="mt-4 font-sans text-body text-ink-muted">
                Panel: {banksOnPanel.join(", ")}
              </p>
            )}
          </div>
        </Block>
      )}

      {/* R-41. Unconditional, unlike the Financing block above: the loan
          flags are admin-entered and usually absent, but the buyer's "what
          would this cost me a month" question is not. */}
      <Block title="EMI Calculator">
        <EmiCalculator publicPrice={property.publicPrice} />
      </Block>

      {linkMedia.length > 0 && (
        <Block title="Location & Documents">
          <div className="flex max-w-2xl flex-wrap gap-3">
            {linkMedia.map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_BUTTON}
              >
                {m.label || MEDIA_LABELS[m.kind] || "View Link"} ↗
              </a>
            ))}
          </div>
        </Block>
      )}
    </div>
  );

  const layoutPanel = (
    <div className="flex flex-col gap-16">
      {unitSizes.length > 0 && (
        <Block title="Unit Sizes">
          {/* Its own scroll container — a three-column table must never be
              what makes the page scroll sideways on a phone. */}
          <div className="max-w-2xl overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[26rem] text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Unit", "Area", "Price"].map((h) => (
                    <th
                      key={h}
                      className="text-eyebrow px-5 py-3.5 font-sans font-medium uppercase tracking-[0.15em] text-ink-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unitSizes.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3.5 font-sans text-body text-ink">
                      {row.unitLabel}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-meta tabular-nums text-ink">
                      {row.areaValue != null
                        ? formatArea(row.areaValue, row.areaUnit ?? "sqft")
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-meta tabular-nums text-ink">
                      {/* Unlike the demand price, a unit-size figure is the
                          advertised starting price and is public by nature —
                          there is no per-row flag to consult. */}
                      {row.price != null ? formatIndianShort(row.price) : "On request"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}

      {floorPlans.length > 0 && (
        <Block title="Layout Plans">
          <GalleryLightbox images={floorPlans} title={`${property.title} layout plans`} />
        </Block>
      )}
    </div>
  );

  const amenitiesPanel = (
    <div className="flex flex-col gap-12">
      {[...amenityGroups, ...(ungrouped.length ? [{ label: "Other", items: ungrouped }] : [])].map(
        (group) => (
          <div key={group.label}>
            <span className="mb-6 block font-sans text-meta font-medium uppercase tracking-[0.15em] text-ink-muted">
              {group.label}
            </span>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
              {group.items.map((amenity) => (
                <li key={amenity} className="flex flex-col gap-3">
                  <span className="text-gold-deep">{amenityIcon(amenity)}</span>
                  <span className="font-sans text-meta text-ink">{amenity}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );

  const videoPanel = (
    <div className="flex max-w-2xl flex-wrap gap-3">
      {tourMedia.map((m) => (
        <a
          key={m.id}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_BUTTON}
        >
          {m.label || MEDIA_LABELS[m.kind] || "View Link"} ↗
        </a>
      ))}
    </div>
  );

  const tourPanel = (
    <div className="flex flex-col gap-8">
      <p className="max-w-xl text-pretty text-body font-sans text-ink-muted">
        Pick a slot and we will confirm it by phone. In-person visits are
        accompanied; a video call works when you are out of the Tricity.
      </p>
      <TourRequestForm propertyId={property.id} propertyTitle={property.title} />
    </div>
  );

  const tabs: PropertyTab[] = [
    { id: "description", label: "Description", panel: descriptionPanel },
    ...(unitSizes.length > 0 || floorPlans.length > 0
      ? [{ id: "layout", label: "Layout Plans", panel: layoutPanel }]
      : []),
    ...(amenityGroups.length > 0 || ungrouped.length > 0
      ? [{ id: "amenities", label: "Amenities", panel: amenitiesPanel }]
      : []),
    ...(tourMedia.length > 0 ? [{ id: "video", label: "Video", panel: videoPanel }] : []),
    { id: "tour", label: "Schedule a Tour", panel: tourPanel },
  ];

  // RealEstateListing wrapping the Residence — `broker` is not valid on a
  // Place type, and the listing type is what property search features read.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: canonical(`/properties/${property.slug}`),
    image: property.images.map((img) => canonical(img.url)),
    provider: {
      "@type": "RealEstateAgent",
      name: COMPANY.legalName,
      url: canonical("/"),
    },
    about: {
      "@type": "Residence",
      name: property.title,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.location,
        addressCountry: "IN",
      },
      ...(property.beds != null ? { numberOfRooms: property.beds } : {}),
      // Coordinates go into structured data only when the broker published
      // the pin — the same gate as the visible map, because JSON-LD is just
      // as public as a rendered element and is read by more crawlers.
      ...(mapPin
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: mapPin.latitude,
              longitude: mapPin.longitude,
            },
          }
        : {}),
    },
    // Only when the listing is flagged for public pricing — the withheld
    // figure must never leave the database, structured data included.
    ...(property.publicPrice != null
      ? {
          offers: {
            "@type": "Offer",
            price: property.publicPrice,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  // Home > Properties > [title] — matches the crawlable path a visitor
  // actually clicks through, not an aspirational category hierarchy. Shared
  // between the JSON-LD below and the visible <Breadcrumbs> in the hero.
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: property.title, path: `/properties/${property.slug}` },
  ];
  const breadcrumbLd = breadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd) }}
      />
      <Header />
      <main>
        <PageHeader
          breadcrumbs={breadcrumbItems}
          image={cover ? { src: cover.url, alt: cover.alt || property.title } : null}
          eyebrow={`${categoryLabel(property.category)}${property.project ? ` · ${property.project.name}` : ""}`}
          title={property.title}
          sub={`${property.location}${specs ? ` — ${specs}` : ""}`}
        >
          {plcAttributes.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {plcAttributes.map((attr) => (
                <span
                  key={attr}
                  className="text-eyebrow border border-cream/30 px-3 py-1.5 font-sans tracking-[0.15em] text-cream/90"
                >
                  {attr}
                </span>
              ))}
            </div>
          )}
        </PageHeader>

        {/* Gallery / Map, above the tabs — the reference portal's first
            decision after the hero is "show me the photos or show me where
            this is", and it should not be buried under the copy. */}
        {(gallery.length > 0 || mapPin) && (
          <section className="px-5 pt-14 md:px-12 md:pt-20">
            <GalleryMapToggle
              images={gallery}
              title={property.title}
              location={property.location}
              pin={mapPin}
            />
          </section>
        )}

        {/* Tabs beside the enquiry rail — big.dk metadata-sidebar pattern */}
        <section className={`grid grid-cols-1 gap-14 md:grid-cols-[1.7fr_1fr] md:gap-20 ${SECTION}`}>
          <PropertyTabs tabs={tabs} />

          <aside className="md:sticky md:top-28 md:self-start">
            <div className="border border-border bg-white p-8 md:p-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <div className="mb-7 border-b border-border pb-7">
                <span className={EYEBROW}>Price</span>
                <p className="mt-2 font-serif text-h3 text-heading">{priceLabel}</p>
              </div>
              <dl className="flex flex-col">
                {facts.map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex items-baseline justify-between gap-6 py-3.5 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                      {label}
                    </dt>
                    <dd className="break-words text-right font-sans text-meta text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              {/* R-40: inline area-unit converter, only when we have a real
                  value + a recognised unit to convert from. */}
              {property.areaValue != null && isAreaUnit(property.areaUnit) && (
                <AreaConverter value={property.areaValue} unit={property.areaUnit} />
              )}
              <p className="mt-6 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                {PROPERTY_DETAIL.sidebarNote}
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <a href="#inquire" className={RAIL_PRIMARY}>
                  Request Details
                </a>
                <a href={COMPANY.phoneHref} className={RAIL_SECONDARY}>
                  Call {COMPANY.phone}
                </a>
                <a
                  href={whatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={RAIL_SECONDARY}
                >
                  Chat on WhatsApp
                </a>
                <EnquiryToggleButton
                  item={toEnquiryCartItem(property)}
                  className={RAIL_SECONDARY}
                />
                {/* R-44. A plain link, not a client component: wa.me opens
                    the contact picker on mobile and WhatsApp Web on desktop,
                    so this needs zero JavaScript to work everywhere. */}
                <a
                  href={shareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-eyebrow inline-flex justify-center py-1 text-center font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
                >
                  Share this property
                </a>
              </div>

              {/* Published documents only. `documents` comes back from a
                  query with `isPublic = true` in its WHERE clause, so a
                  registry paper or a sale deed is not in this array to
                  render — the block simply does not appear. */}
              {documents.length > 0 && (
                <div className="mt-7 border-t border-border pt-7">
                  <span className={EYEBROW}>Downloads</span>
                  <ul className="mt-4 flex flex-col gap-3">
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
        </section>

        {/* Inquiry */}
        <section id="inquire" className={SECTION_BAND}>
          <div className="grid grid-cols-1 gap-14 md:grid-cols-[1fr_1.4fr] md:gap-24">
            <div className="md:sticky md:top-32 md:self-start">
              <p className="text-eyebrow mb-3 font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
                Enquire
              </p>
              <h2 className="max-w-sm text-balance font-serif text-h3 text-heading">
                {PROPERTY_DETAIL.inquiryHeading}
              </h2>
              <p className="mt-5 max-w-sm text-pretty text-body font-sans text-ink-muted">
                Reference {property.title}. {PROPERTY_DETAIL.inquirySub}
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        {similar.length > 0 && (
          <section className={SECTION}>
            <SectionHeading
              eyebrow="Comparable stock"
              title="Also represented"
              aside={
                <Link
                  href={`/properties?category=${property.category}`}
                  className="font-sans transition-colors hover:text-ink"
                >
                  View all {categoryLabel(property.category).toLowerCase()} listings
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <div key={p.id}>
                  <ListingCard property={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* R-45. Records this view and renders the visitor's own history,
            minus the listing they are already on. */}
        <RecentlyViewed record={toEnquiryCartItem(property)} />

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
