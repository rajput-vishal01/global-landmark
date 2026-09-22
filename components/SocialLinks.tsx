import type { ReactNode } from "react";
import { whatsAppHref } from "@/lib/whatsapp";
import { WHATSAPP } from "@/lib/data";

/**
 * Each network in its own brand colour: a filled disc with a white mark.
 * The client asked for the real colours so the icons read at a glance on
 * the navy ground. Gold-is-never-a-fill is about the brand accent; these
 * are other companies' marks, shown the way those companies draw them.
 *
 * Hand-drawn rather than lucide: lucide v1 dropped brand glyphs.
 */
const SOCIAL_STYLE: Record<string, { bg: string; icon: ReactNode }> = {
  Instagram: {
    bg: "bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  Facebook: {
    bg: "bg-[#1877F2]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.4V21h3.1Z" />
      </svg>
    ),
  },
  // YouTube's mark is a red lozenge, not a disc, so it sits on white.
  YouTube: {
    bg: "bg-white",
    icon: (
      <span className="relative flex items-center justify-center">
        <span aria-hidden className="absolute h-[15px] w-[21px] rounded-[4px] bg-[#FF0000]" />
        <svg className="relative" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 8.8v6.4l5.6-3.2L10 8.8Z" />
        </svg>
      </span>
    ),
  },
  LinkedIn: {
    bg: "bg-[#0A66C2]",
    icon: <span className="font-sans text-[14px] font-bold leading-none">in</span>,
  },
  X: {
    bg: "bg-black ring-1 ring-cream/25",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z" />
      </svg>
    ),
  },
  WhatsApp: {
    bg: "bg-[#25D366]",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.38a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.81.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
      </svg>
    ),
  },
};

/**
 * The social links row: every profile with an http(s) URL, then WhatsApp.
 * Shared by the footer and the contact page so the two can never show a
 * different set of networks or a different mark for one of them.
 *
 * WhatsApp is appended rather than stored in the socials list: it is not a
 * profile URL but the same wa.me deep link the floating dock uses, so it
 * stays derived from the phone number instead of being a second place to
 * keep that number in step.
 */
export function SocialLinks({
  socials,
  brand,
}: {
  socials: readonly { label: string; href: string }[];
  /** The company name, for "Global Landmark on Instagram". */
  brand: string;
}) {
  const links = [
    ...socials.filter((s) => s.href.startsWith("http")),
    { label: "WhatsApp", href: whatsAppHref(WHATSAPP.defaultMessage) },
  ];
  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((social) => {
        const style = SOCIAL_STYLE[social.label];
        return (
          <li key={social.label}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                social.label === "WhatsApp" ? "Chat with us on WhatsApp" : `${brand} on ${social.label}`
              }
              className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                style?.bg ?? "border border-border text-ink"
              }`}
            >
              {style?.icon ?? <span className="font-sans text-[11px]">{social.label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
