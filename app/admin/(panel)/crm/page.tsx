import Link from "next/link";
import { count, desc, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmClients, crmDeals } from "@/lib/db/schema";
import { formatIndianShort } from "@/lib/attributes";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteClient } from "./client-actions";
import {
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskButtonPrimary,
  deskField,
  deskRowLink,
} from "@/components/admin/desk";

function formatShortDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(
    new Date(value)
  );
}

export const metadata = { title: "CRM" };

const PAGE_SIZE = 25;

/** Same LIKE-metacharacter escape as the properties list — a literal search
 * for "100%" must not match everything. */
const likeEscape = (q: string) => q.replace(/[\\%_]/g, (m) => `\\${m}`);

type ClientRow = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredLocations: string[] | null;
  preferredTypes: string[] | null;
  dealCount: number;
  nextActionKind: string | null;
  nextActionDate: Date | string | null;
  nextActionIsFollowUp: boolean | null;
};

/**
 * The admin client list query. Local to this page, same reasoning as
 * `listPage()` in properties/page.tsx: it is the only caller and stays
 * uncached.
 *
 * ponytail: search is `ILIKE '%…%'` across three columns — fine at CRM scale
 * (a brokerage's client list), no index added until it measurably isn't.
 */
async function listPage(q: string, page: number): Promise<{ rows: ClientRow[]; total: number }> {
  const pattern = q ? `%${likeEscape(q)}%` : null;
  const where = pattern
    ? or(
        like(crmClients.name, pattern),
        like(crmClients.phone, pattern),
        like(crmClients.email, pattern)
      )
    : undefined;

  // Correlated subquery rather than a join, so a client with several deals
  // doesn't multiply rows before LIMIT.
  const dealCount = sql<number>`(
    select count(*) from ${crmDeals} where ${crmDeals.clientId} = ${crmClients.id}
  )`.as("deal_count");

  // "What do I need to do next for this client?" — the row a broker actually
  // wants without clicking in. Any logged follow-up date wins (soonest first,
  // so an overdue one surfaces ahead of a scheduled one — the more urgent
  // signal); with no follow-up ever set, falls back to the most recent
  // activity so the column still reads as "last contact" instead of blank.
  //
  // The correlation is written as literal `crm_clients.id`, NOT
  // `${crmClients.id}`: Drizzle renders that column reference unqualified
  // ("id") when the same column object is already selected elsewhere in the
  // query, which inside this subquery resolves against crm_activities' OWN
  // "id" column instead of the outer table — always false, so the column
  // silently always came back null. Spelling the table name out in the raw
  // SQL sidesteps the ambiguity entirely.
  //
  // Three fully self-contained subqueries rather than one composite one:
  // CRM client-list scale (tens of rows) makes the extra round trips a
  // non-issue, and each stays simple enough to read at a glance.
  const nextActionKind = sql<string | null>`(
    select kind from crm_activities
    where crm_activities.client_id = crm_clients.id
    order by (follow_up_at is not null) desc, follow_up_at asc, occurred_at desc
    limit 1
  )`.as("next_action_kind");
  const nextActionDate = sql<Date | null>`(
    select coalesce(follow_up_at, occurred_at) from crm_activities
    where crm_activities.client_id = crm_clients.id
    order by (follow_up_at is not null) desc, follow_up_at asc, occurred_at desc
    limit 1
  )`.as("next_action_date");
  const nextActionIsFollowUp = sql<boolean | null>`(
    select follow_up_at is not null from crm_activities
    where crm_activities.client_id = crm_clients.id
    order by (follow_up_at is not null) desc, follow_up_at asc, occurred_at desc
    limit 1
  )`.as("next_action_is_follow_up");

  try {
    const [rows, [totals]] = await Promise.all([
      db
        .select({
          id: crmClients.id,
          name: crmClients.name,
          phone: crmClients.phone,
          email: crmClients.email,
          budgetMin: crmClients.budgetMin,
          budgetMax: crmClients.budgetMax,
          preferredLocations: crmClients.preferredLocations,
          preferredTypes: crmClients.preferredTypes,
          dealCount,
          nextActionKind,
          nextActionDate,
          nextActionIsFollowUp,
        })
        .from(crmClients)
        .where(where)
        .orderBy(desc(crmClients.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ n: count() }).from(crmClients).where(where),
    ]);
    return { rows, total: totals?.n ?? 0 };
  } catch (err) {
    // Fail-soft, same contract as the properties list: render "nothing here"
    // rather than a 500.
    console.error("admin CRM client list failed:", err);
    return { rows: [], total: 0 };
  }
}

function budgetRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${formatIndianShort(min)} – ${formatIndianShort(max)}`;
  return formatIndianShort((min ?? max)!);
}

/** "Call · 22 Aug", "Call · 22 Aug (overdue)" for a scheduled follow-up, or "Last: Note · 21 Aug" once nothing is scheduled. */
function nextActionLabel(row: ClientRow): string {
  if (!row.nextActionKind || !row.nextActionDate) return "No activity yet";
  const date = formatShortDate(row.nextActionDate);
  if (!row.nextActionIsFollowUp) return `Last: ${row.nextActionKind} · ${date}`;
  const overdue = new Date(row.nextActionDate) < new Date() ? " (overdue)" : "";
  return `${row.nextActionKind} · ${date}${overdue}`;
}

function truncatedList(values: string[] | null): string {
  if (!values || values.length === 0) return "—";
  const shown = values.slice(0, 2).join(", ");
  return values.length > 2 ? `${shown} +${values.length - 2}` : shown;
}

function pageHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return `/admin/crm${params.size ? `?${params}` : ""}`;
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const { rows, total } = await listPage(q, requestedPage);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Clients"
        sub="Everyone the brokerage is working with, and what is owed them next."
        actions={
          <Link href="/admin/crm/new" className={deskButtonPrimary}>
            Add client
          </Link>
        }
      />

      {/* The toolbar sits on the card, not above it: search, then the count of
          what came back, on one line. Reading "1–4 of 4" next to the box you
          typed into is what tells you the search did something. */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <label htmlFor="q" className="sr-only">
          Search clients
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Name, phone or email"
          className={`${deskField} w-full sm:w-72`}
        />
        <button type="submit" className={deskButton}>
          Search
        </button>
        {q && (
          <Link href="/admin/crm" className={deskButton}>
            Clear
          </Link>
        )}
        <span className="ml-auto text-[12px] tabular-nums text-muted">
          {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total} client
          {total === 1 ? "" : "s"}
        </span>
      </form>

      {rows.length === 0 ? (
        q ? (
          <EmptyState
            title="Nothing matches that"
            note={`No client's name, phone or email contains "${q}". Try a shorter search — a surname or the last four digits.`}
            action={
              <Link href="/admin/crm" className={deskButton}>
                Clear search
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No clients yet"
            note="A client is anyone you are actively working with. Add one and their calls, notes and deals collect against them."
            action={
              <Link href="/admin/crm/new" className={deskButtonPrimary}>
                Add the first client
              </Link>
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <TableWrap>
            <Table className="min-w-[860px]">
              <thead>
                <tr>
                  {["Name", "Contact", "Budget", "Locations", "Types", "Next update", ""].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/crm/${c.id}`} className={deskRowLink}>
                        {c.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-soft">
                      {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="whitespace-nowrap tabular-nums text-soft">
                      {budgetRange(c.budgetMin, c.budgetMax)}
                    </td>
                    <td className="text-soft">{truncatedList(c.preferredLocations)}</td>
                    <td className="text-soft">{truncatedList(c.preferredTypes)}</td>
                    {/* A chip, so an overdue follow-up is visible down the column
                        without reading a single word of it. */}
                    <td className="whitespace-nowrap">
                      <Chip
                        tone={
                          nextActionLabel(c).includes("(overdue)")
                            ? "alert"
                            : c.nextActionIsFollowUp
                              ? "live"
                              : "neutral"
                        }
                      >
                        {nextActionLabel(c)}
                      </Chip>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-4">
                        <Link href={`/admin/crm/${c.id}`} className={deskRowLink}>
                          View
                        </Link>
                        <DeleteButton
                          action={deleteClient}
                          id={c.id}
                          confirmText={`Delete client "${c.name}"? Their call and note history goes too.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>

          {lastPage > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <PageLink href={pageHref(q, page - 1)} disabled={page <= 1} label="Previous" />
              <span className="text-meta font-sans tabular-nums text-ink-muted">
                Page {page} of {lastPage}
              </span>
              <PageLink href={pageHref(q, page + 1)} disabled={page >= lastPage} label="Next" />
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
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
    <Link href={href} className={deskButton}>
      {label}
    </Link>
  );
}
