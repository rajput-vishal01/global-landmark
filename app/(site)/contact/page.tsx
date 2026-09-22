import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactForm } from "@/components/ContactForm";
import { SocialLinks } from "@/components/SocialLinks";
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

/** Icon in a gold ring — the one mark every contact tile carries. */
function Ring({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-white text-gold-deep transition-colors duration-300 group-hover:border-gold group-hover:bg-gold/10"
    >
      {children}
    </span>
  );
}

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6 } as const;

/**
 * Contact, redesigned (Sep 2026).
 *
 * Built around how people actually reach a Tricity brokerage: most call or
 * WhatsApp, fewer write. So the page leads with three direct tiles (call,
 * WhatsApp, email), then the office with a map and directions, then the
 * social profiles the client asked to see here as well as in the footer —
 * and the form, for anyone who would rather write, as its own card beside
 * them. Everything reads from resolveCompany(), so a number or address
 * changed in Admin -> Settings shows here too.
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

        <section className="px-5 py-14 md:px-12 md:py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-14">
            <div className="flex flex-col gap-5">
              {/* Direct lines first: the fastest way to a person. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="group flex items-start gap-4 border border-border bg-white p-5 transition-colors hover:border-gold">
                  <Ring>
                    <svg {...ICON}>
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                    </svg>
                  </Ring>
                  <div className="min-w-0">
                    <p className={EYEBROW}>Call us</p>
                    <a
                      href={COMPANY.phoneHref}
                      className="mt-1 block font-serif text-h4 text-heading transition-colors hover:text-gold-deep"
                    >
                      {COMPANY.phone}
                    </a>
                    <a
                      href={COMPANY.phoneAltHref}
                      className="block font-serif text-h4 text-heading transition-colors hover:text-gold-deep"
                    >
                      {COMPANY.phoneAlt}
                    </a>
                  </div>
                </div>

                <a
                  href={whatsAppHref(WHATSAPP.defaultMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 border border-border bg-white p-5 transition-colors hover:border-gold"
                >
                  <Ring>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.38a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm4.52 11.97c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
                    </svg>
                  </Ring>
                  <div className="min-w-0">
                    <p className={EYEBROW}>WhatsApp</p>
                    <p className="mt-1 font-serif text-h4 text-heading transition-colors group-hover:text-gold-deep">
                      Chat with us
                    </p>
                    <p className="text-meta font-sans text-ink-muted">Usually the quickest reply.</p>
                  </div>
                </a>

                <a
                  href={`mailto:${COMPANY.email}`}
                  className="group flex items-start gap-4 border border-border bg-white p-5 transition-colors hover:border-gold sm:col-span-2 lg:col-span-1"
                >
                  <Ring>
                    <svg {...ICON}>
                      <rect x="3" y="5" width="18" height="14" rx="1.5" />
                      <path d="m3.5 6 8.5 7 8.5-7" />
                    </svg>
                  </Ring>
                  <div className="min-w-0">
                    <p className={EYEBROW}>Email</p>
                    <p className="mt-1 break-all font-sans text-body text-heading transition-colors group-hover:text-gold-deep">
                      {COMPANY.email}
                    </p>
                  </div>
                </a>
              </div>

              {/* The office: address and a map that opens Google Maps. The
                  frame is display only; the link over it is the control. */}
              <div className="overflow-hidden border border-border bg-white">
                <div className="group relative aspect-[16/9] bg-cream">
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
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className={EYEBROW}>Visit the office</p>
                    <address className="mt-2 not-italic text-body font-sans leading-relaxed text-ink">
                      {COMPANY.addressLines.map((line, i) => (
                        <span key={line}>
                          {i > 0 && <br />}
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>
                  <a
                    href={COMPANY.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 border border-ink/20 px-4 py-2.5 text-eyebrow font-sans font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-gold hover:text-gold-deep"
                  >
                    Get directions
                    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Social profiles and the markets covered, side by side on a
                  wide screen: two short facts, one quiet card. */}
              <div className="grid grid-cols-1 gap-6 border border-border bg-white p-6 sm:grid-cols-2">
                <div>
                  <p className={EYEBROW}>Follow us</p>
                  <div className="mt-3">
                    <SocialLinks socials={COMPANY.socials} brand={COMPANY.name} />
                  </div>
                </div>
                <div>
                  <p className={EYEBROW}>Markets we cover</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {COMPANY.markets.map((market) => (
                      <li
                        key={market}
                        className="border border-border bg-surface px-3 py-1.5 text-meta font-sans text-ink"
                      >
                        {market}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="self-start border border-border bg-white p-6 shadow-[0_30px_60px_-40px_rgba(40,30,15,0.45)] sm:p-8 md:p-10 lg:sticky lg:top-28">
              <span aria-hidden className="block h-px w-12 bg-gold" />
              <h2 className="mt-6 font-serif text-h3 text-heading">Send us a message</h2>
              <p className="mb-8 mt-2 text-pretty text-body font-sans text-ink-muted">
                {CONTACT_PAGE.sub}
              </p>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
