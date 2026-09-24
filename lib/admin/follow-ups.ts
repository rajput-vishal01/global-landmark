import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmActivities, crmClients } from "@/lib/db/schema";

/**
 * The call-back queue behind /admin/crm/follow-ups and the dashboard's
 * overdue count.
 *
 * ponytail: an activity has no "done" flag and gets none. A follow-up counts
 * as open while it sits on the client's MOST RECENTLY LOGGED activity — log
 * the call back and the old reminder falls away on its own, because the new
 * entry is now the latest. Set a date on that new entry and the client comes
 * back for the next round. Add a completed_at column only if brokers want to
 * dismiss a reminder without logging anything.
 */
export type FollowUpRow = {
  id: number;
  clientId: number;
  name: string;
  phone: string | null;
  kind: string;
  note: string | null;
  occurredAt: Date;
  followUpAt: Date;
};

/**
 * The correlation is spelled with literal table names for the reason
 * documented in the properties list: once crm_activities.id is also selected
 * at the top level, Drizzle renders a second reference to it unqualified and
 * the subquery silently matches nothing.
 *
 * Latest by id, not by occurred_at: occurred_at can be backdated ("I called
 * them on Tuesday"), and what decides whether a reminder still stands is what
 * was written down last, not when the call happened.
 */
const LATEST_PER_CLIENT = sql`crm_activities.id = (
  select max(latest.id) from crm_activities latest
  where latest.client_id = crm_activities.client_id
)`;

export async function listOpenFollowUps(): Promise<FollowUpRow[]> {
  try {
    return await db
      .select({
        id: crmActivities.id,
        clientId: crmActivities.clientId,
        name: crmClients.name,
        phone: crmClients.phone,
        kind: crmActivities.kind,
        note: crmActivities.note,
        occurredAt: crmActivities.occurredAt,
        // Non-null by the isNotNull() below, which the column type cannot say.
        followUpAt: sql<Date>`crm_activities.follow_up_at`,
      })
      .from(crmActivities)
      .innerJoin(crmClients, eq(crmClients.id, crmActivities.clientId))
      .where(and(isNotNull(crmActivities.followUpAt), LATEST_PER_CLIENT))
      .orderBy(asc(crmActivities.followUpAt));
  } catch (err) {
    console.error("listOpenFollowUps failed:", err);
    return [];
  }
}

/** The IST calendar day a timestamp falls on, as YYYY-MM-DD — same basis as todayIST(). */
export function istDay(value: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(value)
  );
}

/** How many call-backs are already late — the dashboard's one number. */
export async function countOverdueFollowUps(today: string): Promise<number> {
  const rows = await listOpenFollowUps();
  return rows.filter((row) => istDay(row.followUpAt) < today).length;
}
