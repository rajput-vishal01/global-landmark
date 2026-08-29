"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HEADER_LINKS } from "./nav-links";
import { FullscreenMenu } from "./FullscreenMenu";
import { COMPANY } from "@/lib/data";

/**
 * Portal-style header: wordmark left, nav right, phone last.
 *
 * Restructured from a three-zone bar (links left / centred wordmark /
 * contact right) at the client's request, to read like a conventional
 * property portal. The centred wordmark looked like a magazine masthead —
 * fine for an editorial site, wrong for one where people arrive wanting to
 * search and call. Putting the number in the bar is the substantive part of
 * the change: on a brokerage site the phone IS the conversion.
 *
 * The bar used to slide out of view on scroll-down and return on scroll-up.
 * Phase A dropped that — a nav that comes and goes is exactly the
 * restlessness the client reacted to. What stays is the transparent → solid
 * switch, a colour change rather than movement, and it earns its keep: the
 * header sits over a dark hero image and would be unreadable against the
 * white page below it otherwise.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Switch shortly after the hero's own height so the bar turns solid as
    // the white page arrives under it, not while it is still over the image.
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tone = scrolled ? "text-ink" : "text-cream";
  const toneMuted = scrolled
    ? "text-ink-muted hover:text-ink"
    : "text-cream/85 hover:text-cream";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled
          ? "border-b border-border bg-surface/95 backdrop-blur-sm"
          : "bg-gradient-to-b from-black/55 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4 md:px-10">
        <Link
          href="/"
          className={`flex items-center gap-2.5 whitespace-nowrap font-serif uppercase transition-colors duration-500 sm:gap-3 ${tone}`}
        >
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            priority
            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
          />
          <span className="text-sm tracking-[0.12em] sm:text-lg sm:tracking-[0.16em] md:text-xl">
            {COMPANY.name}
          </span>
        </Link>

        <div className="flex items-center gap-5 md:gap-7">
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {HEADER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-eyebrow font-sans font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${toneMuted}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={`text-eyebrow font-sans font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${toneMuted}`}
            >
              Contact
            </Link>
          </nav>

          {/* The phone number is a real tel: link, not decoration — on a
              brokerage site it is the shortest path from interest to a
              conversation, and it is the one thing the reference keeps
              visible at every breakpoint above a phone. */}
          <a
            href={COMPANY.phoneHref}
            className={`hidden items-center gap-2 font-sans text-meta font-medium tracking-wide transition-colors duration-300 sm:flex ${tone}`}
          >
            <svg
              aria-hidden
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="text-cta"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            {COMPANY.phone}
          </a>

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className={`flex h-10 w-8 flex-col items-end justify-center gap-[5px] transition-colors duration-300 ${tone}`}
          >
            <span className="block h-px w-6 bg-current" />
            <span className="block h-px w-6 bg-current" />
          </button>
        </div>
      </div>

      <FullscreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
