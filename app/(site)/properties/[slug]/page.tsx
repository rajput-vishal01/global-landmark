import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ContactForm } from "@/components/ContactForm";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { ListingCard, propertySpecs } from "@/components/ui/ListingCard";
import { getPropertyBySlug, listProperties } from "@/lib/db/queries";
import { categoryLabel } from "@/lib/categories";
import { formatArea } from "@/lib/attributes";
import { whatsAppHref } from "@/lib/whatsapp";
import { COMPANY, PROPERTY_DETAIL } from "@/lib/data";
import { optimizedImage } from "@/lib/images";
import { canonical, jsonLdHtml } from "@/lib/seo";

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
  const ogImages = property.images[0]
    ? [{ url: optimizedImage(property.images[0].url, 1200) }]
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
  const specs = propertySpecs(property);
  const similar = (await listProperties({ category: property.category }))
    .filter((p) => p.id !== property.id)
    .slice(0, 3);
  const whatsApp = whatsAppHref(
    `${PROPERTY_DETAIL.whatsAppMessagePrefix} ${property.title}.`
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
      ["Facing", property.facing],
      ["Possession", property.possessionStatus],
      ["Furnishing", property.furnishing],
    ] as [string, string | null | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const amenities = property.amenities ?? [];
  const extras = property.extras ?? [];

  // RealEstateListing wrapping the Residence — `broker` is not valid on a
  // Place type, and the listing type is what property search features read.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: canonical(`/properties/${property.slug}`),
    image: property.images.map((img) => optimizedImage(img.url, 1200)),
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
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <Header />
      <main>
        {/* Hero — photography leads, type stays out of the way */}
        <section className="relative flex min-h-[88vh] flex-col justify-end overflow-hidden bg-dark-deep">
          {cover && (
            <Image
              src={optimizedImage(cover.url, 2000)}
              alt={cover.alt || property.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          />
          <div className="relative px-5 pb-16 pt-40 md:px-12 md:pb-20">
            <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
            <p data-reveal className="text-eyebrow font-sans font-medium uppercase tracking-[0.25em] text-cream/70">
              {categoryLabel(property.category)}
              {property.project ? ` · ${property.project.name}` : ""}
            </p>
            <h1 data-reveal className="mt-4 max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
              {property.title}
            </h1>
            <p data-reveal className="mt-5 max-w-xl text-pretty text-body font-sans text-cream/80">
              {property.location}
              {specs ? ` — ${specs}` : ""}
            </p>
          </div>
        </section>

        {/* Spec sheet beside content — big.dk metadata-sidebar pattern */}
        <section className="grid grid-cols-1 gap-14 px-5 py-20 md:grid-cols-[1.7fr_1fr] md:gap-20 md:px-12 md:py-28">
          <div className="flex flex-col gap-16">
            <div>
              <span data-reveal className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                The Residence
              </span>
              <div data-reveal className="mt-6 flex max-w-2xl flex-col gap-5">
                {property.description
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, i) => (
                    <p key={i} className="text-pretty text-body font-sans leading-relaxed text-ink">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {amenities.length > 0 && (
              <div>
                <span data-reveal className="mb-6 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Amenities
                </span>
                <ul data-reveal className="flex max-w-2xl flex-wrap gap-2.5">
                  {amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="border border-border bg-white px-3.5 py-2 font-sans text-meta text-ink"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {extras.length > 0 && (
              <div>
                <span data-reveal className="mb-6 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Particulars
                </span>
                <dl data-reveal className="max-w-2xl">
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
              </div>
            )}

            {gallery.length > 0 && (
              <div>
                <span data-reveal className="mb-6 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Gallery
                </span>
                <GalleryLightbox images={gallery} title={property.title} />
              </div>
            )}
          </div>

          <aside className="md:sticky md:top-28 md:self-start">
            <div data-reveal className="border border-border bg-white p-8 md:p-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
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
              <p className="mt-6 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                {PROPERTY_DETAIL.sidebarNote}
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <a
                  href="#inquire"
                  className="text-eyebrow inline-flex justify-center bg-ink px-7 py-4 text-center font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
                >
                  Request Details
                </a>
                <a
                  href={whatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-eyebrow inline-flex justify-center border border-ink/25 px-7 py-4 text-center font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </aside>
        </section>

        {/* Inquiry */}
        <section id="inquire" className="border-t border-border bg-white px-5 py-20 md:px-12 md:py-28">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-[1fr_1.4fr] md:gap-24">
            <div className="md:sticky md:top-32 md:self-start">
              <h2 data-reveal className="max-w-sm text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
                {PROPERTY_DETAIL.inquiryHeading}
              </h2>
              <p data-reveal className="mt-5 max-w-sm text-pretty text-body font-sans text-ink-muted">
                Reference {property.title}. {PROPERTY_DETAIL.inquirySub}
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        {similar.length > 0 && (
          <section className="px-5 py-20 md:px-12 md:py-28">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <h2 data-reveal className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
                Also Represented
              </h2>
              <Link
                data-reveal
                href={`/properties?category=${property.category}`}
                className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
              >
                View all {categoryLabel(property.category).toLowerCase()} listings
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <div key={p.id} data-reveal>
                  <ListingCard property={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
