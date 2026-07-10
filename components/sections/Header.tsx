"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HEADER_LINKS } from "./nav-links";
import { FullscreenMenu } from "./FullscreenMenu";
import { useGSAP, gsap, ScrollTrigger, EASE_HEAVY } from "@/lib/gsap";

/**
 * Three-zone header: plain links left, serif wordmark center, CONTACT +
 * hamburger right. Transparent over the hero, solid cream after. Hides on
 * scroll-down, returns on scroll-up.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const hide = gsap.quickTo(headerRef.current, "yPercent", {
        duration: 0.6,
        ease: EASE_HEAVY,
      });
      ScrollTrigger.create({
        start: 200,
        end: "max",
        onUpdate: (self) => hide(self.direction === 1 ? -100 : 0),
      });
    });
  }, []);

  // Keep the bar visible while the fullscreen menu is open.
  useEffect(() => {
    if (menuOpen && headerRef.current) {
      gsap.to(headerRef.current, { yPercent: 0, duration: 0.3 });
    }
  }, [menuOpen]);

  const tone = scrolled ? "text-ink" : "text-cream";
  const toneMuted = scrolled ? "text-ink-muted hover:text-ink" : "text-cream/80 hover:text-cream";

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled ? "border-b border-border bg-cream/95 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-5 md:px-12">
        <nav className="hidden items-center gap-8 lg:flex">
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
          className={`justify-self-center whitespace-nowrap font-serif text-xl uppercase tracking-[0.18em] transition-colors duration-500 md:text-2xl ${tone}`}
        >
          Global Landmark
        </Link>

        <div className="flex items-center justify-end gap-6 md:gap-8">
          <Link
            href="/contact"
            className={`text-eyebrow hidden font-sans font-medium uppercase tracking-[0.18em] transition-colors duration-300 md:inline-block ${toneMuted}`}
          >
            Contact
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className={`flex flex-col gap-[5px] transition-colors duration-300 ${tone}`}
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
