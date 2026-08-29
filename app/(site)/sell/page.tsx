import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { SellForm } from "@/components/SellForm";
import { PageHeader, SECTION } from "../_components/page-chrome";
import { COMPANY, SELL_PAGE } from "@/lib/data";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "Sell With Us";
const PAGE_DESCRIPTION =
  "Submit your property for a private valuation and a discreet, well-matched buyer pool across the Tricity.";

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

const LABEL =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep";

export default function SellPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Owners & investors"
          title={SELL_PAGE.title}
          sub={SELL_PAGE.sub}
        />

        <section
          className={`grid grid-cols-1 gap-14 md:grid-cols-[1fr_1.4fr] md:gap-20 ${SECTION}`}
        >
          {/* Same bordered panel as /contact: an owner deciding whether to
              hand us their property is reading the same three facts. */}
          <div className="border border-border bg-cream p-7 md:h-fit md:p-9">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2.5">
                <span className={LABEL}>Why list with us</span>
                <p className="text-body font-sans leading-relaxed text-ink">
                  A private valuation from principals who know the Tricity market, followed by
                  a discreet introduction to a well-matched buyer pool — not a public listing
                  blitz.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-border pt-8">
                <span className={LABEL}>Direct</span>
                <p className="text-body font-sans leading-relaxed text-ink">
                  {COMPANY.email}
                  <br />
                  <a
                    href={COMPANY.phoneHref}
                    className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                  >
                    {COMPANY.phone}
                  </a>
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

          <SellForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
