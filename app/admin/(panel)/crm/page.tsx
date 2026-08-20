import Link from "next/link";
import { count, desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmClients, crmDeals } from "@/lib/db/schema";
import { formatIndianShort } from "@/lib/attributes";

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
        ilike(crmClients.name, pattern),
        ilike(crmClients.phone, pattern),
        ilike(crmClients.email, pattern)
      )
    : undefined;

  // Correlated subquery rather than a join, so a client with several deals
  // doesn't multiply rows before LIMIT.
  const dealCount = sql<number>`(
    select count(*) from ${crmDeals} where ${crmDeals.clientId} = ${crmClients.id}
  )`.as("deal_count");

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

const TH =
  "text-eyebrow whitespace-nowrap px-4 py-3 text-left font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-h2 text-ink">CRM · Clients</h1>
        <Link
          href="/admin/crm/new"
          className="bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Add client
        </Link>
      </div>

      <form method="get" className="flex max-w-md flex-col gap-1.5">
        <label htmlFor="q" className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
          Search
        </label>
        <div className="flex gap-2">
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Name, phone or email"
            className="w-full appearance-none rounded-none border-b border-border bg-transparent py-2 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer border border-border px-5 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
          >
            Search
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        q ? (
          <p className="text-body font-sans text-ink-muted">
            No clients match &quot;{q}&quot;.{" "}
            <Link
              href="/admin/crm"
              className="text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
            >
              Clear search
            </Link>
            .
          </p>
        ) : (
          <p className="text-body font-sans text-ink-muted">
            No clients yet.{" "}
            <Link
              href="/admin/crm/new"
              className="text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
            >
              Add the first one
            </Link>
            .
          </p>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-meta font-sans tabular-nums text-ink-muted">
            {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total} client
            {total === 1 ? "" : "s"}
          </p>

          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Name", "Contact", "Budget", "Locations", "Types", "Deals", ""].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-sans text-body font-medium text-ink">
                      {c.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink-muted">
                      {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink-muted">
                      {budgetRange(c.budgetMin, c.budgetMax)}
                    </td>
                    <td className="px-4 py-3 text-meta font-sans text-ink-muted">
                      {truncatedList(c.preferredLocations)}
                    </td>
                    <td className="px-4 py-3 text-meta font-sans text-ink-muted">
                      {truncatedList(c.preferredTypes)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink-muted">
                      {c.dealCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/crm/${c.id}`}
                        className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
