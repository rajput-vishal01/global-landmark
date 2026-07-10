import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Global Landmark Realty Group",
  description:
    "Speak with the group about buying, selling, or a private valuation.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="flex min-h-[78vh] flex-col justify-end bg-dark-deep px-5 pb-16 pt-40 md:px-12 md:pb-20">
          <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
          <h1 data-reveal className="max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
            Contact
          </h1>
          <p data-reveal className="mt-6 max-w-xl text-pretty text-body font-sans text-cream/75">
            Every inquiry is read by a senior member of the group and
            answered within one business day.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-16 px-5 py-20 md:grid-cols-[1fr_1.4fr] md:gap-24 md:px-12 md:py-28">
          <div className="flex flex-col gap-10">
            <div data-reveal className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Contact
              </span>
              <p className="text-body font-sans leading-relaxed text-ink">
                inquiries@globallandmark.com
                <br />
                <a
                  href="tel:+12125550184"
                  className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  +1 (212) 555-0184
                </a>
              </p>
            </div>

            <div data-reveal className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Office
              </span>
              <p className="text-body font-sans leading-relaxed text-ink">
                One Meridian Plaza, Suite 4400
                <br />
                New York, NY 10001
              </p>
            </div>

            <div data-reveal className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Markets
              </span>
              <p className="text-body font-sans leading-relaxed text-ink-muted">
                New York · London · Dubai · Hong Kong
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
