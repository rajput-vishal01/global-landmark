"use server";

import { idField } from "@/lib/admin/form-fields";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, properties } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { isDate, overlaps, weekLabel, weeksFrom } from "@/lib/week";
import type { DeleteState } from "../properties/actions";

export type DealFormState = { error?: string };

/** At most three months queued at once — beyond that it is guesswork, not planning. */
const MAX_WEEKS = 12;

/**
 * Schedules one listing as the Deal of the Week, for one week or several in
 * a row.
 *
 * A week, not two loose dates: the strip is called Deal of the WEEK, every
 * window runs Monday to Sunday, and picking a start and an end by hand is
 * where off-by-one windows come from. The form sends the week the admin
 * clicked and how many weeks to repeat; the Monday and the Sunday are worked
 * out from that.
 */
export async function createDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  await requireAdmin();
  const propertyId = idField(formData, "propertyId");
  const weekStart = String(formData.get("weekStart") ?? "");
  const weeks = Number(formData.get("weeks") ?? 1);

  if (propertyId === null) return { error: "Choose a property." };
  if (!isDate(weekStart)) return { error: "Pick the week this deal runs." };
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) {
    return { error: `Repeat between 1 and ${MAX_WEEKS} weeks.` };
  }

  const windows = weeksFrom(weekStart, weeks);

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
        error: `${weekLabel(clash.startsAt)} already has a deal. Remove that one first, or start a week later.`,
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
