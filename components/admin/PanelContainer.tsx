"use client";

import { usePathname } from "next/navigation";

/**
 * The panel's content column. Every screen is capped at max-w-6xl, which is
 * the right measure for a form or a table — except the deal pipeline, whose
 * board is eight stage columns wide and spent that cap entirely on a
 * horizontal scrollbar.
 *
 * A client component only because a layout cannot see the pathname. Children
 * are still server-rendered and pass straight through, so nothing here ends
 * up in the client bundle but the pathname check.
 */
const FULL_WIDTH_ROUTES = ["/admin/crm/deals"];

export function PanelContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const full = FULL_WIDTH_ROUTES.includes(pathname);
  return (
    <div className={full ? "w-full" : "mx-auto max-w-6xl"}>{children}</div>
  );
}
