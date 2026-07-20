import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/Button";
import { ABOUT_PAGE, COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: `The group behind ${COMPANY.legalName} — its history, principals, and the standard it holds across the Tricity.`,
  alternates: { canonical: "/about" },
};

const MILESTONES = ABOUT_PAGE.milestones;
const PRINCIPALS = ABOUT_PAGE.principals;
const RECORD = ABOUT_PAGE.record;

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Intro: statement left, meta column right */}
        <section className="bg-dark-deep px-5 pb-12 pt-36 md:px-12 md:pb-14 md:pt-44">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
              <h1 data-reveal className="text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
                {ABOUT_PAGE.title}
              </h1>
            </div>
            <dl data-reveal className="flex shrink-0 gap-10 md:flex-col md:gap-5 md:pb-2 md:text-right">
              {ABOUT_PAGE.facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-eyebrow font-sans uppercase tracking-[0.2em] text-cream/50">
                    {label}
                  </dt>
                  <dd className="mt-1 font-serif text-h4 text-cream">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Ethos: full-bleed image, then two-column editorial prose */}
        <section className="px-5 py-20 md:px-12 md:py-28">
          <div data-reveal-img className="relative h-[45vh] overflow-hidden md:h-[65vh]">
            <Image
              src={ABOUT_PAGE.ethosImage}
              alt={ABOUT_PAGE.ethosImageAlt}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="mx-auto mt-16 max-w-5xl md:mt-24">
            <h2 data-reveal className="max-w-2xl text-balance font-serif text-h2 leading-tight text-ink">
              {ABOUT_PAGE.ethosHeading}
            </h2>
            <div
              data-reveal
              className="mt-10 gap-12 text-pretty text-body font-sans text-ink-muted md:columns-2"
            >
              {ABOUT_PAGE.ethosParagraphs.map((paragraph, i) => (
                <p key={i} className={i > 0 ? "mt-6" : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* History: chronology with a hairline spine */}
        <section className="border-y border-border bg-cream px-5 py-20 md:px-12 md:py-28">
          <h2 data-reveal className="font-serif text-h2 uppercase tracking-[0.04em] text-ink">
            {ABOUT_PAGE.historyHeading}
          </h2>
          <ol className="mt-14 flex flex-col">
            {MILESTONES.map((m) => (
              <li
                key={m.year}
                data-reveal
                className="grid grid-cols-1 gap-4 border-t border-border py-10 md:grid-cols-[180px_1fr_2fr] md:gap-10"
              >
                <span className="font-serif text-h3 leading-none text-gold-deep">
                  {m.year}
                </span>
                <h3 className="font-serif text-h4 text-ink">{m.title}</h3>
                <p className="max-w-xl text-pretty text-body font-sans text-ink-muted">
                  {m.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Principals */}
        <section className="px-5 py-20 md:px-12 md:py-28">
          <div className="mb-14 flex flex-wrap items-baseline justify-between gap-4">
            <h2 data-reveal className="font-serif text-h2 uppercase tracking-[0.04em] text-ink">
              {ABOUT_PAGE.principalsHeading}
            </h2>
            <span data-reveal className="text-meta font-sans text-ink-muted">
              {ABOUT_PAGE.principalsNote}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:gap-8 md:max-w-2xl">
            {PRINCIPALS.map((person) => (
              <figure key={person.name} data-reveal className="flex flex-col gap-5">
                <div data-reveal-img className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={person.image}
                    alt={`Portrait of ${person.name}`}
                    fill
                    sizes="(min-width: 640px) 40vw, 100vw"
                    className="object-cover grayscale"
                  />
                </div>
                <figcaption>
                  <p className="font-serif text-h4 text-ink">{person.name}</p>
                  <p className="mt-1 text-meta font-sans text-ink-muted">
                    {person.title}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* The record: quiet definition list on dark */}
        <section className="bg-dark px-5 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-3xl">
            <h2 data-reveal className="font-serif text-h2 uppercase tracking-[0.04em] text-cream">
              {ABOUT_PAGE.recordHeading}
            </h2>
            <dl className="mt-12 flex flex-col">
              {RECORD.map((row) => (
                <div
                  key={row.label}
                  data-reveal
                  className="flex items-baseline justify-between gap-6 border-t border-cream/15 py-6"
                >
                  <dt className="text-body font-sans text-cream/60">{row.label}</dt>
                  <dd className="font-serif text-h3 text-cream">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Quiet closing line */}
        <section className="px-5 py-24 text-center md:py-32">
          <p data-reveal className="mx-auto max-w-2xl text-balance font-serif text-h3 leading-snug text-ink">
            {ABOUT_PAGE.closingLine}
          </p>
          <div data-reveal className="mt-8 flex justify-center">
            <Button href="/contact">{ABOUT_PAGE.closingCta}</Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
