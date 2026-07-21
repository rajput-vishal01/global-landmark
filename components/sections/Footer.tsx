import type { ReactNode } from "react";
import { COMPANY, FOOTER } from "@/lib/data";

// Icons keyed by social label; a label without an icon falls back to text.
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z" />
    </svg>
  ),
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream text-ink">
      {/* Brand block */}
      <div data-reveal className="flex flex-col items-center gap-2 px-5 pb-12 pt-16 text-center md:pt-20">
        <p className="font-serif text-3xl uppercase tracking-[0.18em] md:text-4xl">
          {COMPANY.name}
        </p>
        <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.35em] text-gold-deep">
          {COMPANY.tagline}
        </p>
        <p className="mt-2 text-meta font-sans text-ink-muted">{COMPANY.license}</p>
      </div>

      {/* Contact / Office / Social */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-14 md:grid-cols-[1fr_auto_1.4fr_auto_1fr] md:items-start md:gap-0">
        <div className="flex flex-col gap-3 md:pr-10">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
            Contact
          </span>
          <p className="text-meta font-sans leading-relaxed text-ink">
            {COMPANY.email}
            <br />
            <a href={COMPANY.phoneHref} className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold">
              {COMPANY.phone}
            </a>
            {" · "}
            <a href={COMPANY.phoneAltHref} className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold">
              {COMPANY.phoneAlt}
            </a>
          </p>
        </div>

        <span aria-hidden className="hidden w-px self-stretch bg-border md:block" />

        <div className="flex flex-col gap-3 md:px-10">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
            Office
          </span>
          <p className="text-meta font-sans leading-relaxed text-ink">
            {COMPANY.addressLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-0 gap-y-2">
            {COMPANY.markets.map((city, i) => (
              <li
                key={city}
                className={`text-meta font-sans text-ink-muted ${
                  i > 0 ? "border-l border-border pl-4" : ""
                } ${i < COMPANY.markets.length - 1 ? "pr-4" : ""}`}
              >
                {city}
              </li>
            ))}
          </ul>
        </div>

        <span aria-hidden className="hidden w-px self-stretch bg-border md:block" />

        <div className="flex flex-col gap-3 md:pl-10">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
            Follow
          </span>
          <ul className="flex flex-wrap gap-3">
            {COMPANY.socials.filter((s) => s.href.startsWith("http")).map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-11 w-11 items-center justify-center border border-border text-ink transition-colors duration-300 hover:border-gold hover:text-gold-deep"
                >
                  {SOCIAL_ICONS[social.label] ?? (
                    <span className="font-sans text-[11px]">{social.label}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer + legal */}
      <div className="border-t border-border px-5 py-8 md:px-12">
        <p className="max-w-4xl text-meta font-sans leading-relaxed text-ink-muted">
          {FOOTER.disclaimer}
        </p>
        <p className="mt-4 text-meta font-sans text-ink-muted">{COMPANY.compliance}</p>
      </div>

      <div className="flex flex-col items-start gap-2 border-t border-border px-5 py-6 text-meta font-sans text-ink-muted md:flex-row md:items-center md:justify-between md:px-12">
        <span>&copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</span>
        <span>{COMPANY.markets.join(" · ")}</span>
      </div>
    </footer>
  );
}
