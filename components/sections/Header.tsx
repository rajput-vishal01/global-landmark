"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HEADER_LINKS } from "./nav-links";
import { FullscreenMenu } from "./FullscreenMenu";
import { COMPANY } from "@/lib/data";

/**
 * Three-zone header: plain links left, serif wordmark center, CONTACT +
 * hamburger right. Transparent over the hero, solid after.
 *
 * The bar used to slide out of view on scroll-down and return on scroll-up.
 * Phase A dropped that: it is motion the user did not ask for, and a nav
 * that comes and goes is exactly the kind of restlessness the client was
 * reacting to. The bar is now simply always there.
 *
 * What stays is the transparent → solid switch, which is a colour change
 * rather than movement, and it earns its keep — the header sits over a dark
 * hero image and would be unreadable against the page below it otherwise.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tone = scrolled ? "text-ink" : "text-cream";
  const toneMuted = scrolled ? "text-ink-muted hover:text-ink" : "text-cream/80 hover:text-cream";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled ? "border-b border-border bg-surface/95 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-5 sm:py-5 md:px-12">
        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-eyebrow font-sans font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${toneMuted}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span aria-hidden className="lg:hidden" />

        <Link
          href="/"
          className={`flex items-center gap-2.5 justify-self-center whitespace-nowrap font-serif uppercase transition-colors duration-500 sm:gap-3 ${tone}`}
        >
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            priority
            className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12 md:h-14 md:w-14"
          />
          <span className="text-base tracking-[0.12em] sm:text-xl sm:tracking-[0.18em] md:text-2xl">
            {COMPANY.name}
          </span>
        </Link>

        <div className="flex items-center justify-end gap-5 sm:gap-6 md:gap-8">
          <Link
            href="/contact"
            className={`text-eyebrow hidden font-sans font-medium uppercase tracking-[0.18em] transition-colors duration-300 md:inline-block ${toneMuted}`}
          >
            Contact
          </Link>
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
