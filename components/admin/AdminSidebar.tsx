"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/app/admin/LogoutButton";
import { InstallButton } from "@/components/InstallButton";
import { useModalLock } from "@/lib/hooks";

export type NavItem = { label: string; href: string | null };

/** A labelled run of nav items. A group with no heading is a loose row. */
export type NavGroup = { heading?: string; items: NavItem[] };

/**
 * The rail, rebuilt to the desk reference.
 *
 * Two things changed and they are the whole difference. A row is marked by a
 * 6px dot and a 3px INSET gold rule on its leading edge — inset rather than a
 * border, because a border shifts the label sideways by 3px every time the
 * route changes. And the group label is a quiet caption above its run rather
 * than a heading with a hairline over it, so the eye reads five short lists
 * instead of five boxed sections.
 *
 * Measurements live in the `.admin-panel .desk-*` block in globals.css. They
 * are CSS rather than utilities because they are chrome the whole panel shares
 * and nothing overrides per instance.
 */

/**
 * A route is "current" if it's an exact match, or the target is a real prefix
 * of it (`/admin/properties/9/edit` still marks "Properties") — but `/admin`
 * only ever matches itself, or every row would light up on every page.
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
  // Only the MOST specific match marks. "Clients" (/admin/crm) is a prefix of
  // "Deal Pipeline" (/admin/crm/deals), so a plain prefix test lit both rows
  // at once and the rail looked like it had lost its place.
  const activeHref = nav
    .flatMap((group) => group.items)
    .map((item) => item.href)
    .filter((href): href is string => href !== null && isCurrent(pathname, href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="desk-nav flex-1 overflow-y-auto" aria-label="Admin sections">
      {nav.map((group, i) => (
        <div key={group.heading ?? `group-${i}`} className="desk-navgroup">
          {group.heading && (
            // Still a real <h2> — it groups the nav for a screen reader — but
            // dressed as the quiet caption it is.
            <h2 className="desk-eyebrow px-3">{group.heading}</h2>
          )}
          <ul className="desk-navlist">
            {group.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={item.href === activeHref ? "page" : undefined}
                    className={
                      item.href === activeHref ? "desk-navitem is-active" : "desk-navitem"
                    }
                  >
                    <span aria-hidden="true" className="desk-dot" />
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Not built yet"
                    className="desk-navitem cursor-default opacity-40"
                  >
                    <span aria-hidden="true" className="desk-dot" />
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({
  companyName,
  nav,
}: {
  companyName: string;
  nav: NavGroup[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Escape closes it, and the page behind stops scrolling — without the lock,
  // a swipe inside the drawer scrolls the list underneath it.
  useModalLock(
    open,
    useCallback(() => setOpen(false), [])
  );

  const wordmark = (
    <Link href="/admin" onClick={() => setOpen(false)} className="min-w-0">
      <span className="desk-wordmark-title block truncate">{companyName}</span>
      <span className="desk-wordmark-sub block">Admin desk</span>
    </Link>
  );

  const panel = (
    <div className="flex h-full flex-col">
      <div className="desk-wordmark flex items-start justify-between gap-2">
        {wordmark}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          className="cursor-pointer rounded-lg p-1.5 text-soft transition-colors hover:bg-surface hover:text-ink md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l16 16M20 4L4 20" />
          </svg>
        </button>
      </div>

      <NavLinks nav={nav} pathname={pathname} onNavigate={() => setOpen(false)} />

      <div className="desk-foot flex flex-col gap-2">
        <InstallButton className="text-left text-[11px] text-muted transition-colors hover:text-ink" />
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile bar. Below md the rail would eat most of a phone screen. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line-soft bg-raise/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="cursor-pointer rounded-lg p-2 text-soft transition-colors hover:bg-surface hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className="desk-wordmark-title truncate">{companyName}</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-dark-deep/50"
          />
          {/* overflow is on the nav inside, not here: the wordmark and the
              footer stay put while only the list of rows scrolls. */}
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-raise">
            {panel}
          </div>
        </div>
      )}

      <aside className="desk-rail hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-line-soft md:bg-raise">
        {panel}
      </aside>
    </>
  );
}
