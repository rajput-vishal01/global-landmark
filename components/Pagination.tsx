import Link from "next/link";
import { propertiesHref, type PropertiesFilterParams } from "@/lib/properties-url";

/**
 * R-75: prev/next + page numbers for /properties. URL is the state — no
 * client JS, so it composes with every other filter link on the page and
 * survives refresh/back-button the same way they do.
 */
export function Pagination({
  page,
  totalPages,
  current,
}: {
  page: number;
  totalPages: number;
  current: PropertiesFilterParams;
}) {
  if (totalPages <= 1) return null;

  // Windowed page numbers (current ± 2) rather than every page — a few
  // hundred listings would otherwise print a few hundred links.
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const linkFor = (p: number) =>
    propertiesHref(current, { page: p > 1 ? String(p) : undefined }, "listings");

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-6">
      {page > 1 ? (
        <Link
          href={linkFor(page - 1)}
          className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
        >
          Previous
        </Link>
      ) : (
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted/40">
          Previous
        </span>
      )}

      <ul className="flex items-center gap-3">
        {pages.map((p) => (
          <li key={p}>
            <Link
              href={linkFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={`flex h-8 w-8 items-center justify-center font-sans text-meta transition-colors ${
                p === page ? "bg-ink text-cream" : "text-ink-muted hover:text-ink"
              }`}
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>

      {page < totalPages ? (
        <Link
          href={linkFor(page + 1)}
          className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
        >
          Next
        </Link>
      ) : (
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted/40">
          Next
        </span>
      )}
    </nav>
  );
}
