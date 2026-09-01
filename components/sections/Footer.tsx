import type { ReactNode } from "react";
import Link from "next/link";
import { resolveCompany } from "@/lib/site-settings";
import { NewsletterForm } from "@/components/NewsletterForm";
import { whatsAppHref } from "@/lib/whatsapp";
import { WHATSAPP } from "@/lib/data";

/**
 * Icons keyed by social label; a label without an icon falls back to text.
 * Hand-drawn rather than lucide: lucide v1 dropped brand glyphs, and these
 * are the marks the client's profiles actually need.
 */
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  X: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
  LinkedIn: (
    <span className="font-sans text-[13px] font-semibold leading-none">in</span>
  ),
  YouTube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z" />
    </svg>
  ),
  WhatsApp: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.38a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.81.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  ),
};

const BLOCK_HEADING =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-cta";

const FOOTER_LINK =
  "text-meta font-sans text-cream/70 transition-colors hover:text-cta";

export async function Footer() {
  // Same identifier as the static default (lib/data.ts's COMPANY) so every
  // COMPANY.x reference below picks up an admin override automatically —
  // R-36 without rewriting the rest of this file.
  const COMPANY = await resolveCompany();

  // WhatsApp is appended rather than stored in COMPANY.socials: it is not a
  // profile URL but the same wa.me deep link the floating dock uses, so it
  // stays derived from the phone number instead of being a second place to
  // keep that number in step.
  const socials = [
    ...COMPANY.socials.filter((s) => s.href.startsWith("http")),
    { label: "WhatsApp", href: whatsAppHref(WHATSAPP.defaultMessage) },
  ];

  return (
    <footer className="bg-navy text-cream">
      {/* Full-bleed with the site's standard gutters, not a centred
          max-width column: every other band on the page runs edge to edge,
          so a boxed footer read as a different site pasted underneath. */}
      <div className="px-5 md:px-12">
        {/* Masthead: the wordmark and how to reach a human on the left, the
            newsletter on the right. The link-column block that used to sit
            below this was removed at the client's request — the header nav
            and /properties filters already lead everywhere it pointed. */}
        <div className="grid grid-cols-1 gap-10 border-b border-cream/10 py-14 md:grid-cols-[1.1fr_1fr] md:gap-20 md:py-16">
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-serif text-3xl uppercase tracking-[0.16em] md:text-4xl">
                {COMPANY.name}
              </p>
              <p className="mt-1.5 text-eyebrow font-sans font-semibold uppercase tracking-[0.35em] text-cta">
                {COMPANY.tagline}
              </p>
            </div>

            <p className="max-w-sm text-pretty text-meta font-sans leading-relaxed text-cream/60">
              {COMPANY.license}
            </p>

            <div className="flex flex-col gap-2">
              <h3 className={BLOCK_HEADING}>Contact</h3>
              <p className="text-meta font-sans leading-relaxed">
                <a href={`mailto:${COMPANY.email}`} className={FOOTER_LINK}>
                  {COMPANY.email}
                </a>
                <br />
                <a href={COMPANY.phoneHref} className={FOOTER_LINK}>
                  {COMPANY.phone}
                </a>
                {" · "}
                <a href={COMPANY.phoneAltHref} className={FOOTER_LINK}>
                  {COMPANY.phoneAlt}
                </a>
              </p>
              <address className="not-italic text-meta font-sans leading-relaxed text-cream/55">
                {COMPANY.addressLines.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </address>
            </div>

            <ul className="mt-1 flex flex-wrap gap-2.5">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={
                      social.label === "WhatsApp"
                        ? "Chat with us on WhatsApp"
                        : social.label
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors duration-300 hover:border-cta hover:text-cta"
                  >
                    {SOCIAL_ICONS[social.label] ?? (
                      <span className="font-sans text-[11px]">{social.label}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:pt-2">
            <NewsletterForm />
          </div>
        </div>

        {/* RERA line (R-71). Indian property advertising is expected to carry
            the agency's registration number, and the client has not supplied
            one yet — so this renders the generic compliance sentence only. Do
            NOT write a number in here: when the client confirms it, append it
            to COMPANY.license / COMPANY.compliance in lib/data.ts (or set it
            through the admin contact override) and it appears here and in the
            masthead above at once. Never hardcode it at this call site. */}
        <div className="py-8">
          <div className="flex flex-col gap-2 text-meta font-sans text-cream/55 md:flex-row md:items-center md:justify-between">
            <span>
              &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights
              reserved.
            </span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-cream/45">
              {COMPANY.compliance}
              {/* CC BY-SA on one of the site photographs requires the credit
                  to appear wherever the work is used. Do not remove while
                  /public/local still holds a CC-licensed file. */}
              <Link
                href="/credits"
                className="underline decoration-cream/25 underline-offset-4 transition-colors hover:text-cta"
              >
                Photography credits
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
