import Link from "next/link";
import { todayIST } from "@/lib/db/queries";
import { formatDate, formatDateTime } from "@/lib/dates";
import { istDay, listOpenFollowUps, type FollowUpRow } from "@/lib/admin/follow-ups";
import { ActivityForm } from "../[id]/ActivityForm";
import {
  Card,
  Chip,
  EmptyState,
  PageHead,
  deskRowLink,
  type ChipTone,
} from "@/components/admin/desk";

export const metadata = { title: "Follow-ups" };

const BUCKETS = [
  { key: "overdue", title: "Overdue", tone: "alert" as ChipTone },
  { key: "today", title: "Today", tone: "live" as ChipTone },
  { key: "week", title: "Next 7 days", tone: "quiet" as ChipTone },
  { key: "later", title: "Later", tone: "neutral" as ChipTone },
] as const;

type BucketKey = (typeof BUCKETS)[number]["key"];

function bucketOf(followUpAt: Date | string, today: string): BucketKey {
  const day = istDay(followUpAt);
  if (day < today) return "overdue";
  if (day === today) return "today";
  // A week out in plain date arithmetic — no library, and IST has no DST.
  const inAWeek = new Date(`${today}T00:00:00Z`);
  inAWeek.setUTCDate(inAWeek.getUTCDate() + 7);
  return day <= inAWeek.toISOString().slice(0, 10) ? "week" : "later";
}

/**
 * The call-back list: every client with a follow-up date still standing,
 * oldest first, with what was said last time and a box to log what they say
 * this time. The "still standing" rule lives in lib/admin/follow-ups.ts.
 */
export default async function FollowUpsPage() {
  const rows = await listOpenFollowUps();
  const today = todayIST();
  const grouped = new Map<BucketKey, FollowUpRow[]>();
  for (const row of rows) {
    const key = bucketOf(row.followUpAt, today);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Follow-ups"
        sub="Who is waiting on a call back. Log what they said and set the next date — the reminder moves with it."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing to call back"
          note="A follow-up appears here when you set a date while logging an activity on a client."
        />
      ) : (
        BUCKETS.filter((bucket) => grouped.get(bucket.key)?.length).map((bucket) => {
          const bucketRows = grouped.get(bucket.key) ?? [];
          return (
            <section key={bucket.key} className="flex flex-col gap-2">
              <h2 className="desk-eyebrow">
                {bucket.title} · {bucketRows.length}
              </h2>
              <ul className="flex flex-col gap-2">
                {bucketRows.map((row) => (
                  <li key={row.id}>
                    <Card className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/admin/crm/${row.clientId}`} className={deskRowLink}>
                          {row.name}
                        </Link>
                        <Chip tone={bucket.tone}>{formatDate(row.followUpAt)}</Chip>
                      </div>
                      <p className="text-[12px] text-muted">
                        {row.phone ? (
                          <a href={`tel:${row.phone}`} className="tel hover:underline">
                            {row.phone}
                          </a>
                        ) : (
                          "No phone on file"
                        )}
                        {" · "}
                        {row.kind} on {formatDateTime(row.occurredAt)}
                      </p>
                      {row.note && <p className="text-[13px] text-ink">{row.note}</p>}
                      {/* ponytail: the browser's own disclosure. The row stays
                          a row until there is something to write. */}
                      <details>
                        <summary className="cursor-pointer text-[12px] font-medium text-gold-deep">
                          Log what they said
                        </summary>
                        <div className="mt-2">
                          <ActivityForm clientId={row.clientId} />
                        </div>
                      </details>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
