"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmActivities, crmClients, crmDeals, leads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import { ACTIVITY_KINDS } from "@/lib/taxonomy/activities";
import { textField, moneyField } from "@/lib/admin/form-fields";

export type ClientFormState = { error?: string };



/** ChecklistField emits its selection as a JSON array in a hidden input. */
function jsonStringArray(formData: FormData, key: string): string[] {
  const raw = formData.get(key);
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, 60)
      : [];
  } catch {
    return [];
  }
}

function parseClient(formData: FormData) {
  return {
    phone: textField(formData, "phone", 30),
    email: textField(formData, "email", 200),
    requirementNotes: textField(formData, "requirementNotes", 4000),
    budgetMin: moneyField(formData, "budgetMin"),
    budgetMax: moneyField(formData, "budgetMax"),
    preferredLocations: jsonStringArray(formData, "preferredLocationsJson"),
    preferredTypes: jsonStringArray(formData, "preferredTypesJson"),
  };
}

export async function createClient(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return { error: "A name is required." };

  let id: number;
  try {
    const [row] = await db
      .insert(crmClients)
      .values({ name, ...parseClient(formData) })
      .returning({ id: crmClients.id });
    id = row.id;
  } catch (err) {
    console.error("createClient failed:", err);
    return { error: "Could not save the client. Try again." };
  }
  redirect(`/admin/crm/${id}`);
}

export async function updateClient(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing client id." };
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return { error: "A name is required." };

  try {
    await db
      .update(crmClients)
      .set({ name, ...parseClient(formData), updatedAt: new Date() })
      .where(eq(crmClients.id, id));
  } catch (err) {
    console.error("updateClient failed:", err);
    return { error: "Could not save the client. Try again." };
  }
  redirect(`/admin/crm/${id}`);
}

/**
 * Plain form action for the inline "add activity" widget on the client
 * detail page — same shape as `createTower` in the projects actions (no
 * client wrapper, no error state; a bad kind is dropped rather than surfaced,
 * matching that low-stakes-inline-form precedent).
 */
/** `<input type="date">` gives "YYYY-MM-DD" or "" — never a garbage string, but still user-editable text. */
function dateField(formData: FormData, key: string): Date | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `<input type="datetime-local">` gives "YYYY-MM-DDTHH:mm" or "". */
function dateTimeField(formData: FormData, key: string): Date | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function addActivity(formData: FormData): Promise<void> {
  await requireAdmin();
  const clientId = Number(formData.get("clientId"));
  if (!Number.isInteger(clientId)) redirect("/admin/crm");

  const kind = String(formData.get("kind") ?? "");
  if ((ACTIVITY_KINDS as readonly string[]).includes(kind)) {
    // A call log is written after the call, not during it — often hours or
    // days later ("I called them on Tuesday"). Left blank this keeps the
    // schema default (now), so the common same-moment case costs nothing;
    // filled in, it records when the call actually happened. The list is
    // ordered by occurredAt, so a backdated entry sorts into its real place
    // rather than jumping to the top.
    const occurredAt = dateTimeField(formData, "occurredAt");
    try {
      await db.insert(crmActivities).values({
        clientId,
        kind,
        note: textField(formData, "note", 4000),
        author: textField(formData, "author", 200),
        followUpAt: dateField(formData, "followUpAt"),
        ...(occurredAt ? { occurredAt } : {}),
      });
    } catch (err) {
      console.error("addActivity failed:", err);
    }
  }
  redirect(`/admin/crm/${clientId}`);
}

/**
 * Lead → client conversion (R-30): "website leads convert in one click,
 * carrying shortlisted property IDs." One `crm_deals` row per shortlisted
 * property id (R-30's confirmed default — one property, many deals per
 * client), each starting at the first pipeline stage.
 *
 * Not wired into any UI from this file — the lead inbox
 * (app/admin/(panel)/leads/**) belongs to a different engineer. They call
 * this from a "Convert to client" button once one exists there.
 */
export async function convertLeadToClient(leadId: number): Promise<void> {
  await requireAdmin();

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) redirect("/admin/leads");

  let clientId: number;
  try {
    clientId = await db.transaction(async (tx) => {
      const [client] = await tx
        .insert(crmClients)
        .values({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          requirementNotes: lead.message,
          convertedFromLeadId: lead.id,
        })
        .returning({ id: crmClients.id });

      const propertyIds = lead.propertyIds ?? [];
      if (propertyIds.length) {
        await tx.insert(crmDeals).values(
          propertyIds.map((propertyId) => ({
            clientId: client.id,
            propertyId,
            stage: DEAL_STAGES[0],
          }))
        );
      }
      return client.id;
    });
  } catch (err) {
    console.error("convertLeadToClient failed:", err);
    redirect("/admin/leads");
  }
  redirect(`/admin/crm/${clientId}`);
}
