"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmActivities, crmClients, crmDeals, leads, properties } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import type { DeleteState } from "@/app/admin/(panel)/properties/actions";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import { ACTIVITY_KINDS } from "@/lib/taxonomy/activities";
import { textField, moneyField, idField } from "@/lib/admin/form-fields";

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
      .$returningId();
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
  const id = idField(formData);
  if (id === null) return { error: "Missing client id." };
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
/**
 * `<input type="date">` gives "YYYY-MM-DD" or "" — never a garbage string,
 * but still user-editable text.
 *
 * Midday, not midnight. The column is a TIMESTAMP, which MySQL converts
 * through the server's timezone (UTC here) on the way in and out: local
 * midnight in IST is 18:30 the PREVIOUS day in UTC, so "follow up on the
 * 20th" came back — and rendered everywhere — as the 19th. Noon leaves
 * 12 hours of slack either side, so no timezone the site is ever run in can
 * shift the day. A date-only column would be the tidier fix and needs a
 * migration; this is one line and the value is a reminder date, never a time.
 */
function dateField(formData: FormData, key: string): Date | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  // Midday in India, stated outright: the server runs on UTC, so a bare
  // "T12:00:00" meant noon UTC in production and noon IST on a laptop.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `<input type="datetime-local">` gives "YYYY-MM-DDTHH:mm" or "". */
function dateTimeField(formData: FormData, key: string): Date | null {
  const raw = String(formData.get(key) ?? "").trim();
  // datetime-local has no zone. The broker typed Indian time; parsed bare it
  // was read as the server's (UTC in production), so "called at 2:30 pm"
  // showed as 8:00 pm.
  const m = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/);
  if (!m) return null;
  const d = new Date(`${m[1]}${m[2] ?? ":00"}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ActivityFormState = { error?: string };

/**
 * Logs a call, visit or note against a client from the inline form.
 *
 * Returns a state rather than redirecting. It used to catch a failed insert,
 * log it, and redirect back to the client exactly as if it had worked, and an
 * unrecognised kind skipped the insert just as silently. Both now come back as
 * an error the form shows.
 */
export async function addActivity(
  _prev: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  await requireAdmin();
  const clientId = idField(formData, "clientId");
  if (clientId === null) return { error: "Missing client id." };

  const kind = String(formData.get("kind") ?? "");
  if (!(ACTIVITY_KINDS as readonly string[]).includes(kind)) {
    return { error: "Choose what kind of activity this was." };
  }

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
    return { error: "Could not log the activity. Try again." };
  }
  revalidatePath(`/admin/crm/${clientId}`);
  revalidatePath("/admin/crm/follow-ups");
  revalidatePath("/admin/crm");
  revalidatePath("/admin");
  return {};
}

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
        .$returningId();

      // Only listings that still exist. A lead keeps the ids it was sent with,
      // and one pointing at a since-deleted listing failed the insert — the
      // whole conversion rolled back and dropped the broker on the inbox with
      // no word of why.
      const shortlisted = lead.propertyIds ?? [];
      const propertyIds = shortlisted.length
        ? (
            await tx
              .select({ id: properties.id })
              .from(properties)
              .where(inArray(properties.id, shortlisted))
          ).map((r) => r.id)
        : [];
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

/**
 * Delete a client.
 *
 * Refused while any deal still points at them. crm_deals.client_id is
 * `onDelete: "cascade"`, so without this guard removing a client would take
 * their deals — and, through crm_deals, their payment history — with them.
 * Brokerage records are the last thing that should disappear as a side
 * effect of tidying a contact list. So refuse and name the count, rather
 * than cascade and hope it was intended.
 *
 * Activities do cascade, deliberately. They are a log of calls and notes
 * about this person; keeping them after the person is gone serves nobody.
 */
export async function deleteClient(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = idField(formData);
  if (id === null) return { error: "Missing client id." };

  try {
    const [{ n }] = await db
      .select({ n: count() })
      .from(crmDeals)
      .where(eq(crmDeals.clientId, id));
    if (n > 0) {
      return {
        error: `${n} deal${n === 1 ? "" : "s"} still belong to this client. Delete those first — removing the client would take their payment history too.`,
      };
    }
    await db.delete(crmClients).where(eq(crmClients.id, id));
  } catch (err) {
    console.error("deleteClient failed:", err);
    return { error: "Delete failed. Try again." };
  }

  revalidatePath("/admin/crm");
  return {};
}
