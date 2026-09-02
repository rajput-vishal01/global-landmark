import Link from "next/link";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, tourRequests } from "@/lib/db/schema";
import { TOUR_STATUS_BADGE } from "@/lib/taxonomy/tours";
import { TourEditForm } from "./TourEditForm";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "Tour requests" };

const PAGE_SIZE = 25;

type TourRow = {
  id: number;
  propertyId: number | null;
  name: string;
  phone: string | null;
  email: string | null;
  tourType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
};

/**
 * The tour-request inbox — a sibling of /admin/leads, not a tab inside it.
 *
 * `tour_requests` is its own table for the reason spelled out in the schema:
 * a tour has a date, a time and a type, and folding those nullable columns
 * into the enquiry inbox would blur two lists the broker works through
 * differently. The screen follows suit.
 *
 * Local to this route, like the leads list: the rows carry a visitor's name,
 * phone and email, which must never appear in lib/db/queries.ts's public
 * query layer.
 */
async function listPage(
  page: number
): Promise<{ rows: TourRow[]; total: number; newCount: number }> {
  try {
    const [rows, [totals], [unread]] = await Promise.all([
      db
        .select({
          id: tourRequests.id,
          propertyId: tourRequests.propertyId,
          name: tourRequests.name,
          phone: tourRequests.phone,
          email: tourRequests.email,
          tourType: tourRequests.tourType,
          preferredDate: tourRequests.preferredDate,
          preferredTime: tourRequests.preferredTime,
          message: tourRequests.message,
          status: tourRequests.status,
          createdAt: tourRequests.createdAt,
        })
        .from(tourRequests)
        .orderBy(desc(tourRequests.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ n: count() }).from(tourRequests),
      db
        .select({ n: count() })
        .from(tourRequests)
        .where(eq(tourRequests.status, "new")),
    ]);
    return { rows, total: totals?.n ?? 0, newCount: unread?.n ?? 0 };
  } catch (err) {
    console.error("admin tour list failed:", err);
    return { rows: [], total: 0, newCount: 0 };
  }
}

/** Resolves this page's property ids in one query rather than N+1 per row. */
async function resolveProperties(
  rows: TourRow[]
): Promise<Map<number, { refCode: string | null; title: string; slug: string }>> {
  const ids = [...new Set(rows.map((r) => r.propertyId).filter((id): id is number => id !== null))];
  if (!ids.length) return new Map();
  try {
    const found = await db
      .select({
        id: properties.id,
        refCode: properties.refCode,
        title: properties.title,
        slug: properties.slug,
      })
      .from(properties)
      .where(inArray(properties.id, ids));
    return new Map(found.map((p) => [p.id, p]));
  } catch (err) {
    console.error("admin tour property resolve failed:", err);
    return new Map();
  }
}


/** `preferred_date` is a DATE column — a plain YYYY-MM-DD string, no zone. */
function formatDay(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

const TH =
  "text-eyebrow whitespace-nowrap px-4 py-3 text-left font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";

export default async function AdminToursPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const { rows, total, newCount } = await listPage(requestedPage);
  const propertyMap = await resolveProperties(rows);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-h2 text-ink">Tour requests</h1>
        {newCount > 0 && (
          <span className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-gold-deep">
            <span aria-hidden className="h-2 w-2 rounded-full bg-gold-deep" />
            {newCount} new
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          No tour requests yet. These arrive on their own when a visitor uses
          the &ldquo;Request a tour&rdquo; form on a property page — there is
          nothing to set up here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-meta font-sans tabular-nums text-ink-muted">
            {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total} request
            {total === 1 ? "" : "s"}
          </p>

          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Visitor", "Contact", "Property", "Requested slot", "Status", "Received"].map(
                    (h) => (
                      <th key={h} className={TH}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isUnread = row.status === "new";
                  const property =
                    row.propertyId != null ? propertyMap.get(row.propertyId) : undefined;
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-border align-top last:border-b-0 ${isUnread ? "bg-gold/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {isUnread && (
                            <span
                              aria-label="Unread"
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-deep"
                            />
                          )}
                          <div className="min-w-0">
                            <p
                              className={`font-sans text-body text-ink ${isUnread ? "font-semibold" : "font-medium"}`}
                            >
                              {row.name}
                            </p>
                            {row.message && (
                              <p
                                className="mt-0.5 max-w-xs truncate font-sans text-meta text-ink-muted"
                                title={row.message}
                              >
                                {row.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-sans text-meta text-ink">
                        <div className="flex flex-col gap-0.5">
                          {row.phone && <span>{row.phone}</span>}
                          {row.email && <span>{row.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-meta text-ink">
                        {property ? (
                          <Link
                            href={`/admin/properties/${row.propertyId}/edit`}
                            className="text-ink underline decoration-border underline-offset-4 hover:decoration-gold"
                          >
                            {property.refCode ?? property.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans text-meta text-ink">
                        <div className="flex flex-col gap-0.5">
                          <span>{row.tourType ?? "Not specified"}</span>
                          <span className="text-ink-muted">
                            {row.preferredDate ? formatDay(row.preferredDate) : "Any day"}
                            {row.preferredTime ? ` · ${row.preferredTime}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] ${
                              TOUR_STATUS_BADGE[row.status as keyof typeof TOUR_STATUS_BADGE] ??
                              "border-border bg-ink/5 text-ink-muted"
                            }`}
                          >
                            {row.status}
                          </span>
                          <TourEditForm id={row.id} status={row.status} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink-muted">
                        {formatDateTime(row.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <PageLink page={page - 1} disabled={page <= 1} label="Previous" />
              <span className="text-meta font-sans tabular-nums text-ink-muted">
                Page {page} of {lastPage}
              </span>
              <PageLink page={page + 1} disabled={page >= lastPage} label="Next" />
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  const base =
    "text-eyebrow font-sans font-medium uppercase tracking-[0.18em] border border-border px-5 py-2.5";
  if (disabled) {
    return (
      <span aria-disabled className={`${base} text-ink-muted/40`}>
        {label}
      </span>
    );
  }
  return (
    <Link
      href={page > 1 ? `/admin/tours?page=${page}` : "/admin/tours"}
      className={`${base} text-ink transition-colors hover:border-gold hover:text-gold-deep`}
    >
      {label}
    </Link>
  );
}
