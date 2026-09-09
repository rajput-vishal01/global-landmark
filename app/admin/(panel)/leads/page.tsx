import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { and, count, desc, eq, like, inArray, isNotNull, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, properties } from "@/lib/db/schema";
import { isLeadStatus } from "@/lib/taxonomy/leads";
import { LeadFilters, type LeadFilterValues } from "./LeadFilters";
import { LeadEditForm } from "./LeadEditForm";
import { convertLead, deleteLead } from "./actions";
import { formatDateTime } from "@/lib/dates";
import {
  Chip,
  type ChipTone,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskButtonSmall,
  deskRowLink,
} from "@/components/admin/desk";

export const metadata = { title: "Leads" };

const PAGE_SIZE = 25;

/**
 * Lead status on the gold ramp. `dropped` is `neutral`, not `alert`: a lead
 * that went nowhere is a normal end to the list, and `alert` is reserved for
 * states that are actually wrong.
 */
const LEAD_TONE: Record<string, ChipTone> = {
  new: "live",
  contacted: "quiet",
  converted: "strong",
  dropped: "neutral",
};

/** Same LIKE-metacharacter escape as the properties list — parameterised by
 * drizzle, this is about matching what was typed, not injection. */
const likeEscape = (q: string) => q.replace(/[\\%_]/g, (m) => `\\${m}`);

type LeadRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  interest: string | null;
  message: string | null;
  status: string;
  assignedTo: string | null;
  source: string | null;
  propertyIds: number[] | null;
  createdAt: Date;
};

type PropertyRef = { refCode: string | null; title: string };

/**
 * Local to this route, same as the properties admin list — the only caller,
 * unfiltered by any public-visibility concept (leads have none), and PII
 * (email/phone/message) that must never leak into lib/db/queries.ts's public
 * query layer.
 */
async function listPage(
  values: LeadFilterValues,
  page: number
): Promise<{ rows: LeadRow[]; total: number; newCount: number }> {
  const conditions: SQL[] = [];

  if (values.q) {
    const pattern = `%${likeEscape(values.q)}%`;
    conditions.push(
      or(
        like(leads.name, pattern),
        like(leads.email, pattern),
        like(leads.phone, pattern),
        like(leads.interest, pattern)
      )!
    );
  }
  if (values.status && isLeadStatus(values.status)) conditions.push(eq(leads.status, values.status));
  if (values.source) conditions.push(eq(leads.source, values.source));
  if (values.assignedTo) conditions.push(eq(leads.assignedTo, values.assignedTo));

  const where = conditions.length ? and(...conditions) : undefined;

  try {
    // "Unread" (R-32) is `status === 'new'` rather than a separate boolean
    // column — the field the requirement already asks for (status) can
    // express it, and a lead has no reason to be both non-"new" and unread.
    // This count ignores the active filters on purpose: it's a global inbox
    // badge, not a "matches your filter" count.
    const [rows, [totals], [unread]] = await Promise.all([
      db
        .select({
          id: leads.id,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          interest: leads.interest,
          message: leads.message,
          status: leads.status,
          assignedTo: leads.assignedTo,
          source: leads.source,
          propertyIds: leads.propertyIds,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(where)
        .orderBy(desc(leads.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ n: count() }).from(leads).where(where),
      db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
    ]);
    return { rows, total: totals?.n ?? 0, newCount: unread?.n ?? 0 };
  } catch (err) {
    console.error("admin lead list failed:", err);
    return { rows: [], total: 0, newCount: 0 };
  }
}

/** Distinct source / assignee values actually in the table, for the filter
 * dropdowns — neither has a fixed taxonomy (source is whatever the public
 * surface sent, agents have no roster table yet). */
async function listFilterOptions(): Promise<{ sources: string[]; agents: string[] }> {
  try {
    const [sourceRows, agentRows] = await Promise.all([
      db.selectDistinct({ v: leads.source }).from(leads).where(isNotNull(leads.source)),
      db.selectDistinct({ v: leads.assignedTo }).from(leads).where(isNotNull(leads.assignedTo)),
    ]);
    return {
      sources: sourceRows.map((r) => r.v).filter((v): v is string => Boolean(v)).sort(),
      agents: agentRows.map((r) => r.v).filter((v): v is string => Boolean(v)).sort(),
    };
  } catch (err) {
    console.error("admin lead filter options failed:", err);
    return { sources: [], agents: [] };
  }
}

/** Resolves the shortlisted `propertyIds` on this page of rows to ref
 * code/title in one extra query, rather than N+1 per row. */
async function resolveProperties(rows: LeadRow[]): Promise<Map<number, PropertyRef>> {
  const ids = [...new Set(rows.flatMap((r) => r.propertyIds ?? []))];
  if (!ids.length) return new Map();
  try {
    const found = await db
      .select({ id: properties.id, refCode: properties.refCode, title: properties.title })
      .from(properties)
      .where(inArray(properties.id, ids));
    return new Map(found.map((p) => [p.id, { refCode: p.refCode, title: p.title }]));
  } catch (err) {
    console.error("admin lead property resolve failed:", err);
    return new Map();
  }
}


function pageHref(values: LeadFilterValues, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return `/admin/leads${params.size ? `?${params}` : ""}`;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    source?: string;
    assignedTo?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const values: LeadFilterValues = {
    q: (params.q ?? "").trim().slice(0, 100),
    status: params.status && isLeadStatus(params.status) ? params.status : "",
    source: (params.source ?? "").trim().slice(0, 100),
    assignedTo: (params.assignedTo ?? "").trim().slice(0, 100),
  };

  const isFiltered = Boolean(values.q || values.status || values.source || values.assignedTo);

  const requestedPage = Math.max(1, Number(params.page) || 1);
  const [{ rows, total, newCount }, { sources, agents }] = await Promise.all([
    listPage(values, requestedPage),
    listFilterOptions(),
  ]);
  const propertyMap = await resolveProperties(rows);

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Leads"
        sub="Every enquiry the public site has sent in, who it belongs to, and how far it got."
        actions={
          <a href="/api/admin/leads/export" className={deskButton}>
            Export CSV
          </a>
        }
      />

      <LeadFilters values={values} sources={sources} agents={agents} isFiltered={isFiltered} />

      {/* The unread count, then the count of what came back, on one line.
          Reading "1–4 of 4" beside the filters is what tells you they did
          something. */}
      <div className="flex flex-wrap items-center gap-2">
        {newCount > 0 && (
          <Chip tone="live" title="Leads nobody has touched yet">
            {newCount} new
          </Chip>
        )}
        <span className="ml-auto text-[12px] tabular-nums text-muted">
          {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total}
          {isFiltered ? " matching" : ""} lead{total === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        isFiltered ? (
          <EmptyState
            title="Nothing matches those filters"
            note="No lead answers to this combination of search, status, source and owner. Widening one of them — usually the status — brings the most back."
            action={
              <Link href="/admin/leads" className={deskButton}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No leads yet"
            note="Enquiries from the contact form, the WhatsApp buttons and the enquiry cart land here on their own. There is nothing to set up."
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <TableWrap>
            <Table className="min-w-[1000px]">
              <thead>
                <tr>
                  {["Lead", "Contact", "Interest", "Properties", "Status / assigned", "Received", ""].map(
                    (h, i) => (
                      <th key={i} scope="col">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => {
                  const isUnread = lead.status === "new";
                  const shortlisted = (lead.propertyIds ?? [])
                    .map((id) => propertyMap.get(id))
                    .filter((p): p is PropertyRef => Boolean(p));
                  return (
                    /* Untouched leads carry a faint gold wash, and their
                       status chip carries the gold spine. The old separate
                       unread dot said the same thing a third time. */
                    <tr key={lead.id} className={isUnread ? "bg-gold/5" : ""}>
                      <td>
                        <div className="min-w-0">
                          <p className={isUnread ? "font-semibold text-ink" : "font-medium text-ink"}>
                            {lead.name}
                          </p>
                          {lead.message && (
                            <p
                              className="mt-0.5 max-w-xs truncate text-[12px] text-muted"
                              title={lead.message}
                            >
                              {lead.message}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-soft">
                        <div className="flex flex-col gap-0.5">
                          {lead.email && <span>{lead.email}</span>}
                          {lead.phone && <span>{lead.phone}</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap capitalize text-soft">
                        {lead.interest ?? "—"}
                      </td>
                      <td className="text-soft">
                        {shortlisted.length === 0 ? (
                          "—"
                        ) : (
                          <details>
                            <summary className={`cursor-pointer ${deskRowLink}`}>
                              {shortlisted.length} propert{shortlisted.length === 1 ? "y" : "ies"}
                            </summary>
                            <ul className="mt-1.5 flex flex-col gap-0.5 text-muted">
                              {shortlisted.map((p, i) => (
                                <li key={i}>{p.refCode ?? p.title}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-2">
                          <Chip tone={LEAD_TONE[lead.status] ?? "neutral"}>
                            {lead.status}
                            {lead.assignedTo ? ` · ${lead.assignedTo}` : ""}
                          </Chip>
                          <LeadEditForm id={lead.id} status={lead.status} assignedTo={lead.assignedTo} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {formatDateTime(lead.createdAt)}
                        {lead.source && <div>{lead.source}</div>}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {/* R-30: one-click convert; a lead already converted
                              still shows the action — re-running it would just
                              create a second client, so leave that judgment to
                              the admin rather than tracking a boolean here. */}
                          <form action={convertLead}>
                            <input type="hidden" name="id" value={lead.id} />
                            <button type="submit" className={deskButtonSmall}>
                              Convert to client
                            </button>
                          </form>
                          <DeleteButton
                            action={deleteLead}
                            id={lead.id}
                            confirmText={`Delete the enquiry from ${lead.name}? Nothing else is removed — a client converted from it keeps their record.`}
                          />
                        </div>
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
              <PageLink href={pageHref(values, page - 1)} disabled={page <= 1} label="Previous" />
              <span className="text-[12px] tabular-nums text-muted">
                Page {page} of {lastPage}
              </span>
              <PageLink href={pageHref(values, page + 1)} disabled={page >= lastPage} label="Next" />
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
