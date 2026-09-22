"use server";

import { idField } from "@/lib/admin/form-fields";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tourRequests } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { isTourStatus } from "@/lib/taxonomy/tours";
import type { DeleteState } from "../properties/actions";

export type TourFormState = { error?: string };

/**
 * Inline row edit for the tour inbox — status only, one round trip.
 *
 * No `redirect()`: the admin stays on whatever page of the inbox they were
 * on, and `revalidatePath` is what makes the action's response carry a fresh
 * render (Next 16: without it the action returns only its state, not
 * updated UI — see node_modules/next/dist/docs/.../server-actions.md).
 */
export async function updateTourRequest(
  _prev: TourFormState,
  formData: FormData
): Promise<TourFormState> {
  await requireAdmin();

  const id = idField(formData);
  if (id === null) return { error: "Missing request id." };

  const status = String(formData.get("status") ?? "");
  if (!isTourStatus(status)) return { error: "Invalid status." };

  try {
    await db.update(tourRequests).set({ status }).where(eq(tourRequests.id, id));
  } catch (err) {
    console.error("updateTourRequest failed:", err);
    return { error: "Could not save. Try again." };
  }

  revalidatePath("/admin/tours");
  // House rule: every mutating admin action busts the public caches. A tour
  // status changes nothing a visitor sees, so this is belt-and-braces — but
  // "which mutations are safe to skip" is exactly the judgment that goes
  // wrong quietly, so the rule stays unconditional.
  revalidatePublicSite();
  return {};
}

/**
 * Delete a tour request — clearing spam out of the inbox, the same gesture
 * as deleteLead. Nothing references tour_requests, so nothing else goes.
 */
export async function deleteTourRequest(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = idField(formData);
  if (id === null) return { error: "Missing request id." };

  try {
    await db.delete(tourRequests).where(eq(tourRequests.id, id));
  } catch (err) {
    console.error("deleteTourRequest failed:", err);
    return { error: "Delete failed. Try again." };
  }

  revalidatePath("/admin/tours");
  revalidatePublicSite();
  return {};
}
