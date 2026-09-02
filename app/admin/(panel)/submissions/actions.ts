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
  publicationState: "published" | "archived"
): Promise<SubmissionActionState> {
  await requireAdmin();
  if (!Number.isInteger(id) || id <= 0) return { error: "Missing submission id." };

  try {
    const updated = await db
      .update(properties)
      .set({ publicationState })
      .where(and(eq(properties.id, id), isNotNull(properties.submittedAt)))
      .returning({ id: properties.id });

    if (!updated.length) return { error: "That submission no longer exists." };
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
