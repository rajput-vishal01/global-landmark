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
import { LISTING_STATUSES } from "@/lib/taxonomy/status";
import { brokerageAmount, brokeragePending, isClosedStage } from "@/lib/taxonomy/brokerage";
import { formatIndianShort } from "@/lib/attributes";
import {
  Chip,
  EmptyState,
  KpiRow,
  KpiTile,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskButtonPrimary,
  deskRowLink,
  focusRing,
  numericCell,
} from "@/components/admin/desk";

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

type Tile = {
  href: string;
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
};

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

  // KpiTile does no arithmetic and no rounding, so every figure is turned
  // into its final string here.
  const tiles: Tile[] = [
    {
      href: "/admin/properties",
      label: "Properties",
      value: String(stats.properties),
      note: "Listings on the book",
    },
    {
      href: "/admin/projects",
      label: "Projects",
      value: String(stats.projects),
      note: "Builder projects listed",
    },
    {
      href: "/admin/deals",
      label: "Featured deals",
      value: String(stats.deals),
      note: activeDeal
        ? `Live now: ${activeDeal.property.title}`
        : "Nothing live on the homepage",
    },
    {
      href: "/admin/leads",
      label: "New leads today",
      value: String(leadStats.today),
      note: `${leadStats.week} in the last 7 days`,
    },
    {
      href: "/admin/crm/deals",
      label: "Brokerage pending",
      value: formatIndianShort(brokeragePendingTotal),
      note: "Across every open deal",
      highlight: true,
    },
  ];

  const withListings = byStatus.filter(({ n }) => n > 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Portfolio"
        sub="The whole book at a glance — what is listed, what came in today, and what is still owed."
        actions={
          <Link href="/admin/properties/new" className={deskButtonPrimary}>
            Add a property
          </Link>
        }
      />

      {/* Each tile links to the list its figure was counted from — a number on
          a dashboard is almost always the start of a question about the rows
          behind it. */}
      <KpiRow>
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className={`rounded-[10px] ${focusRing}`}>
            <KpiTile
              label={tile.label}
              value={tile.value}
              note={tile.note}
              highlight={tile.highlight}
            />
          </Link>
        ))}
      </KpiRow>

      <div>
        <p className="desk-eyebrow">Listings by status</p>
        {withListings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            note="Nothing is on the book at all, so there is no breakdown to draw. Add the first property and this table fills itself in."
            action={
              <Link href="/admin/properties/new" className={deskButton}>
                Add a property
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col" className={numericCell}>
                    Listings
                  </th>
                </tr>
              </thead>
              <tbody>
                {withListings.map(({ status, n }) => (
                  <tr key={status}>
                    <td>
                      <Link
                        href={`/admin/properties?status=${encodeURIComponent(status)}`}
                        className={deskRowLink}
                      >
                        {status}
                      </Link>
                    </td>
                    <td className={numericCell}>{n}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}

        {/* An available listing nobody has touched in a month is genuinely
            wrong, which is the one thing `alert` is for. */}
        {staleCount > 0 && (
          <Link
            href="/admin/properties?status=Available"
            className={`mt-3 inline-block ${focusRing}`}
          >
            <Chip tone="alert">
              {staleCount} available listing{staleCount === 1 ? "" : "s"} not updated in{" "}
              {STALE_DAYS}+ days
            </Chip>
          </Link>
        )}
      </div>
    </div>
  );
}
