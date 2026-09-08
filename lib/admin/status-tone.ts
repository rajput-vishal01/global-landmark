import type { ChipTone } from "@/components/admin/desk";
import type { ListingStatus } from "@/lib/taxonomy/status";

/**
 * Listing status as a desk Chip tone.
 *
 * Lives here rather than beside the statuses themselves in lib/taxonomy/,
 * because scripts/check-taxonomy.mjs compiles those files standalone with a
 * bare `tsc` — no path aliases — to keep them dependency-light. A `@/` import
 * in there fails that check, which is the check doing its job: a taxonomy is
 * data, and it should not need a React component to compile.
 *
 * Replaces STATUS_BADGE, which handed out a border/background/text triple per
 * status and produced seven differently-coloured square badges. The desk draws
 * a state as one coloured spine beside its word, so a column of them scans as
 * a row of edges and only the row you stopped at gets read.
 *
 * The ordering follows the gold ramp rather than a red/amber/green set, which
 * the brand has no second hue for: available is live, the two in-progress
 * states are quiet, the two terminal ones are strong, and only Hold — a
 * listing stuck on something someone has to resolve — takes alert.
 */
export const STATUS_TONE: Record<ListingStatus, ChipTone> = {
  Available: "live",
  Reserved: "quiet",
  "Token Received": "quiet",
  "Under Agreement": "neutral",
  Sold: "strong",
  Rented: "strong",
  Hold: "alert",
};
