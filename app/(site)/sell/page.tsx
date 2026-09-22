import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { SellPropertyForm } from "@/components/SellPropertyForm";
import { PageHeader } from "../_components/page-chrome";
import { canonical } from "@/lib/seo";
import { resolveCompany } from "@/lib/site-settings";

const PAGE_TITLE = "Sell your property";
const PAGE_DESCRIPTION =
  "List a Tricity home, plot or commercial space with Global Landmark. Send the details and our team will call you.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/sell" },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/sell"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Sell", path: "/sell" },
];

/** What happens after they press submit — stated plainly, because the
    honest answer ("a person reads it") is also the reassuring one. */
const STEPS: [string, string][] = [
  ["You send the details", "Three fields are required. The rest we can fill in together."],
  ["Our executive calls you", "To confirm the details, agree a price and arrange photographs."],
  [
    "We list it on our website",
    "Only once you have seen how it reads. Nothing goes live automatically, and your phone number and address are never shown.",
  ],
];

/**
 * Sell, redesigned (Sep 2026). The old page was a bare list of steps beside
 * a long underlined form. Now: the steps as a connected timeline on a
 * graphite card, with a direct line to the office under it, beside the form
 * as a white card in three numbered parts. Wording unchanged.
 */
export default async function SellPage() {
  // The numbers an admin may have changed in Settings, same as the footer.
  const COMPANY = await resolveCompany();
  return (
    <>
      <Header />
      <main className="bg-surface">
        <PageHeader
          eyebrow="List with us"
          title={PAGE_TITLE}
          sub="Tell us what you have. Our team reads every submission personally — nothing is published until you have agreed what it says."
          breadcrumbs={BREADCRUMBS}
        />

        <section className="px-5 py-14 md:px-12 md:py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:gap-14">
            <aside className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
              <div className="bg-navy p-8 text-cream md:p-10" data-band>
                <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.22em] text-cta">
                  How it works
                </p>
                {/* A timeline, not a list: the gold spine is what tells the
                    reader these happen in order. */}
                <ol className="relative mt-8 flex flex-col gap-8">
                  <span
                    aria-hidden
                    className="absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-gold via-gold/40 to-transparent"
                  />
                  {STEPS.map(([heading, body], i) => (
                    <li key={heading} className="relative flex gap-5">
                      <span
                        aria-hidden
                        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold bg-navy font-sans text-meta font-semibold text-cta"
                      >
                        {i + 1}
                      </span>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <h2 className="font-serif text-h4 text-cream">{heading}</h2>
                        <p className="text-pretty text-meta font-sans leading-relaxed text-cream/70">
                          {body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center justify-between gap-4 border border-border bg-white px-6 py-5">
                <div>
                  <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] text-gold-deep">
                    Prefer to talk?
                  </p>
                  {/* Both office lines, one per row, same as the footer. */}
                  {[
                    [COMPANY.phoneHref, COMPANY.phone],
                    [COMPANY.phoneAltHref, COMPANY.phoneAlt],
                  ].map(([href, label]) => (
                    <a
                      key={href}
                      href={href}
                      className="mt-1 block font-serif text-h4 text-heading transition-colors hover:text-gold-deep"
                    >
                      {label}
                    </a>
                  ))}
                </div>
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold-deep"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                  </svg>
                </span>
              </div>
            </aside>

            <SellPropertyForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
