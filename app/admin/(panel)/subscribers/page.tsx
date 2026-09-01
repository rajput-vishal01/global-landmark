import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

export const metadata = { title: "Subscribers" };

/**
 * Newsletter list — READ ONLY on purpose.
 *
 * These addresses were given for one thing, so the panel offers no edit and
 * no delete: an unsubscribe is recorded by the visitor's own request
 * (`unsubscribed_at`), not by a broker tidying the list. Export to CSV and
 * work from that.
 *
 * ponytail: shows the most recent 500 and exports the rest. A list this
 * size fits on a screen; paginating it before it needs paginating is work
 * the CSV already does.
 */
const LIST_LIMIT = 500;

async function listRecent() {
  try {
    return await db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(LIST_LIMIT);
  } catch (err) {
    console.error("admin listRecent subscribers failed:", err);
    return [];
  }
}

export default async function AdminSubscribersPage() {
  const rows = await listRecent();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-h2 text-ink">Subscribers</h1>
        <p className="mt-2 max-w-2xl text-body font-sans text-ink-muted">
          Everyone who signed up through the footer form. Personal data —
          keep it internal, and never paste it into anything public.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          Nobody has signed up yet. Names appear here on their own when a
          visitor enters their email in the footer form — there is nothing to
          set up here.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <ul className="border border-border bg-white">
            {rows.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span className="min-w-0 break-all font-sans text-body text-ink">
                  {s.email}
                </span>
                <span className="flex shrink-0 items-center gap-5 text-meta font-sans text-ink-muted">
                  {s.source && <span>{s.source}</span>}
                  <span>{formatDate(s.createdAt)}</span>
                  {s.unsubscribedAt && (
                    <span className="text-error">
                      Unsubscribed {formatDate(s.unsubscribedAt)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {rows.length === LIST_LIMIT && (
            <p className="text-meta font-sans text-ink-muted">
              Showing the {LIST_LIMIT} most recent. The CSV export has
              everyone.
            </p>
          )}

          <a
            href="/api/admin/subscribers/export"
            className="self-start text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
          >
            Export all subscribers to CSV
          </a>
        </div>
      )}
    </div>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
