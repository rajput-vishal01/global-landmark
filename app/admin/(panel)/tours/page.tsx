import Link from "next/link";
import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, tourRequests } from "@/lib/db/schema";
import { TourEditForm } from "./TourEditForm";
import { formatDateTime } from "@/lib/dates";
import {
  Chip,
  type ChipTone,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskRowLink,
} from "@/components/admin/desk";

export const metadata = { title: "Tour requests" };

const PAGE_SIZE = 25;

/**
 * Mirrors the lead statuses on the same gold ramp, so the two inboxes read
 * the same way. `cancelled` is `neutral`, not `alert` — a visitor calling off
 * a viewing is a normal end to the row, not a fault.
 */
const TOUR_TONE: Record<string, ChipTone> = {
  new: "live",
  scheduled: "quiet",
  completed: "strong",
  cancelled: "neutral",
};

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
    <div className="flex flex-col gap-4">
      <PageHead
        title="Tour requests"
        sub="Visitors who asked to see a property in person or over video, and whether anyone has booked them in."
      />

      {/* The unread count, then the count of what came back, on one line. */}
      <div className="flex flex-wrap items-center gap-2">
        {newCount > 0 && (
          <Chip tone="live" title="Requests nobody has answered yet">
            {newCount} new
          </Chip>
        )}
        <span className="ml-auto text-[12px] tabular-nums text-muted">
          {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total} request
          {total === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No tour requests yet"
          note="These arrive on their own when a visitor uses the Request a tour form on a property page. There is nothing to set up here."
          action={
            <Link href="/admin/properties" className={deskButton}>
              See the listings they come from
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TableWrap>
            <Table className="min-w-[1000px]">
              <thead>
                <tr>
                  {["Visitor", "Contact", "Property", "Requested slot", "Status", "Received"].map(
                    (h) => (
                      <th key={h} scope="col">
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
                    /* Unanswered requests carry a faint gold wash; their status
                       chip carries the gold spine down the column. */
                    <tr key={row.id} className={isUnread ? "bg-gold/5" : ""}>
                      <td>
                        <div className="min-w-0">
                          <p className={isUnread ? "font-semibold text-ink" : "font-medium text-ink"}>
                            {row.name}
                          </p>
                          {row.message && (
                            <p
                              className="mt-0.5 max-w-xs truncate text-[12px] text-muted"
                              title={row.message}
                            >
                              {row.message}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-soft">
                        <div className="flex flex-col gap-0.5">
                          {row.phone && <span>{row.phone}</span>}
                          {row.email && <span>{row.email}</span>}
                        </div>
                      </td>
                      <td className="text-soft">
                        {property ? (
                          <Link
                            href={`/admin/properties/${row.propertyId}/edit`}
                            className={deskRowLink}
                          >
                            {property.refCode ?? property.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-soft">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-ink">{row.tourType ?? "Not specified"}</span>
                          <span className="text-muted">
                            {row.preferredDate ? formatDay(row.preferredDate) : "Any day"}
                            {row.preferredTime ? ` · ${row.preferredTime}` : ""}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-2">
                          <Chip tone={TOUR_TONE[row.status] ?? "neutral"}>{row.status}</Chip>
                          <TourEditForm id={row.id} status={row.status} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {formatDateTime(row.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>

          {lastPage > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <PageLink page={page - 1} disabled={page <= 1} label="Previous" />
              <span className="text-[12px] tabular-nums text-muted">
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
  // The same outline button as everywhere else, with a disabled twin that
  // keeps the row from reflowing when Previous greys out at page 1.
  if (disabled) {
    return (
      <span aria-disabled className={`${deskButton} pointer-events-none opacity-40`}>
        {label}
      </span>
    );
  }
  return (
    <Link href={page > 1 ? `/admin/tours?page=${page}` : "/admin/tours"} className={deskButton}>
      {label}
    </Link>
  );
}
