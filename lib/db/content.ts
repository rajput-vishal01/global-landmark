import { unstable_cache } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { services, textTestimonials } from "./schema";
import { SITE_DATA_TAG } from "./queries";

/**
 * Public read layer for the homepage content blocks — services, written
 * testimonials. Same two rules as lib/db/queries.ts: an explicit column
 * allowlist on every query, and a publication filter so an unpublished row
 * cannot reach a public surface.
 *
 * `newsletter_subscribers` is deliberately absent. Those addresses were
 * given for one purpose and are internal always: the only reads live in the
 * admin screens, which query the table directly. A public helper here would
 * be a loaded gun sitting next to the components that render public pages.
 *
 * Lives in its own file rather than queries.ts because these tables share
 * nothing with the property read layer beyond the cache tag.
 */

const CACHE_OPTS = { revalidate: 3600, tags: [SITE_DATA_TAG] };

/**
 * Fails soft: a marketing block is not worth a 500. Unlike queries.ts's
 * failSoft there is no retry — these sections are optional decoration, so
 * an extra 1.5s of blocked render costs more than the missing block does.
 */
async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.error(`${label} failed:`, err);
    return fallback;
  }
}

const listServicesCached = unstable_cache(
  async () =>
    db
      .select({
        id: services.id,
        title: services.title,
        description: services.description,
        icon: services.icon,
        href: services.href,
      })
      .from(services)
      .where(eq(services.isPublished, true))
      .orderBy(asc(services.sortOrder), asc(services.id)),
  ["listServices"],
  CACHE_OPTS
);

export const listServices = () => safe("listServices", listServicesCached, []);

export type PublicService = Awaited<ReturnType<typeof listServices>>[number];

const listTextTestimonialsCached = unstable_cache(
  async () =>
    db
      .select({
        id: textTestimonials.id,
        quote: textTestimonials.quote,
        author: textTestimonials.author,
        context: textTestimonials.context,
        avatarUrl: textTestimonials.avatarUrl,
      })
      .from(textTestimonials)
      .where(eq(textTestimonials.isPublished, true))
      .orderBy(asc(textTestimonials.sortOrder), asc(textTestimonials.id)),
  ["listTextTestimonials"],
  CACHE_OPTS
);

export const listTextTestimonials = () =>
  safe("listTextTestimonials", listTextTestimonialsCached, []);

export type PublicTextTestimonial = Awaited<
  ReturnType<typeof listTextTestimonials>
>[number];
