"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmDeals, crmPayments } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { DEAL_STAGES, percentToBp, type DealStage } from "@/lib/taxonomy/brokerage";

export type DealFormState = { error?: string };
export type PaymentFormState = { error?: string };

function isDealStage(v: string): v is DealStage {
  return (DEAL_STAGES as readonly string[]).includes(v);
}

/** Whole-rupee money field. Empty box -> null, never NaN. */
function parseMoney(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? n : null;
}

/**
 * R-31: `closedAt` is set only on the specific transition INTO "Closed",
 * and only once — a deal re-saved while already Closed must not have its
 * closedAt (and therefore "this month's closed value") silently drift.
 */
function nextClosedAt(
  existingStage: string,
  existingClosedAt: Date | null,
  newStage: string
): Date | null {
  if (newStage === "Closed" && existingStage !== "Closed" && !existingClosedAt) {
    return new Date();
  }
  return existingClosedAt;
}

/** Shared field parse for create/update — client and stage are handled by each caller. */
function parseSharedFields(formData: FormData) {
  const propertyIdRaw = String(formData.get("propertyId") ?? "").trim();
  const propertyId = propertyIdRaw ? Number(propertyIdRaw) : null;

  const percentRaw = String(formData.get("brokeragePercent") ?? "").trim();
  const brokeragePercentBp = percentRaw ? percentToBp(Number(percentRaw)) : null;

  return {
    propertyId,
    propertyIdInvalid: Boolean(propertyIdRaw) && !Number.isInteger(propertyId),
    dealValue: parseMoney(formData, "dealValue"),
    brokeragePercentBp,
    brokerageAmountOverride: parseMoney(formData, "brokerageAmountOverride"),
    sharedWithName: String(formData.get("sharedWithName") ?? "").trim().slice(0, 200) || null,
    sharedAmount: parseMoney(formData, "sharedAmount"),
    assignedTo: String(formData.get("assignedTo") ?? "").trim().slice(0, 200) || null,
  };
}

export async function createDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  await requireAdmin();

  const clientId = Number(formData.get("clientId"));
  if (!Number.isInteger(clientId) || clientId <= 0) return { error: "Select a client." };

  const fields = parseSharedFields(formData);
  if (fields.propertyIdInvalid) return { error: "Invalid property." };

  let id: number;
  try {
    const [row] = await db
      .insert(crmDeals)
      .values({
        clientId,
        propertyId: fields.propertyId,
        stage: "Enquiry",
        dealValue: fields.dealValue,
        brokeragePercent: fields.brokeragePercentBp,
        brokerageAmountOverride: fields.brokerageAmountOverride,
        sharedWithName: fields.sharedWithName,
        sharedAmount: fields.sharedAmount,
        assignedTo: fields.assignedTo,
      })
      .$returningId();
    id = row.id;
  } catch (err) {
    console.error("createDeal failed:", err);
    return { error: "Could not create the deal. Try again." };
  }
  revalidatePath("/admin/crm/deals");
  redirect(`/admin/crm/deals/${id}`);
}

/** Full field edit from the deal detail page — everything but client/property, which are fixed at creation. */
export async function updateDeal(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing deal id." };

  const stage = String(formData.get("stage") ?? "");
  if (!isDealStage(stage)) return { error: "Invalid stage." };

  const fields = parseSharedFields(formData);

  try {
    const [existing] = await db
      .select({ stage: crmDeals.stage, closedAt: crmDeals.closedAt })
      .from(crmDeals)
      .where(eq(crmDeals.id, id));
    if (!existing) return { error: "Deal not found." };

    await db
      .update(crmDeals)
      .set({
        stage,
        dealValue: fields.dealValue,
        brokeragePercent: fields.brokeragePercentBp,
        brokerageAmountOverride: fields.brokerageAmountOverride,
        sharedWithName: fields.sharedWithName,
        sharedAmount: fields.sharedAmount,
        assignedTo: fields.assignedTo,
        closedAt: nextClosedAt(existing.stage, existing.closedAt, stage),
        updatedAt: new Date(),
      })
      .where(eq(crmDeals.id, id));
  } catch (err) {
    console.error("updateDeal failed:", err);
    return { error: "Could not save the deal. Try again." };
  }
  revalidatePath("/admin/crm/deals");
  revalidatePath(`/admin/crm/deals/${id}`);
  return {};
}

/** Quick per-card stage change from the pipeline board — stage only. */
export async function updateDealStage(
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing deal id." };

  const stage = String(formData.get("stage") ?? "");
  if (!isDealStage(stage)) return { error: "Invalid stage." };

  try {
    const [existing] = await db
      .select({ stage: crmDeals.stage, closedAt: crmDeals.closedAt })
      .from(crmDeals)
      .where(eq(crmDeals.id, id));
    if (!existing) return { error: "Deal not found." };

    await db
      .update(crmDeals)
      .set({
        stage,
        closedAt: nextClosedAt(existing.stage, existing.closedAt, stage),
        updatedAt: new Date(),
      })
      .where(eq(crmDeals.id, id));
  } catch (err) {
    console.error("updateDealStage failed:", err);
    return { error: "Could not update stage." };
  }
  revalidatePath("/admin/crm/deals");
  return {};
}

export async function addPayment(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  await requireAdmin();

  const dealId = Number(formData.get("dealId"));
  if (!Number.isInteger(dealId)) return { error: "Missing deal id." };

  const amount = parseMoney(formData, "amount");
  if (amount == null || amount <= 0) return { error: "Enter a valid amount." };

  const paidAt = String(formData.get("paidAt") ?? "").trim();
  if (!paidAt) return { error: "Enter the payment date." };

  const mode = String(formData.get("mode") ?? "").trim().slice(0, 60) || null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  try {
    await db.insert(crmPayments).values({ dealId, amount, paidAt, mode, note });
  } catch (err) {
    console.error("addPayment failed:", err);
    return { error: "Could not save the payment. Try again." };
  }
  revalidatePath(`/admin/crm/deals/${dealId}`);
  revalidatePath("/admin/crm/deals");
  return {};
}
