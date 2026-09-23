import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, properties } from "@/lib/db/schema";
import { todayIST } from "@/lib/db/queries";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Card, Chip, EmptyState, PageHead, type ChipTone } from "@/components/admin/desk";
import { DealCreateForm } from "./DealCreateForm";
import { deleteDeal } from "./actions";
import { nextFreeWeek, weekLabel } from "@/lib/week";

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

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Deal of the Week"
        sub="Whichever window covers today is the deal on the landing page — queue the next one and the handover happens on its own."
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
                  <p className="text-[13px] font-medium text-ink">{deal.property.title}</p>
                  <p className="text-[11.5px] tabular-nums text-muted">{weekLabel(deal.startsAt)}</p>
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
