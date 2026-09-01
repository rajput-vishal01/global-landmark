import Link from "next/link";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  crmDeals,
  crmPayments,
  deals,
  leads,
  projects,
  properties,
} from "@/lib/db/schema";
import { getActiveDeal, todayIST } from "@/lib/db/queries";
import { LISTING_STATUSES, STATUS_BADGE } from "@/lib/taxonomy/status";
import { brokerageAmount, brokeragePending, isClosedStage } from "@/lib/taxonomy/brokerage";
import { formatIndianShort } from "@/lib/attributes";

const STALE_DAYS = 30;

async function counts() {
  try {
    const today = todayIST();
    const [[p], [j], [d]] = await Promise.all([
      db.select({ n: count() }).from(properties),
      db.select({ n: count() }).from(projects),
      db.select({ n: count() }).from(deals).where(gte(deals.endsAt, today)),
    ]);
    return { properties: p.n, projects: j.n, deals: d.n };
  } catch {
    return { properties: 0, projects: 0, deals: 0 };
  }
}

/** R-35: active listings grouped by status, each linking to the filtered admin list. */
async function listingsByStatus(): Promise<{ status: string; n: number }[]> {
  try {
    const rows = await db
      .select({ status: properties.listingStatus, n: count() })
      .from(properties)
      .groupBy(properties.listingStatus);
    const byStatus = new Map(rows.map((r) => [r.status, r.n]));
    return LISTING_STATUSES.map((status) => ({ status, n: byStatus.get(status) ?? 0 }));
  } catch (err) {
    console.error("listingsByStatus failed:", err);
    return LISTING_STATUSES.map((status) => ({ status, n: 0 }));
  }
}

/** R-35: new leads today / this (rolling 7-day) week. */
async function leadCounts(): Promise<{ today: number; week: number }> {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const [[t], [w]] = await Promise.all([
      db.select({ n: count() }).from(leads).where(gte(leads.createdAt, startOfToday)),
      db.select({ n: count() }).from(leads).where(gte(leads.createdAt, sevenDaysAgo)),
    ]);
    return { today: t.n, week: w.n };
  } catch (err) {
    console.error("leadCounts failed:", err);
    return { today: 0, week: 0 };
  }
}

/**
 * R-35/R-31: total brokerage pending across every open (not Closed/Lost)
 * deal. Reuses lib/taxonomy/brokerage.ts's exact functions rather than
 * duplicating the percent/override/payments math in SQL — deal counts on
 * a single brokerage's book are small enough that fetching into JS and
 * reducing is simpler and provably consistent with the per-deal figure
 * shown on /admin/crm/deals/[id].
 */
async function totalBrokeragePending(): Promise<number> {
  try {
    const openDeals = await db
      .select({
        id: crmDeals.id,
        dealValue: crmDeals.dealValue,
        brokeragePercent: crmDeals.brokeragePercent,
        brokerageAmountOverride: crmDeals.brokerageAmountOverride,
        stage: crmDeals.stage,
      })
      .from(crmDeals);
    const payments = await db
      .select({ dealId: crmPayments.dealId, amount: crmPayments.amount })
      .from(crmPayments);
    const paymentsByDeal = new Map<number, { amount: number }[]>();
    for (const p of payments) {
      const list = paymentsByDeal.get(p.dealId) ?? [];
      list.push({ amount: p.amount });
      paymentsByDeal.set(p.dealId, list);
    }
    let total = 0;
    for (const deal of openDeals) {
      if (isClosedStage(deal.stage)) continue;
      const amount = brokerageAmount(deal.dealValue, deal.brokeragePercent, deal.brokerageAmountOverride);
      const pending = brokeragePending(amount, paymentsByDeal.get(deal.id) ?? []);
      if (pending != null) total += pending;
    }
    return total;
  } catch (err) {
    console.error("totalBrokeragePending failed:", err);
    return 0;
  }
}

/** R-35: listings not updated in 30+ days. */
async function staleListingCount(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000);
    const [row] = await db
      .select({ n: count() })
      .from(properties)
      .where(and(lt(properties.updatedAt, cutoff), eq(properties.listingStatus, "Available")));
    return row?.n ?? 0;
  } catch (err) {
    console.error("staleListingCount failed:", err);
    return 0;
  }
}

export default async function AdminDashboard() {
  const [stats, activeDeal, byStatus, leadStats, brokeragePendingTotal, staleCount] =
    await Promise.all([
      counts(),
      getActiveDeal(),
      listingsByStatus(),
      leadCounts(),
      totalBrokeragePending(),
      staleListingCount(),
    ]);

  const cards = [
    { label: "Properties", value: stats.properties, href: "/admin/properties" },
    { label: "Projects", value: stats.projects, href: "/admin/projects" },
    { label: "Featured deals queued", value: stats.deals, href: "/admin/deals" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-h2 text-ink">Portfolio</h1>
        <p className="mt-2 text-body font-sans text-ink-muted">
          {activeDeal
            ? `Featured Deal is live: ${activeDeal.property.title} (through ${activeDeal.endsAt}).`
            : "No Featured Deal is currently live."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group border border-border bg-white p-6 transition-colors hover:border-gold"
          >
            <p className="font-serif text-h2 text-ink">{card.value}</p>
            <p className="text-eyebrow mt-1 font-sans font-medium uppercase tracking-[0.18em] text-ink-muted group-hover:text-gold-deep">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/leads"
          className="group border border-border bg-white p-6 transition-colors hover:border-gold"
        >
          <p className="font-serif text-h2 text-ink">
            {leadStats.today} <span className="text-body text-ink-muted">today</span>
          </p>
          <p className="mt-1 text-meta font-sans text-ink-muted">{leadStats.week} in the last 7 days</p>
          <p className="text-eyebrow mt-2 font-sans font-medium uppercase tracking-[0.18em] text-ink-muted group-hover:text-gold-deep">
            New leads
          </p>
        </Link>

        <Link
          href="/admin/crm/deals"
          className="group border border-border bg-white p-6 transition-colors hover:border-gold"
        >
          <p className="font-serif text-h2 text-ink">{formatIndianShort(brokeragePendingTotal)}</p>
          <p className="text-eyebrow mt-2 font-sans font-medium uppercase tracking-[0.18em] text-ink-muted group-hover:text-gold-deep">
            Brokerage pending
          </p>
        </Link>
      </div>

      <div>
        <p className="text-eyebrow mb-3 font-sans font-medium uppercase tracking-[0.18em] text-ink-muted">
          Listings by status
        </p>
        <div className="flex flex-wrap gap-2.5">
          {byStatus
            .filter(({ n }) => n > 0)
            .map(({ status, n }) => (
            <Link
              key={status}
              href={`/admin/properties?status=${encodeURIComponent(status)}`}
              className={`inline-flex items-center gap-2 whitespace-nowrap border px-3 py-1.5 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] transition-opacity hover:opacity-80 ${STATUS_BADGE[status as keyof typeof STATUS_BADGE] ?? "border-border bg-ink/5 text-ink-muted"}`}
            >
              {status}
              <span className="tabular-nums">{n}</span>
            </Link>
          ))}
        </div>
        {staleCount > 0 && (
          <Link
            href="/admin/properties?status=Available"
            className="mt-3 inline-block text-meta font-sans text-error underline decoration-error/40 underline-offset-4 hover:decoration-error"
          >
            {staleCount} available listing{staleCount === 1 ? "" : "s"} not updated in {STALE_DAYS}+ days
          </Link>
        )}
      </div>

      <div>
        <Link
          href="/admin/properties/new"
          className="inline-block bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Add a property
        </Link>
      </div>
    </div>
  );
}
