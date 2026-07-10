const CITIES = ["New York", "London", "Dubai", "Hong Kong"];

const SOCIALS = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <span className="font-sans text-[13px] font-semibold leading-none">in</span>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
        <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream text-ink">
      {/* Brand block */}
      <div data-reveal className="flex flex-col items-center gap-2 px-5 pb-12 pt-16 text-center md:pt-20">
        <p className="font-serif text-3xl uppercase tracking-[0.18em] md:text-4xl">
          Global Landmark
        </p>
        <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.35em] text-gold-deep">
          Realty Group
        </p>
        <p className="mt-2 text-meta font-sans text-ink-muted">
          Licensed Real Estate Broker | NY DOS #10401234567
        </p>
      </div>

      {/* Contact / Office / Social */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-14 md:grid-cols-[1fr_auto_1.4fr_auto_1fr] md:items-start md:gap-0">
        <div className="flex flex-col gap-3 md:pr-10">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
            Contact
          </span>
          <p className="text-meta font-sans leading-relaxed text-ink">
            inquiries@globallandmark.com
            <br />
            <a href="tel:+12125550184" className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold">
              +1 (212) 555-0184
            </a>
          </p>
        </div>

        <span aria-hidden className="hidden w-px self-stretch bg-border md:block" />

        <div className="flex flex-col gap-3 md:px-10">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
            Office
          </span>
          <p className="text-meta font-sans leading-relaxed text-ink">
            One Meridian Plaza, Suite 4400
            <br />
            New York, NY 10001
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-0 gap-y-2">
            {CITIES.map((city, i) => (
              <li
                key={city}
                className={`text-meta font-sans text-ink-muted ${
                  i > 0 ? "border-l border-border pl-4" : ""
                } ${i < CITIES.length - 1 ? "pr-4" : ""}`}
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
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-11 w-11 items-center justify-center border border-border text-ink transition-colors duration-300 hover:border-gold hover:text-gold-deep"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer + legal */}
      <div className="border-t border-border px-5 py-8 md:px-12">
        <p className="max-w-4xl text-meta font-sans leading-relaxed text-ink-muted">
          All information provided herein is deemed reliable but is not
          guaranteed and should be independently verified. Listings are
          subject to errors, omissions, change of price, prior sale, or
          withdrawal without notice. Global Landmark Realty Group makes no
          representation as to the accuracy of any information contained
          herein.
        </p>
        <p className="mt-4 text-meta font-sans text-ink-muted">
          REALTOR&reg; · Equal Housing Opportunity
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 border-t border-border px-5 py-6 text-meta font-sans text-ink-muted md:flex-row md:items-center md:justify-between md:px-12">
        <span>&copy; {new Date().getFullYear()} Global Landmark Realty Group. All rights reserved.</span>
        <span>New York · London · Dubai · Hong Kong</span>
      </div>
    </footer>
  );
}
