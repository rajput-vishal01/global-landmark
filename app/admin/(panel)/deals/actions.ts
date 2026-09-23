"use server";

import { idField } from "@/lib/admin/form-fields";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, properties } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { isDate, overlaps, rangeLabel, repeatWindow } from "@/lib/week";
import type { DeleteState } from "../properties/actions";

export type DealFormState = { error?: string };

/** At most a dozen runs queued at once — beyond that it is guesswork, not planning. */
const MAX_RUNS = 12;

/**
 * Schedules one listing as the Deal of the Week, for one week or several in
 * a row.
 *
 * The dates are the admin's own: a sale can open on any day and run for
 * as long as it runs. Repeat queues the same length again, back to back, so
 * a standing weekly deal is one save rather than one a week.
 */
export async function createDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  await requireAdmin();
  const propertyId = idField(formData, "propertyId");
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const repeat = Number(formData.get("repeat") ?? 1);

  if (propertyId === null) return { error: "Choose a property." };
  if (!isDate(startsAt) || !isDate(endsAt)) return { error: "Pick the dates this deal runs." };
  if (endsAt < startsAt) return { error: "The end date must be on or after the start date." };
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > MAX_RUNS) {
    return { error: `Repeat between 1 and ${MAX_RUNS} times.` };
  }

  const windows = repeatWindow(startsAt, endsAt, repeat);

  try {
    const [target] = await db
      .select({ state: properties.publicationState, status: properties.listingStatus })
      .from(properties)
      .where(eq(properties.id, propertyId));
    if (!target || target.state !== "published" || target.status !== "Available") {
      return { error: "Only a listing that is live on the website can be the deal." };
    }

    // One deal per week. The landing page shows whichever window covers
    // today, so two overlapping windows mean one of them silently never
    // appears. Refused with the week named, rather than quietly moved.
    const booked = await db
      .select({ startsAt: deals.startsAt, endsAt: deals.endsAt })
      .from(deals);
    const clash = windows.find((w) => booked.some((b) => overlaps(w, b)));
    if (clash) {
      return {
        error: `${rangeLabel(clash.startsAt, clash.endsAt)} already has a deal. Remove that one first, or pick other dates.`,
      };
    }

    await db.insert(deals).values(windows.map((w) => ({ propertyId, ...w })));
  } catch (err) {
    console.error("createDeal failed:", err);
    return { error: "Could not save the deal. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/deals");
}

export async function deleteDeal(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = idField(formData);
  if (id === null) return { error: "Missing deal id." };
  try {
    await db.delete(deals).where(eq(deals.id, id));
  } catch (err) {
    console.error("deleteDeal failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/deals");
}
