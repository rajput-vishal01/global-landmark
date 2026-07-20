import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY, CONTACT_PAGE } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Speak with the group about buying, selling, or a private valuation across the Tricity.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-dark-deep px-5 pb-12 pt-36 md:px-12 md:pb-14 md:pt-44">
          <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
          <h1 data-reveal className="max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
            {CONTACT_PAGE.title}
          </h1>
          <p data-reveal className="mt-6 max-w-xl text-pretty text-body font-sans text-cream/75">
            {CONTACT_PAGE.sub}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-16 px-5 py-20 md:grid-cols-[1fr_1.4fr] md:gap-24 md:px-12 md:py-28">
          <div className="flex flex-col gap-10">
            <div data-reveal className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Contact
              </span>
              <p className="text-body font-sans leading-relaxed text-ink">
                {COMPANY.email}
                <br />
                <a
                  href={COMPANY.phoneHref}
                  className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {COMPANY.phone}
                </a>
                <br />
                <a
                  href={COMPANY.phoneAltHref}
                  className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {COMPANY.phoneAlt}
                </a>
              </p>
            </div>

            <div data-reveal className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Office
              </span>
              <p className="text-body font-sans leading-relaxed text-ink">
                {COMPANY.addressLines.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>

            <div data-reveal className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Markets
              </span>
              <p className="text-body font-sans leading-relaxed text-ink-muted">
                {COMPANY.markets.join(" · ")}
              </p>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
