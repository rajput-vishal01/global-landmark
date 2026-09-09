"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { isLeadStatus } from "@/lib/taxonomy/leads";
import { convertLeadToClient } from "../crm/client-actions";
import type { DeleteState } from "../properties/actions";

export type LeadFormState = { error?: string };

/**
 * Inline row edit: status + assignment together, one round trip. No
 * `redirect()` — the admin stays on whatever filtered/paginated view they
 * were on, and `revalidatePath` is what makes the action's response carry a
 * fresh render (Next 16: without it the action returns only its state, not
 * updated UI — see node_modules/next/dist/docs/.../server-actions.md).
 */
export async function updateLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing lead id." };

  const status = String(formData.get("status") ?? "");
  if (!isLeadStatus(status)) return { error: "Invalid status." };

  const assignedTo = String(formData.get("assignedTo") ?? "").trim().slice(0, 200) || null;

  try {
    await db.update(leads).set({ status, assignedTo }).where(eq(leads.id, id));
  } catch (err) {
    console.error("updateLead failed:", err);
    return { error: "Could not save. Try again." };
  }
  revalidatePath("/admin/leads");
  return {};
}

/**
 * Plain form action wrapping crm/client-actions.ts's convertLeadToClient,
 * which takes a bare id, not FormData — a `<form action>` needs the latter.
 * requireAdmin() runs again here too: this file's own actions must not
 * depend on a sibling route's action already having gated the request.
 */
export async function convertLead(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await convertLeadToClient(id);
}

/**
 * Delete a lead.
 *
 * No reference guard, unlike deleteClient. The only foreign key pointing here
 * is crm_clients.converted_from_lead_id, and it is ON DELETE SET NULL — so
 * deleting a converted lead drops the "came from lead #N" provenance link and
 * destroys nothing. That is a fair trade for clearing spam out of the inbox,
 * which is what this is for.
 *
 * Contrast deleteClient, which refuses while deals exist: there the chain is
 * CASCADE all the way down to crm_payments, so the same gesture would take
 * the brokerage history with it.
 */
export async function deleteLead(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing lead id." };

  try {
    await db.delete(leads).where(eq(leads.id, id));
  } catch (err) {
    console.error("deleteLead failed:", err);
    return { error: "Delete failed. Try again." };
  }

  revalidatePath("/admin/leads");
  return {};
}
