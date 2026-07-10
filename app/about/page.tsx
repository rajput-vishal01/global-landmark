import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About | Global Landmark Realty Group",
  description:
    "Two decades of landmark representation. The group, its history, and the people behind it.",
};

const MILESTONES = [
  {
    year: "2005",
    title: "Founded in New York",
    body: "Global Landmark opens as a two-person desk representing a single waterfront estate. The sale sets a neighborhood record that stands for nine years.",
  },
  {
    year: "2012",
    title: "The first $100M year",
    body: "A run of off-market penthouse transactions establishes the group's reputation for quiet, record-setting sales among private clients.",
  },
  {
    year: "2019",
    title: "International desks",
    body: "Offices open in London and Dubai, followed by Hong Kong. The portfolio grows from a city practice to twelve markets on four continents.",
  },
  {
    year: "2026",
    title: "Today",
    body: "Over $2.4B in landmark sales, 340 residences represented, and the same standard the group opened with: few properties, chosen carefully.",
  },
];

const PRINCIPALS = [
  {
    name: "Elena Marchetti",
    title: "Founding Principal",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "Daniel Okafor",
    title: "Head of Private Sales",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "Ingrid Halvorsen",
    title: "Director, International",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=700&auto=format&fit=crop",
  },
];

const RECORD = [
  { label: "Founded", value: "2005" },
  { label: "Markets", value: "12" },
  { label: "Sales volume", value: "$2.4B+" },
  { label: "Landmark properties", value: "340+" },
  { label: "Average client tenure", value: "14 years" },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Intro: statement left, meta column right */}
        <section className="flex min-h-[78vh] flex-col justify-end bg-dark-deep px-5 pb-16 md:px-12 md:pb-20">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
              <h1 data-reveal className="text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
                The Group
              </h1>
            </div>
            <dl data-reveal className="flex shrink-0 gap-10 md:flex-col md:gap-5 md:pb-2 md:text-right">
              {[
                ["Est.", "2005"],
                ["Home office", "New York"],
                ["Sold to date", "$2.4B+"],
              ].map(([label, value]) => (
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
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop"
              alt="Towers of a city financial district seen from street level"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="mx-auto mt-16 max-w-5xl md:mt-24">
            <h2 data-reveal className="max-w-2xl text-balance font-serif text-h2 leading-tight text-ink">
              Most brokerages measure themselves by how much they list. We
              measure ourselves by what we decline.
            </h2>
            <div
              data-reveal
              className="mt-10 gap-12 text-pretty text-body font-sans text-ink-muted md:columns-2"
            >
              <p>
                Global Landmark was founded on a narrow premise: that a small
                number of exceptional residences, represented completely, will
                always outperform a large inventory handled adequately. Every
                property the group accepts is walked by a principal, studied
                against its market, and prepared as if it were the only one on
                the books. Most weeks, it nearly is.
              </p>
              <p className="mt-6">
                That restraint shapes everything downstream. Photography is
                commissioned per residence, never templated. Showings are
                private and few. Negotiations are handled by the same senior
                person who first walked the property, and most of our sales
                close without ever appearing on a public listing. The clients
                this suits tend to stay; the average relationship with the
                group now runs fourteen years.
              </p>
            </div>
          </div>
        </section>

        {/* History: chronology with a hairline spine */}
        <section className="border-y border-border bg-cream px-5 py-20 md:px-12 md:py-28">
          <h2 data-reveal className="font-serif text-h2 uppercase tracking-[0.04em] text-ink">
            Two decades, four chapters
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
              The Principals
            </h2>
            <span data-reveal className="text-meta font-sans text-ink-muted">
              One senior team, every engagement
            </span>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 md:gap-8">
            {PRINCIPALS.map((person) => (
              <figure key={person.name} data-reveal className="flex flex-col gap-5">
                <div data-reveal-img className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={person.image}
                    alt={`Portrait of ${person.name}`}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
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
              The record
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
            If your property belongs in this company, we should speak.
          </p>
          <div data-reveal className="mt-8 flex justify-center">
            <Button href="/contact">Start the Conversation</Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
