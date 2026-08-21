import Link from "next/link";

export type BreadcrumbItem = { name: string; path: string };

/**
 * Visible breadcrumb trail — pairs with lib/seo.ts's breadcrumbJsonLd(), which
 * takes the same {name, path}[] shape for the schema.org half. Callers build
 * one array and pass it to both.
 */
export function Breadcrumbs({
  items,
  tone = "light",
}: {
  items: BreadcrumbItem[];
  tone?: "light" | "dark";
}) {
  const textTone = tone === "dark" ? "text-cream/70" : "text-ink-muted";
  const currentTone = tone === "dark" ? "text-cream" : "text-ink";

  return (
    <nav aria-label="Breadcrumb" className={`text-eyebrow font-sans font-medium uppercase tracking-[0.2em] ${textTone}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className={currentTone}>
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="transition-colors hover:text-gold">
                  {item.name}
                </Link>
              )}
              {!isLast && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
