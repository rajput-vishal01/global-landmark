import { revalidatePath, updateTag } from "next/cache";
import { SITE_DATA_TAG } from "@/lib/db/queries";

/**
 * Busts both cache layers after an admin mutation — the tagged query cache
 * (updateTag = immediate expiry, not stale-while-revalidate) and the ISR
 * page cache. Only the property-bearing routes are revalidated: a layout-
 * wide purge would also wipe /news's 12h newsdata.io fetch cache and burn
 * its small API quota on every admin save.
 */
export function revalidatePublicSite(): void {
  updateTag(SITE_DATA_TAG);
  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath("/properties/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
