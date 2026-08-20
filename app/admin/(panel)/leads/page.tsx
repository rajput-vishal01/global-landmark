import Link from "next/link";
import { and, count, desc, eq, ilike, inArray, isNotNull, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, properties } from "@/lib/db/schema";
import { LEAD_STATUS_BADGE, isLeadStatus } from "@/lib/taxonomy/leads";
import { LeadFilters, type LeadFilterValues } from "./LeadFilters";
import { LeadEditForm } from "./LeadEditForm";
import { convertLead } from "./actions";

export const metadata = { title: "Leads" };

const PAGE_SIZE = 25;

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
        ilike(leads.name, pattern),
        ilike(leads.email, pattern),
        ilike(leads.phone, pattern),
        ilike(leads.interest, pattern)
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

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function pageHref(values: LeadFilterValues, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return `/admin/leads${params.size ? `?${params}` : ""}`;
}

const TH =
  "text-eyebrow whitespace-nowrap px-4 py-3 text-left font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-h2 text-ink">Leads</h1>
        {newCount > 0 && (
          <span className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-gold-deep">
            <span aria-hidden className="h-2 w-2 rounded-full bg-gold-deep" />
            {newCount} new
          </span>
        )}
      </div>

      <LeadFilters values={values} sources={sources} agents={agents} isFiltered={isFiltered} />

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          {isFiltered ? (
            <>
              No leads match these filters.{" "}
              <Link
                href="/admin/leads"
                className="text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
              >
                Clear filters
              </Link>{" "}
              to see the whole inbox.
            </>
          ) : (
            "No leads yet."
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-meta font-sans tabular-nums text-ink-muted">
            {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total}
            {isFiltered ? " matching" : ""} lead{total === 1 ? "" : "s"}
          </p>

          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Lead", "Contact", "Interest", "Properties", "Status / assigned", "Received", ""].map(
                    (h, i) => (
                      <th key={i} className={TH}>
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
                    <tr
                      key={lead.id}
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
                              {lead.name}
                            </p>
                            {lead.message && (
                              <p
                                className="mt-0.5 max-w-xs truncate font-sans text-meta text-ink-muted"
                                title={lead.message}
                              >
                                {lead.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-sans text-meta text-ink">
                        <div className="flex flex-col gap-0.5">
                          {lead.email && <span>{lead.email}</span>}
                          {lead.phone && <span>{lead.phone}</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-sans text-meta capitalize text-ink">
                        {lead.interest ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-sans text-meta text-ink">
                        {shortlisted.length === 0 ? (
                          "—"
                        ) : (
                          <details>
                            <summary className="cursor-pointer text-ink underline decoration-border underline-offset-4 hover:decoration-gold">
                              {shortlisted.length} propert{shortlisted.length === 1 ? "y" : "ies"}
                            </summary>
                            <ul className="mt-1.5 flex flex-col gap-0.5 text-ink-muted">
                              {shortlisted.map((p, i) => (
                                <li key={i}>{p.refCode ?? p.title}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] ${
                              LEAD_STATUS_BADGE[lead.status as keyof typeof LEAD_STATUS_BADGE] ??
                              "border-border bg-ink/5 text-ink-muted"
                            }`}
                          >
                            {lead.status}
                            {lead.assignedTo ? ` · ${lead.assignedTo}` : ""}
                          </span>
                          <LeadEditForm id={lead.id} status={lead.status} assignedTo={lead.assignedTo} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink-muted">
                        {formatDate(lead.createdAt)}
                        {lead.source && <div className="text-ink-muted/70">{lead.source}</div>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {/* R-30: one-click convert; a lead already converted
                            still shows the action — re-running it would just
                            create a second client, so leave that judgment to
                            the admin rather than tracking a boolean here. */}
                        <form action={convertLead}>
                          <input type="hidden" name="id" value={lead.id} />
                          <button
                            type="submit"
                            className="cursor-pointer text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                          >
                            Convert to client
                          </button>
                        </form>
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
              <PageLink href={pageHref(values, page - 1)} disabled={page <= 1} label="Previous" />
              <span className="text-meta font-sans tabular-nums text-ink-muted">
                Page {page} of {lastPage}
              </span>
              <PageLink href={pageHref(values, page + 1)} disabled={page >= lastPage} label="Next" />
            </nav>
          )}

          <a
            href="/api/admin/leads/export"
            className="self-start text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
          >
            Export all leads to CSV
          </a>
        </div>
      )}
    </div>
  );
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
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
    <Link href={href} className={`${base} text-ink transition-colors hover:border-gold hover:text-gold-deep`}>
      {label}
    </Link>
  );
}
