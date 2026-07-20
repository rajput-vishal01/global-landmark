import { revalidatePath, updateTag } from "next/cache";
import { SITE_DATA_TAG } from "@/lib/db/queries";

/**
 * Busts both cache layers after an admin mutation — the tagged query cache
 * (updateTag = immediate expiry, not stale-while-revalidate) and the ISR
 * page cache — so the public site reflects the change immediately.
 */
export function revalidatePublicSite(): void {
  updateTag(SITE_DATA_TAG);
  revalidatePath("/", "layout");
}
