import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactForm } from "@/components/ContactForm";
import { SocialPills } from "@/components/SocialLinks";
import { PageHeader } from "../_components/page-chrome";
import { CONTACT_PAGE, WHATSAPP } from "@/lib/data";
import { resolveCompany } from "@/lib/site-settings";
import { whatsAppHref } from "@/lib/whatsapp";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "Contact";
const PAGE_DESCRIPTION =
  "Speak with the group about buying, selling, or a private valuation across the Tricity.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/contact"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

const EYEBROW =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-gold-deep";

const ICON = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
} as const;

/**
 * One of the three direct-contact cards. Centred and equal-width, so the
 * row reads as a choice of three doors rather than a list.
 */
function ContactCard({
  icon,
  label,
  children,
  href,
  external,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  /** When set, the whole card is the link. The call card holds two links instead. */
  href?: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-surface text-gold-deep transition-colors duration-300 group-hover:border-gold group-hover:bg-gold/10"
      >
        {icon}
      </span>
      <p className={`mt-5 ${EYEBROW}`}>{label}</p>
      <div className="mt-2">{children}</div>
    </>
  );
  const card =
    "group flex flex-col items-center border border-border bg-white px-6 py-9 text-center shadow-[0_24px_50px_-32px_rgba(40,30,15,0.5)] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-gold";
  return href ? (
    <a
      href={href}
      className={card}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {body}
    </a>
  ) : (
    <div className={card}>{body}</div>
  );
}

/**
 * Contact, redesigned again (Sep 2026) as full-width bands, one job each,
 * stacked down the page, rather than a busy column beside a floating form
 * (which is what the Sell page does; the two must not look alike).
 *
 *   1. three direct-contact cards, lifted over the header's edge;
 *   2. Follow us, the social profiles as labelled pills (client request);
 *   3. the office: a full-width map with the address card set on it;
 *   4. the message form, centred, on its own champagne band.
 *
 * Everything reads resolveCompany(), so Settings changes apply here.
 */
export default async function ContactPage() {
  const COMPANY = await resolveCompany();

  return (
    <>
      <Header />
      <main className="bg-surface">
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Get in touch"
          title={CONTACT_PAGE.title}
          sub={CONTACT_PAGE.sub}
        />

        {/* 1 — Direct lines, overlapping the header band's bottom edge. */}
        <section className="relative z-10 -mt-10 px-5 md:-mt-14 md:px-12">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <ContactCard
              label="Call us"
              icon={
                <svg {...ICON}>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
              }
            >
              <a
                href={COMPANY.phoneHref}
                className="block font-serif text-h4 text-heading transition-colors hover:text-gold-deep"
              >
                {COMPANY.phone}
              </a>
              <a
                href={COMPANY.phoneAltHref}
                className="block font-serif text-h4 text-heading transition-colors hover:text-gold-deep"
              >
                {COMPANY.phoneAlt}
              </a>
            </ContactCard>

            <ContactCard
              label="WhatsApp"
              href={whatsAppHref(WHATSAPP.defaultMessage)}
              external
              icon={
                <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.38a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm4.52 11.97c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
                </svg>
              }
            >
              <p className="font-serif text-h4 text-heading transition-colors group-hover:text-gold-deep">
                Chat with us
              </p>
              <p className="mt-1 text-meta font-sans text-ink-muted">Usually the quickest reply.</p>
            </ContactCard>

            <ContactCard
              label="Email"
              href={`mailto:${COMPANY.email}`}
              icon={
                <svg {...ICON}>
                  <rect x="3" y="5" width="18" height="14" rx="1.5" />
                  <path d="m3.5 6 8.5 7 8.5-7" />
                </svg>
              }
            >
              <p className="break-all font-sans text-body text-heading transition-colors group-hover:text-gold-deep">
                {COMPANY.email}
              </p>
            </ContactCard>
          </div>
        </section>

        {/* 2 — Social profiles, as a destination of their own. */}
        <section className="px-5 py-16 text-center md:px-12 md:py-20">
          <p className={EYEBROW}>Follow us</p>
          <h2 className="mx-auto mt-3 max-w-xl text-balance font-serif text-h3 text-heading">
            Walkthroughs, launches and site visits, as they happen
          </h2>
          <div className="mt-8">
            <SocialPills socials={COMPANY.socials} brand={COMPANY.name} />
          </div>
        </section>

        {/* 3 — The office. Full-width map; the address card sits on it on a
            wide screen and under it on a phone. The frame is display only
            and a link covers it, so a click opens Google Maps instead of
            trapping the scroll wheel. */}
        <section className="border-t border-border">
          <div className="relative md:h-[30rem]">
            <div className="group relative h-72 md:absolute md:inset-0 md:h-auto">
              <iframe
                src={COMPANY.mapsEmbedUrl}
                title={`Map showing ${COMPANY.name}'s office`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full border-0"
              />
              <a
                href={COMPANY.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${COMPANY.name}'s office in Google Maps`}
                className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
              />
            </div>

            <div className="relative px-5 pb-12 md:pointer-events-none md:absolute md:inset-y-0 md:left-12 md:flex md:items-center md:px-0 md:pb-0">
              <div className="-mt-10 border border-border bg-white p-7 shadow-[0_30px_60px_-30px_rgba(40,30,15,0.55)] md:pointer-events-auto md:mt-0 md:w-[24rem] md:p-9">
                <span aria-hidden className="block h-px w-12 bg-gold" />
                <p className={`mt-6 ${EYEBROW}`}>Visit the office</p>
                <address className="mt-3 not-italic font-serif text-h4 leading-snug text-heading">
                  {COMPANY.addressLines.map((line, i) => (
                    <span key={line}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </address>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {COMPANY.markets.map((market) => (
                    <li
                      key={market}
                      className="border border-border bg-surface px-3 py-1 text-meta font-sans text-ink-muted"
                    >
                      {market}
                    </li>
                  ))}
                </ul>
                <a
                  href={COMPANY.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 bg-cta px-6 py-3.5 text-eyebrow font-sans font-semibold uppercase tracking-[0.16em] text-cta-ink transition-colors hover:bg-cta-hover"
                >
                  Get directions
                  <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4 — The message form, centred on its own band. */}
        <section className="border-t border-border bg-cream px-5 py-16 md:px-12 md:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className={EYEBROW}>Write to us</p>
              <h2 className="mt-3 font-serif text-h2 text-heading">Send us a message</h2>
              <p className="mx-auto mt-3 max-w-md text-pretty text-body font-sans text-ink-muted">
                {CONTACT_PAGE.sub}
              </p>
            </div>
            <div className="mt-10 border border-border bg-white p-6 shadow-[0_30px_60px_-40px_rgba(40,30,15,0.45)] sm:p-8 md:p-10">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
