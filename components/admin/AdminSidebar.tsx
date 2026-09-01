"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/admin/LogoutButton";
import { useModalLock } from "@/lib/hooks";

export type NavItem = { label: string; href: string | null };

/** A labelled run of nav items. A group with no heading is a loose row (Dashboard, Settings). */
export type NavGroup = { heading?: string; items: NavItem[] };

/**
 * Sentence case, normal tracking, tight rows.
 *
 * These were uppercase at 0.16em tracking with 2.5-unit padding, which is
 * a fashion-site nav: wide, airy, and slow to scan. A tool's sidebar is a
 * list you read fourteen times an hour, so it wants ordinary word shapes
 * and enough density to see every section without scrolling.
 */
const NAV_ITEM =
  "text-body font-sans font-medium transition-colors block rounded-sm px-3 py-2";

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

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  // Only the MOST specific match highlights. \"Clients\" (/admin/crm) is a
  // prefix of \"Deal Pipeline\" (/admin/crm/deals), so a plain prefix test lit
  // both rows at once and the sidebar looked like it had lost its place.
  const activeHref = nav
    .flatMap((group) => group.items)
    .map((item) => item.href)
    .filter((href): href is string => href !== null && isCurrent(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="flex flex-col gap-3">
      {nav.map((group, i) => (
        <div
          key={group.heading ?? `group-${i}`}
          // A hairline above each labelled run does the separating, so the
          // label itself can be quiet instead of shouting to mark a boundary.
          className={`flex flex-col gap-0.5 ${
            group.heading ? "mt-1 border-t border-border/70 pt-4" : ""
          }`}
        >
          {group.heading && (
            <h2 className="nav-group-heading px-3 pb-1.5 font-sans text-ink-muted/60">
              {group.heading}
            </h2>
          )}
          {group.items.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                aria-current={item.href === activeHref ? "page" : undefined}
                className={`${NAV_ITEM} ${
                  item.href === activeHref
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
        </div>
      ))}
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
  nav: NavGroup[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Escape closes it, and the page behind stops scrolling — without the
  // lock, a swipe inside the drawer scrolls the list underneath it.
  useModalLock(
    open,
    useCallback(() => setOpen(false), [])
  );

  const brand = (
    // One line, not two: the wordmark was a 24px serif that wrapped in a
    // 224px rail and cost more vertical space than three nav items.
    <Link href="/admin" className="flex items-baseline gap-2 px-3 py-1">
      <span className="truncate font-sans text-meta font-semibold tracking-tight text-ink">
        {companyName}
      </span>
      <span className="text-eyebrow shrink-0 font-sans font-medium uppercase tracking-[0.14em] text-gold-deep">
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
          {/* overflow-y-auto is load-bearing: sixteen items under five
              headings is taller than a short phone, and without it the
              bottom of the nav and the log-out button are unreachable. */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto overscroll-contain border-r border-border bg-cream p-5">
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
