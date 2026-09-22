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
    // Ivory, not champagne: the About band that follows is champagne, and
    // two champagne bands in a row read as one section.
    <section className="bg-surface px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What We Do"
          title="Our Services"
        />

        {/* Numbered cards rather than a hairline table: each service is a
            thing you can ask for, and a card with a number, an icon and a
            lift on hover says so. */}
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((service, i) => {
            const body = (
              <>
                <div className="flex items-start justify-between">
                  <span
                    aria-hidden
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-surface text-gold-deep transition-colors duration-300 group-hover:border-gold group-hover:bg-gold/10"
                  >
                    {SERVICE_ICONS[service.icon ?? ""] ?? SERVICE_ICON_FALLBACK}
                  </span>
                  <span aria-hidden className="font-serif text-h3 leading-none text-gold/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-serif text-h4 text-heading">{service.title}</h3>
                {service.description && (
                  <p className="mt-2 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                    {service.description}
                  </p>
                )}
                {service.href && (
                  <span className="text-eyebrow mt-auto inline-flex items-center gap-2 pt-6 font-sans font-bold uppercase tracking-[0.16em] text-ink transition-colors group-hover:text-gold-deep">
                    Learn more
                    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-hover:translate-x-1">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                )}
              </>
            );
            const card =
              "group flex h-full flex-col border border-border bg-white p-7 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_24px_48px_-28px_rgba(40,30,15,0.45)] md:p-8";

            return (
              <li key={service.id}>
                {service.href ? (
                  <Link href={service.href} className={card}>
                    {body}
                  </Link>
                ) : (
                  <div className={card}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
