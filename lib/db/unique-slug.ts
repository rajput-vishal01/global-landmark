import { eq, ilike, or } from "drizzle-orm";
import { db } from "./index";
import { properties } from "./schema";
import { slugify } from "@/lib/slugify";

/**
 * First free slug of the form `base`, `base-2`, `base-3`, ...
 *
 * Only the rows that could actually collide are read — `slug = base OR slug
 * LIKE 'base-%'` — instead of the whole table. The old version selected every
 * property on every save, which was invisible at six listings and becomes a
 * full scan per keystroke-batch once the form autosaves every ~20 seconds
 * against a real portfolio (GAP-01).
 *
 * The LIKE pattern is escaped: slugify() cannot emit `%` or `_` today, but
 * this function should not silently depend on that.
 *
 * Lives here rather than in the admin actions file because the public
 * "list your property" form needs it too, and that file is "use server" —
 * exporting a helper from it would publish a callable endpoint.
 */
export async function uniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title) || "property";
  const pattern = `${base.replace(/[%_\\]/g, "\\$&")}-%`;
  const existing = await db
    .select({ id: properties.id, slug: properties.slug })
    .from(properties)
    .where(or(eq(properties.slug, base), ilike(properties.slug, pattern)));

  const taken = new Set(
    existing.filter((row) => row.id !== excludeId).map((row) => row.slug)
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  }
}
