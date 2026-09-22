import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FoundersMessage } from "@/components/sections/FoundersMessage";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionHeading } from "../_components/page-chrome";
import { ABOUT_PAGE, COMPANY } from "@/lib/data";
import { canonical, OG_DEFAULTS } from "@/lib/seo";

const PAGE_TITLE = "About";
const PAGE_DESCRIPTION = `The group behind ${COMPANY.legalName} — its history, principals, and the standard it holds across the Tricity.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    ...OG_DEFAULTS,
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

/**
 * About, redesigned (Sep 2026). Same words as before; the client found the
 * old page "scattered — just text text text". Every section now has one
 * clear shape: a framed image beside the ethos, numbered value tiles, a
 * profile per founder with the quote pulled out, the signed message as two
 * columns, and a framed closing panel.
 *
 * Light sections sit on ivory (`bg-surface`), the white the landing page
 * uses, rather than the page's cream ground; the values band alternates on
 * champagne (`bg-cream`) so each block reads as its own section.
 */
const SECTION = "px-5 py-16 md:px-12 md:py-24";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-surface">
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Who we are"
          title={ABOUT_PAGE.title}
          aside={
            // Wraps rather than assuming three facts fit: this is a
            // horizontal strip on a phone and a right-hand column at md.
            <dl className="flex flex-wrap gap-x-10 gap-y-5 md:flex-col md:gap-5 md:text-right">
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

        <Ethos />
        <Values />
        <Founders />
        <FoundersMessage />
        <Closing />
      </main>
      <Footer />
    </>
  );
}

/** Framed image beside the ethos: the image gives the prose an anchor. */
function Ethos() {
  const [lead, ...rest] = ABOUT_PAGE.ethosParagraphs;
  return (
    <section className={`bg-surface ${SECTION}`}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
        <div className="relative md:col-span-5">
          {/* Offset gold frame behind the photograph: the one decorative
              gesture on the page, and it is a rule, not a fill. */}
          <span
            aria-hidden
            className="absolute -bottom-4 -right-4 left-4 top-4 border border-gold/50"
          />
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-[4/5]">
            <Image
              src={ABOUT_PAGE.ethosImage}
              alt={ABOUT_PAGE.ethosImageAlt}
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-7">
          <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
            Our ethos
          </p>
          <h2 className="mt-4 text-balance font-serif text-h2 leading-tight text-heading">
            {ABOUT_PAGE.ethosHeading}
          </h2>
          <span aria-hidden className="mt-8 block h-px w-16 bg-gold" />
          {/* The first paragraph is the premise, so it leads at a larger size. */}
          <p className="mt-8 text-pretty font-serif text-h4 leading-snug text-ink">{lead}</p>
          {rest.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-5 text-pretty text-body font-sans leading-relaxed text-ink-muted"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Four numbered tiles on the champagne band. */
function Values() {
  return (
    <section className={`border-y border-border bg-cream ${SECTION}`}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="What we stand for"
          title={ABOUT_PAGE.valuesHeading}
          aside={ABOUT_PAGE.valuesSub}
        />
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_PAGE.values.map(([term, description], i) => (
            <div
              key={term}
              className="group flex flex-col gap-4 border border-border border-t-2 border-t-gold bg-white p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(40,30,15,0.45)]"
            >
              <span
                aria-hidden
                className="font-serif text-h2 leading-none text-gold/70 transition-colors duration-300 group-hover:text-gold"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <dt className="font-serif text-h4 text-heading">{term}</dt>
              <dd className="text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                {description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * One profile per founder, portrait alternating sides. Their words, their
 * portraits; the quote is pulled into its own panel so it is read, not
 * skimmed past at the end of the bio.
 */
function Founders() {
  return (
    <section className={`bg-surface ${SECTION}`}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The founders"
          title={ABOUT_PAGE.principalsHeading}
          aside={ABOUT_PAGE.principalsNote}
        />
        <div className="flex flex-col gap-20 md:gap-28">
          {ABOUT_PAGE.principals.map((person, i) => {
            const flipped = i % 2 === 1;
            return (
              <article
                key={person.name}
                className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-14"
              >
                <div className={`md:col-span-4 ${flipped ? "md:order-2" : ""}`}>
                  <div className="relative">
                    <span
                      aria-hidden
                      className={`absolute -bottom-4 top-4 border border-gold/50 ${
                        flipped ? "-left-4 right-4" : "-right-4 left-4"
                      }`}
                    />
                    <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                      <Image
                        src={person.image}
                        alt={`Portrait of ${person.name}`}
                        fill
                        sizes="(min-width: 768px) 30vw, 100vw"
                        className="object-cover grayscale transition-[filter] duration-700 hover:grayscale-0"
                      />
                    </div>
                  </div>
                  <div className="mt-8">
                    <h3 className="font-serif text-h3 text-heading">{person.name}</h3>
                    <p className="mt-1 text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] text-gold-deep">
                      {person.title}
                    </p>
                    {/* One qualification per item, at the client's
                        instruction — never a dot-separated run-on. */}
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {person.credentials.map((credential) => (
                        <li
                          key={credential}
                          className="border border-border bg-white px-3 py-1.5 text-meta font-sans text-ink-muted"
                        >
                          {credential}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={`flex flex-col gap-5 md:col-span-8 ${flipped ? "md:order-1" : ""}`}>
                  {person.bio.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-pretty text-body font-sans leading-relaxed text-ink"
                    >
                      {paragraph}
                    </p>
                  ))}
                  <blockquote className="relative mt-4 overflow-hidden border-l-2 border-gold bg-cream px-7 py-8 md:px-10">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-6 right-4 font-serif text-[8rem] leading-none text-gold/15"
                    >
                      &ldquo;
                    </span>
                    <p className="relative text-pretty font-serif text-h4 leading-snug text-heading">
                      &ldquo;{person.quote}&rdquo;
                    </p>
                    <footer className="relative mt-4 text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] text-gold-deep">
                      {person.name}
                    </footer>
                  </blockquote>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Quiet closing line, framed so it ends the page rather than trailing off. */
function Closing() {
  return (
    <section className={`bg-surface ${SECTION}`}>
      <div className="mx-auto flex max-w-3xl flex-col items-center border border-gold/40 bg-white px-6 py-14 text-center md:px-14 md:py-16">
        <span aria-hidden className="block h-px w-16 bg-gold" />
        <p className="mt-8 text-balance font-serif text-h3 leading-snug text-heading">
          {ABOUT_PAGE.closingLine}
        </p>
        <div className="mt-8">
          <Button href="/contact" variant="primary">
            {ABOUT_PAGE.closingCta}
          </Button>
        </div>
      </div>
    </section>
  );
}
