"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import type { DeleteState } from "../properties/actions";

export type DealFormState = { error?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function createDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  await requireAdmin();
  const propertyId = Number(formData.get("propertyId"));
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");

  if (!Number.isInteger(propertyId)) return { error: "Choose a property." };
  if (!DATE_RE.test(startsAt) || !DATE_RE.test(endsAt)) {
    return { error: "Both dates are required." };
  }
  if (endsAt < startsAt) {
    return { error: "The end date must be on or after the start date." };
  }

  try {
    await db.insert(deals).values({ propertyId, startsAt, endsAt });
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
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing deal id." };
  try {
    await db.delete(deals).where(eq(deals.id, id));
  } catch (err) {
    console.error("deleteDeal failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/deals");
}
