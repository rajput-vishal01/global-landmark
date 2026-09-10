"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";

/**
 * Approve / decline a public "sell your property" submission.
 *
 * A submission has no lifecycle vocabulary of its own — it is a draft
 * property row with `submittedAt` set. So approving is publishing and
 * declining is archiving, using the same `publication_state` every other
 * listing already uses and the same `isPubliclyVisible()` gate. Inventing
 * an `approved` column beside `published` would give two answers to one
 * question.
 *
 * Both writes are scoped to `submittedAt is not null`, so this action can
 * only ever touch a public submission — it cannot be aimed at an ordinary
 * listing to publish or archive it behind the property form's own
 * validation.
 */

export type SubmissionActionState = { error?: string };

async function setState(
  id: number,
  // "draft" joined the set when a published submission became un-publishable
  // from this screen. Still a closed union rather than a string: the WHERE
  // below is what stops this reaching an ordinary listing, and the type is
  // what stops it reaching a state the property form does not recognise.
  publicationState: "published" | "archived" | "draft"
): Promise<SubmissionActionState> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return { error: "Missing submission id." };

  try {
    // MySQL has no RETURNING on an UPDATE, so the "did this row exist and
    // match?" question is answered by affectedRows instead. The WHERE is
    // unchanged and still carries the isNotNull guard, so this can only ever
    // touch a public submission — an ordinary listing is not reachable here.
    const [result] = await db
      .update(properties)
      .set({ publicationState })
      .where(and(eq(properties.id, id), isNotNull(properties.submittedAt)));

    if (result.affectedRows === 0) return { error: "That submission no longer exists." };
  } catch (err) {
    console.error(`submission ${publicationState} failed for id ${id}:`, err);
    return { error: "Could not update that submission. Try again." };
  }

  revalidatePublicSite();
  return {};
}

export async function approveSubmission(
  _prev: SubmissionActionState,
  formData: FormData
): Promise<SubmissionActionState> {
  return setState(Number(formData.get("id")), "published");
}

export async function declineSubmission(
  _prev: SubmissionActionState,
  formData: FormData
): Promise<SubmissionActionState> {
  return setState(Number(formData.get("id")), "archived");
}

/**
 * Take a published submission back off the website.
 *
 * Back to `draft`, not `archived`. Archiving is the "we are not taking this
 * on" answer to something never published; this is "it was live and now it
 * is not", which leaves the listing in the queue where it can be reviewed
 * and published again. The two decisions read the same in a database column
 * and are completely different to whoever is looking at the screen.
 *
 * The row keeps its submittedAt either way, which is what keeps it visible
 * on this page at all.
 */
export async function unpublishSubmission(
  _prev: SubmissionActionState,
  formData: FormData
): Promise<SubmissionActionState> {
  return setState(Number(formData.get("id")), "draft");
}
