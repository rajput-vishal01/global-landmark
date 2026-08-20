"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/admin/LogoutButton";

export type NavItem = { label: string; href: string | null };

const NAV_ITEM =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.16em] transition-colors block px-3 py-2.5";

/**
 * A route is "current" if it's an exact match, or the sidebar's target is a
 * real prefix of it (`/admin/properties/9/edit` still highlights
 * "Properties") — but `/admin` itself only matches `/admin` exactly, or
 * every other item would light up alongside its own on every panel page.
 */
function isCurrent(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ nav, pathname, onNavigate }: { nav: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            className={`${NAV_ITEM} ${
              isCurrent(pathname, item.href)
                ? "border-l-2 border-gold bg-gold/10 text-ink"
                : "border-l-2 border-transparent text-ink-muted hover:border-border hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            aria-disabled="true"
            title="Not built yet"
            className={`${NAV_ITEM} cursor-default border-l-2 border-transparent text-ink-muted/40`}
          >
            {item.label}
          </span>
        )
      )}
    </nav>
  );
}

/**
 * Sidebar dashboard shell (R-33). Fixed left column on desktop; a slim top
 * bar with an off-canvas drawer below md — a phone at a site visit still
 * gets the full nav, it just isn't permanently on screen eating width from
 * a form that's already asking for a lot on a small screen.
 *
 * No motion library for the drawer (R-33: "no scroll animation, no Lenis,
 * no GSAP" — the admin is a tool): a plain CSS transform toggled by React
 * state is enough for an open/close slide.
 */
export function AdminSidebar({
  companyName,
  nav,
}: {
  companyName: string;
  nav: NavItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brand = (
    <Link href="/admin" className="flex items-baseline gap-2.5 px-3 py-1">
      <span className="font-serif text-lg uppercase tracking-[0.16em] text-ink">
        {companyName}
      </span>
      <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.3em] text-gold-deep">
        Admin
      </span>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 md:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="cursor-pointer p-2 text-ink"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Off-canvas drawer (mobile only) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-dark-deep/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 border-r border-border bg-cream p-5">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="cursor-pointer p-2 text-ink-muted hover:text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
            </div>
            <NavLinks nav={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-border pt-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-8 md:overflow-y-auto md:border-r md:border-border md:bg-white md:px-4 md:py-6">
        {brand}
        <NavLinks nav={nav} pathname={pathname} />
        <div className="mt-auto border-t border-border pt-4">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
