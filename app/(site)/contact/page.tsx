import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactForm } from "@/components/ContactForm";
import { PageHeader, SECTION } from "../_components/page-chrome";
import { COMPANY, CONTACT_PAGE } from "@/lib/data";
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

/** The repeated label above each block in the details column. */
const LABEL =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep";

const QUIET_LINK =
  "underline decoration-border underline-offset-4 transition-colors hover:decoration-gold";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Get in touch"
          title={CONTACT_PAGE.title}
          sub={CONTACT_PAGE.sub}
        />

        <section
          className={`grid grid-cols-1 gap-14 md:grid-cols-[1fr_1.4fr] md:gap-20 ${SECTION}`}
        >
          {/* Details as one bordered panel rather than three loose stacks —
              on a portal the office card is a thing you scan for, not prose. */}
          <div className="border border-border bg-cream p-7 md:h-fit md:p-9">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2.5">
                <span className={LABEL}>Contact</span>
                <p className="text-body font-sans leading-relaxed text-ink">
                  {COMPANY.email}
                  <br />
                  <a href={COMPANY.phoneHref} className={QUIET_LINK}>
                    {COMPANY.phone}
                  </a>
                  <br />
                  <a href={COMPANY.phoneAltHref} className={QUIET_LINK}>
                    {COMPANY.phoneAlt}
                  </a>
                </p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-border pt-8">
                <span className={LABEL}>Office</span>
                <p className="text-body font-sans leading-relaxed text-ink">
                  {COMPANY.addressLines.map((line, i) => (
                    <span key={line}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-border pt-8">
                <span className={LABEL}>Markets</span>
                <p className="text-body font-sans leading-relaxed text-ink-muted">
                  {COMPANY.markets.join(" · ")}
                </p>
              </div>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
