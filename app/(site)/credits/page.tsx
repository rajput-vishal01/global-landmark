import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { PageHeader, SECTION } from "../_components/page-chrome";

const PAGE_TITLE = "Photography credits";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: "Attribution for the licensed photography used on this site.",
  alternates: { canonical: "/credits" },
  // Not a page we want ranking — it exists to satisfy the licences.
  robots: { index: false, follow: true },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Credits", path: "/credits" },
];

/**
 * Attribution page.
 *
 * Two of the site's photographs are Creative Commons, and CC BY-SA requires
 * the author and licence to be named wherever the work is used. This page is
 * that notice; the footer links to it. Remove a row only when the file it
 * names actually leaves the site — which is what happens as the client's own
 * photography replaces these.
 */
const CREDITS = [
  {
    subject: "Zirakpur skyline at dusk",
    author: "Botjagdeep567",
    licence: "CC0 1.0 (public domain)",
    licenceHref: "https://creativecommons.org/publicdomain/zero/1.0/",
    source: "https://commons.wikimedia.org/wiki/File:Zirakpur_Skyline.jpg",
  },
  {
    subject: "Open land at the Zirakpur edge, towers behind",
    author: "Manojkhurana",
    licence: "CC BY-SA 3.0",
    licenceHref: "https://creativecommons.org/licenses/by-sa/3.0/",
    source: "https://commons.wikimedia.org/wiki/File:Zirakpur.jpg",
  },
];

export default function CreditsPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Attribution"
          title={PAGE_TITLE}
          sub="Photographs used on this site under a Creative Commons licence, with the credit each licence asks for."
        />

        <section className={SECTION}>
          <ul className="flex max-w-3xl flex-col">
            {CREDITS.map((c) => (
              <li
                key={c.source}
                className="flex flex-col gap-1 border-b border-border py-6 last:border-b-0"
              >
                <p className="font-serif text-h4 text-heading">{c.subject}</p>
                <p className="text-body font-sans text-ink-muted">
                  {c.author} ·{" "}
                  <a
                    href={c.licenceHref}
                    target="_blank"
                    rel="noopener noreferrer license"
                    className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                  >
                    {c.licence}
                  </a>{" "}
                  ·{" "}
                  <a
                    href={c.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                  >
                    Wikimedia Commons
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
