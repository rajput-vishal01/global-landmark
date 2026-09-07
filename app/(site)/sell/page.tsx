import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { SellPropertyForm } from "@/components/SellPropertyForm";
import { PageHeader, SECTION } from "../_components/page-chrome";
import { canonical } from "@/lib/seo";

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

export default function SellPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="List with us"
          title={PAGE_TITLE}
          sub="Tell us what you have. Our team reads every submission personally — nothing is published until you have agreed what it says."
          breadcrumbs={BREADCRUMBS}
        />

        <section className={SECTION}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-[1fr_minmax(0,1.4fr)] lg:gap-24">
            <div className="flex flex-col gap-10 lg:sticky lg:top-28 lg:self-start">
              <div className="flex flex-col gap-6">
                {STEPS.map(([heading, body], i) => (
                  <div key={heading} className="flex gap-5">
                    <span
                      aria-hidden
                      className="text-eyebrow shrink-0 pt-1 font-sans font-semibold tracking-[0.2em] text-gold-deep"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h2 className="font-serif text-h4 text-ink">{heading}</h2>
                      <p className="text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SellPropertyForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
