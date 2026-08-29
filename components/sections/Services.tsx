import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listServices } from "@/lib/db/content";
import {
  SERVICE_ICONS,
  SERVICE_ICON_FALLBACK,
} from "@/components/service-icons";

/**
 * "Our Services" — the advisory grid (buying/selling, legal, investment,
 * vastu, loan, interiors). Rows are admin-managed; the icons are a fixed
 * inline set looked up by key, see components/service-icons.tsx.
 *
 * Renders nothing until the admin adds a service — an empty grid of
 * hairlines reads as a broken page, not as a section awaiting content.
 */
export async function Services() {
  const items = await listServices();
  if (items.length === 0) return null;

  return (
    <section className="bg-surface px-5 py-16 md:px-12 md:py-24">
      <SectionHeading
        align="center"
        eyebrow="What We Do"
        title="Our Services"
      />

      {/* Hairline grid: the container draws top+left, each cell right+bottom,
          so the rules meet cleanly however many rows the admin creates. */}
      <ul className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
        {items.map((service) => {
          const body = (
            <>
              <span className="text-gold-deep transition-colors duration-300 group-hover:text-ink">
                {SERVICE_ICONS[service.icon ?? ""] ?? SERVICE_ICON_FALLBACK}
              </span>
              <h3 className="font-serif text-h4 text-heading">{service.title}</h3>
              {service.description && (
                <p className="text-pretty text-body font-sans text-ink-muted">
                  {service.description}
                </p>
              )}
            </>
          );

          return (
            <li key={service.id} className="border-b border-r border-border">
              {service.href ? (
                <Link
                  href={service.href}
                  className="group flex h-full flex-col gap-4 p-7 transition-colors duration-300 hover:bg-cream md:p-9"
                >
                  {body}
                </Link>
              ) : (
                <div className="group flex h-full flex-col gap-4 p-7 md:p-9">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
