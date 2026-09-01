import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FoundersMessage } from "@/components/sections/FoundersMessage";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionHeading, SECTION } from "../_components/page-chrome";
import { ABOUT_PAGE, COMPANY } from "@/lib/data";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "About";
const PAGE_DESCRIPTION = `The group behind ${COMPANY.legalName} — its history, principals, and the standard it holds across the Tricity.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/about"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

const PRINCIPALS = ABOUT_PAGE.principals;
const RECORD = ABOUT_PAGE.record;

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Who we are"
          title={ABOUT_PAGE.title}
          aside={
            <dl className="flex gap-10 md:flex-col md:gap-5 md:text-right">
              {ABOUT_PAGE.facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-eyebrow font-sans uppercase tracking-[0.2em] text-cream/50">
                    {label}
                  </dt>
                  <dd className="mt-1 font-serif text-h4 text-cream">{value}</dd>
                </div>
              ))}
            </dl>
          }
        />

        {/* Ethos: full-bleed image, then two-column editorial prose */}
        <section className={SECTION}>
          <div className="relative h-[45vh] overflow-hidden md:h-[60vh]">
            <Image
              src={ABOUT_PAGE.ethosImage}
              alt={ABOUT_PAGE.ethosImageAlt}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="mx-auto mt-14 max-w-5xl md:mt-20">
            <SectionHeading eyebrow="Our ethos" title={ABOUT_PAGE.ethosHeading} />
            <div className="gap-12 text-pretty text-body font-sans text-ink-muted md:columns-2">
              {ABOUT_PAGE.ethosParagraphs.map((paragraph, i) => (
                <p key={i} className={i > 0 ? "mt-6" : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Founders: a full profile each, not a portrait with a job title.
            These are the two people a client actually deals with, and the
            client supplied their own words — so the section is set as an
            article per founder rather than a card grid. */}
        <section className={SECTION}>
          <SectionHeading
            eyebrow="The founders"
            title={ABOUT_PAGE.principalsHeading}
            aside={ABOUT_PAGE.principalsNote}
          />
          <div className="flex flex-col gap-16 md:gap-24">
            {PRINCIPALS.map((person) => (
              <article
                key={person.name}
                className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr] md:gap-14"
              >
                <div className="flex flex-col gap-5">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={person.image}
                      alt={`Portrait of ${person.name}`}
                      fill
                      sizes="(min-width: 768px) 300px, 100vw"
                      className="object-cover grayscale"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-h4 text-heading">{person.name}</h3>
                    <p className="mt-1 text-meta font-sans text-gold-deep">
                      {person.title}
                    </p>
                    <p className="mt-2 text-meta font-sans text-ink-muted">
                      {person.credentials}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {person.bio.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-pretty text-body font-sans leading-relaxed text-ink"
                    >
                      {paragraph}
                    </p>
                  ))}
                  <blockquote className="mt-2 border-l-2 border-gold pl-6 text-pretty font-serif text-h4 leading-snug text-heading">
                    &ldquo;{person.quote}&rdquo;
                  </blockquote>
                </div>
              </article>
            ))}
          </div>
        </section>

        <FoundersMessage />

        {/* The record: quiet definition list on the chrome navy */}
        <section className="bg-surface px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              eyebrow="By the numbers"
              title={ABOUT_PAGE.recordHeading}
            />
            <dl className="flex flex-col">
              {RECORD.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-6 border-b border-border py-5 last:border-b-0"
                >
                  <dt className="text-body font-sans text-ink-muted">{row.label}</dt>
                  <dd className="font-serif text-h3 text-heading">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Quiet closing line */}
        <section className={`text-center ${SECTION}`}>
          <p className="mx-auto max-w-2xl text-balance font-serif text-h3 leading-snug text-heading">
            {ABOUT_PAGE.closingLine}
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/contact" variant="primary">
              {ABOUT_PAGE.closingCta}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
