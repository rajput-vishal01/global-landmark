import { and, asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { deals, properties } from "@/lib/db/schema";
import { todayIST } from "@/lib/db/queries";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Card, Chip, EmptyState, PageHead, deskButton, type ChipTone } from "@/components/admin/desk";
import { DealCreateForm } from "./DealCreateForm";
import { deleteDeal } from "./actions";
import { nextFreeWeek, rangeLabel } from "@/lib/week";

export const metadata = { title: "Deal of the Week" };

type Status = "Live" | "Queued" | "Expired";

function statusOf(startsAt: string, endsAt: string, today: string): Status {
  if (endsAt < today) return "Expired";
  if (startsAt > today) return "Queued";
  return "Live";
}

/** Live is the one on the site right now, so it takes the accent; a window
 *  that has simply run out is spent, not broken, so it never reads as alert. */
const STATUS_TONE: Record<Status, ChipTone> = {
  Live: "live",
  Queued: "quiet",
  Expired: "neutral",
};

/**
 * Cover photo per listing, the same one the properties list shows. Written as
 * literal table names for the reason documented in the properties page: once
 * properties.id is also selected, Drizzle renders a second reference to it
 * unqualified and the subquery silently matches nothing.
 */
const coverUrl = sql<string | null>`(
    select url from property_images
    where property_images.property_id = properties.id
    order by property_images.sort_order asc, property_images.id asc
    limit 1
  )`.as("cover_url");

async function loadData() {
  try {
    const [dealRows, propertyRows] = await Promise.all([
      db.query.deals.findMany({
        with: { property: true },
        orderBy: [asc(deals.startsAt)],
      }),
      db
        .select({
          id: properties.id,
          title: properties.title,
          kind: properties.kind,
          location: properties.location,
          coverUrl,
        })
        .from(properties)
        // Only what is on the website can be the deal — the homepage skips
        // anything else, so offering drafts here would only mislead.
        .where(
          and(
            eq(properties.publicationState, "published"),
            eq(properties.listingStatus, "Available")
          )
        )
        .orderBy(asc(properties.title)),
    ]);
    return { dealRows, propertyRows };
  } catch (err) {
    console.error("deals loadData failed:", err);
    return { dealRows: [], propertyRows: [] };
  }
}

export default async function AdminDealsPage() {
  const { dealRows, propertyRows } = await loadData();
  const today = todayIST();
  // Every deal's listing is in the picker rows, so one lookup covers both.
  const covers = new Map(
    propertyRows.flatMap((p) => (p.coverUrl ? [[p.id, p.coverUrl] as const] : []))
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Deal of the Week"
        sub="Whichever window covers today is the deal on the landing page — queue the next one and the handover happens on its own."
        actions={
          // The deal is sometimes a property the office does not want on the
          // market. This opens the property form with "keep out of the
          // listings" already ticked: live enough for the strip and its own
          // page, absent from /properties.
          <Link href="/admin/properties/new?unlisted=1" className={deskButton}>
            Add a property for a deal
          </Link>
        }
      />

      <DealCreateForm items={propertyRows} defaultWeek={nextFreeWeek(today, dealRows)} />

      {dealRows.length === 0 ? (
        <EmptyState
          title="Nothing scheduled"
          note="With no deal window open, the landing page leaves the Deal of the Week strip out entirely."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dealRows.map((deal) => {
            const status = statusOf(deal.startsAt, deal.endsAt, today);
            return (
              <li key={deal.id}>
                <Card className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <Chip tone={STATUS_TONE[status]}>{status}</Chip>
                    <DeleteButton
                      action={deleteDeal}
                      id={deal.id}
                      label="Remove"
                      confirmText={`Remove this deal for "${deal.property.title}"?`}
                    />
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[4px] bg-raise">
                      {covers.get(deal.propertyId) && (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts
                        <img src={covers.get(deal.propertyId)!} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    {/* Title and dates share the column beside the photo:
                        the dates on their own line left a gap under the
                        thumbnail and made every card taller than its content. */}
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-[13px] font-medium text-ink">{deal.property.title}</p>
                      <p className="text-[11.5px] tabular-nums text-muted">
                        {rangeLabel(deal.startsAt, deal.endsAt)}
                      </p>
                    </div>
                  </div>
                  {status !== "Expired" &&
                    (deal.property.publicationState !== "published" ||
                      deal.property.listingStatus !== "Available") && (
                      <p className="text-[11.5px] text-error">
                        This listing is not live on the website, so the homepage skips
                        this deal. Publish it again or remove the deal.
                      </p>
                    )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
