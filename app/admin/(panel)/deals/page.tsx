import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, properties } from "@/lib/db/schema";
import { todayIST } from "@/lib/db/queries";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DealCreateForm } from "./DealCreateForm";
import { deleteDeal } from "./actions";

export const metadata = { title: "Deals" };

type Status = "Live" | "Queued" | "Expired";

function statusOf(startsAt: string, endsAt: string, today: string): Status {
  if (endsAt < today) return "Expired";
  if (startsAt > today) return "Queued";
  return "Live";
}

const STATUS_STYLE: Record<Status, string> = {
  Live: "bg-gold/15 text-gold-deep",
  Queued: "bg-ink/5 text-ink",
  Expired: "bg-ink/5 text-ink-muted line-through",
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-h2 text-ink">Deal of the Week</h1>
        <p className="mt-2 max-w-2xl text-body font-sans text-ink-muted">
          The deal whose window covers today is shown on the landing page.
          Queue future windows and the next one goes live automatically when
          the current one expires.
        </p>
      </div>

      <DealCreateForm items={propertyRows} />

      {dealRows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">No deals scheduled.</p>
      ) : (
        <ul className="border border-border bg-white">
          {dealRows.map((deal) => {
            const status = statusOf(deal.startsAt, deal.endsAt, today);
            return (
              <li
                key={deal.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-eyebrow px-2.5 py-1 font-sans font-medium uppercase tracking-[0.15em] ${STATUS_STYLE[status]}`}
                  >
                    {status}
                  </span>
                  <div>
                    <p className="font-sans text-body font-medium text-ink">
                      {deal.property.title}
                    </p>
                    <p className="text-meta font-sans text-ink-muted">
                      {deal.startsAt} → {deal.endsAt}
                    </p>
                  </div>
                </div>
                <DeleteButton
                  action={deleteDeal}
                  id={deal.id}
                  label="Remove"
                  confirmText={`Remove this deal for "${deal.property.title}"?`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
