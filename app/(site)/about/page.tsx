import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/Button";
import {
  PageHeader,
  SectionHeading,
  SECTION,
  SECTION_BAND,
} from "../_components/page-chrome";
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

const MILESTONES = ABOUT_PAGE.milestones;
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

        {/* History: chronology with a hairline spine */}
        <section className={SECTION_BAND}>
          <SectionHeading eyebrow="Track record" title={ABOUT_PAGE.historyHeading} />
          <ol className="flex flex-col">
            {MILESTONES.map((m) => (
              <li
                key={m.year}
                className="grid grid-cols-1 gap-4 border-b border-border py-8 last:border-b-0 md:grid-cols-[160px_1fr_2fr] md:gap-10"
              >
                <span className="font-serif text-h4 leading-none text-gold-deep">
                  {m.year}
                </span>
                <h3 className="font-serif text-h4 text-heading">{m.title}</h3>
                <p className="max-w-xl text-pretty text-body font-sans text-ink-muted">
                  {m.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Principals */}
        <section className={SECTION}>
          <SectionHeading
            eyebrow="The principals"
            title={ABOUT_PAGE.principalsHeading}
            aside={ABOUT_PAGE.principalsNote}
          />
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:max-w-2xl md:gap-8">
            {PRINCIPALS.map((person) => (
              <figure key={person.name} className="flex flex-col gap-5">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={person.image}
                    alt={`Portrait of ${person.name}`}
                    fill
                    sizes="(min-width: 640px) 40vw, 100vw"
                    className="object-cover grayscale"
                  />
                </div>
                <figcaption>
                  <p className="font-serif text-h4 text-heading">{person.name}</p>
                  <p className="mt-1 text-meta font-sans text-ink-muted">
                    {person.title}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* The record: quiet definition list on the chrome navy */}
        <section className="bg-navy px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              tone="dark"
              eyebrow="By the numbers"
              title={ABOUT_PAGE.recordHeading}
            />
            <dl className="flex flex-col">
              {RECORD.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-6 border-b border-cream/15 py-5 last:border-b-0"
                >
                  <dt className="text-body font-sans text-cream/60">{row.label}</dt>
                  <dd className="font-serif text-h3 text-cream">{row.value}</dd>
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
