import Link from "next/link";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  notInArray,
  or,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  crmActivities,
  crmDeals,
  crmPayments,
  deals,
  leads,
  projects,
  properties,
  propertyImages,
  tourRequests,
} from "@/lib/db/schema";
import { getActiveDeal, todayIST } from "@/lib/db/queries";
import { LISTING_STATUSES, PUBLICATION_STATES } from "@/lib/taxonomy/status";
import {
  CLOSED_STAGES,
  DEAL_STAGES,
  brokerageAmount,
  brokeragePending,
  isClosedStage,
} from "@/lib/taxonomy/brokerage";
import { formatIndianShort } from "@/lib/attributes";
import { formatDateTime } from "@/lib/dates";
import {
  Card,
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

/** Rows in the activity feed, and the cap on the "broken listing" scan. */
const FEED_SIZE = 8;
const INCOMPLETE_CAP = 50;

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

type StageRow = { stage: string; n: number; pending: number | null };

/**
 * R-35/R-31: the pipeline in one pass — total brokerage pending across every
 * open deal, plus the per-stage split.
 *
 * Reuses lib/taxonomy/brokerage.ts's exact functions rather than duplicating
 * the percent/override/payments math in SQL — deal counts on a single
 * brokerage's book are small enough that fetching into JS and reducing is
 * simpler and provably consistent with the per-deal figure shown on
 * /admin/crm/deals/[id]. One fetch serves the tile and the table, so the two
 * cannot disagree.
 *
 * `pendingTotal` deliberately skips Closed and Lost, which is what the tile
 * has always counted. The per-stage column still shows what a Closed deal
 * has not paid yet — that is money owed and worth chasing — while Lost shows
 * an em dash, because a deal that fell through owes nobody a commission.
 */
async function pipeline(): Promise<{
  pendingTotal: number;
  inPlay: number;
  total: number;
  stages: StageRow[];
}> {
  const empty = {
    pendingTotal: 0,
    inPlay: 0,
    total: 0,
    stages: DEAL_STAGES.map((stage) => ({ stage, n: 0, pending: 0 as number | null })),
  };
  try {
    const [dealRows, payments] = await Promise.all([
      db
        .select({
          id: crmDeals.id,
          dealValue: crmDeals.dealValue,
          brokeragePercent: crmDeals.brokeragePercent,
          brokerageAmountOverride: crmDeals.brokerageAmountOverride,
          stage: crmDeals.stage,
        })
        .from(crmDeals),
      db.select({ dealId: crmPayments.dealId, amount: crmPayments.amount }).from(crmPayments),
    ]);

    const paymentsByDeal = new Map<number, { amount: number }[]>();
    for (const p of payments) {
      const list = paymentsByDeal.get(p.dealId) ?? [];
      list.push({ amount: p.amount });
      paymentsByDeal.set(p.dealId, list);
    }

    // Seeded with the known stages so the table keeps their canonical order;
    // a row carrying a stage outside the taxonomy still gets a bucket rather
    // than vanishing from a count somebody is reconciling against the board.
    const byStage = new Map<string, { n: number; pending: number }>(
      DEAL_STAGES.map((s) => [s, { n: 0, pending: 0 }])
    );

    let pendingTotal = 0;
    let inPlay = 0;
    for (const deal of dealRows) {
      const slot = byStage.get(deal.stage) ?? { n: 0, pending: 0 };
      byStage.set(deal.stage, slot);
      slot.n += 1;

      const amount = brokerageAmount(
        deal.dealValue,
        deal.brokeragePercent,
        deal.brokerageAmountOverride
      );
      const pending = brokeragePending(amount, paymentsByDeal.get(deal.id) ?? []) ?? 0;
      slot.pending += pending;
      if (!isClosedStage(deal.stage)) {
        pendingTotal += pending;
        inPlay += 1;
      }
    }

    return {
      pendingTotal,
      inPlay,
      total: dealRows.length,
      stages: [...byStage].map(([stage, s]) => ({
        stage,
        n: s.n,
        pending: stage === "Lost" ? null : s.pending,
      })),
    };
  } catch (err) {
    console.error("pipeline failed:", err);
    return empty;
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

/**
 * The unfinished work: four things somebody has to actually do something
 * about. Everything here is a queue that only empties by hand, which is what
 * separates it from the figures above — a listing count is the size of the
 * book, these are the size of the backlog.
 */
async function attention(): Promise<{
  newLeads: number;
  newTours: number;
  submissions: number;
  overdueFollowUps: number;
}> {
  const zero = { newLeads: 0, newTours: 0, submissions: 0, overdueFollowUps: 0 };
  try {
    const now = new Date();
    const [[l], [t], [s], [f]] = await Promise.all([
      // "Not contacted" is status = 'new', the same reading /admin/leads uses
      // for its unread badge — a lead has no separate read flag.
      db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
      db.select({ n: count() }).from(tourRequests).where(eq(tourRequests.status, "new")),
      // The exact shape /admin/submissions queues up: sent by the public sell
      // form and still a draft.
      db
        .select({ n: count() })
        .from(properties)
        .where(
          and(isNotNull(properties.submittedAt), eq(properties.publicationState, "draft"))
        ),
      // Distinct deals, not activities: three overdue reminders on one deal
      // are one phone call. Settled deals are excluded, otherwise a reminder
      // logged before a deal closed would nag forever.
      //
      // ponytail: an activity has no "done" flag, so a follow-up date in the
      // past counts as outstanding until the deal leaves the board. Add a
      // completed_at column if brokers start ignoring this number.
      db
        .select({ n: countDistinct(crmActivities.dealId) })
        .from(crmActivities)
        .innerJoin(crmDeals, eq(crmDeals.id, crmActivities.dealId))
        .where(
          and(lt(crmActivities.followUpAt, now), notInArray(crmDeals.stage, [...CLOSED_STAGES]))
        ),
    ]);
    return {
      newLeads: l?.n ?? 0,
      newTours: t?.n ?? 0,
      submissions: s?.n ?? 0,
      overdueFollowUps: f?.n ?? 0,
    };
  } catch (err) {
    console.error("attention failed:", err);
    return zero;
  }
}

type FeedItem = {
  key: string;
  kind: "Lead" | "Tour" | "Submission";
  who: string;
  detail: string;
  at: Date;
  href: string;
};

/**
 * The last few things that happened, newest first, across the three surfaces
 * the public site writes to. Each row links at the record: leads have no
 * detail route, so the enquiry inbox is opened searched for the name — which
 * is what a broker would type in anyway.
 */
async function recentActivity(): Promise<FeedItem[]> {
  try {
    const [leadRows, tourRows, submissionRows] = await Promise.all([
      db
        .select({ id: leads.id, name: leads.name, interest: leads.interest, at: leads.createdAt })
        .from(leads)
        .orderBy(desc(leads.createdAt))
        .limit(FEED_SIZE),
      db
        .select({
          id: tourRequests.id,
          name: tourRequests.name,
          tourType: tourRequests.tourType,
          at: tourRequests.createdAt,
        })
        .from(tourRequests)
        .orderBy(desc(tourRequests.createdAt))
        .limit(FEED_SIZE),
      db
        .select({ id: properties.id, title: properties.title, at: properties.submittedAt })
        .from(properties)
        .where(isNotNull(properties.submittedAt))
        .orderBy(desc(properties.submittedAt))
        .limit(FEED_SIZE),
    ]);

    const feed: FeedItem[] = [
      ...leadRows.map((r) => ({
        key: `lead-${r.id}`,
        kind: "Lead" as const,
        who: r.name,
        detail: r.interest ?? "Enquiry",
        at: r.at,
        href: `/admin/leads?q=${encodeURIComponent(r.name)}`,
      })),
      ...tourRows.map((r) => ({
        key: `tour-${r.id}`,
        kind: "Tour" as const,
        who: r.name,
        detail: r.tourType ?? "Tour request",
        at: r.at,
        href: "/admin/tours",
      })),
      ...submissionRows.flatMap((r) =>
        r.at
          ? [
              {
                key: `sub-${r.id}`,
                kind: "Submission" as const,
                who: r.title,
                detail: "Sent through the sell form",
                at: r.at,
                href: `/admin/properties/${r.id}/edit`,
              },
            ]
          : []
      ),
    ];

    return feed.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, FEED_SIZE);
  } catch (err) {
    console.error("recentActivity failed:", err);
    return [];
  }
}

type IncompleteListing = { id: number; title: string; missing: string };

/**
 * Publication state, plus the published listings that are missing the two
 * things a visitor notices immediately.
 *
 * Only published rows are scanned: a draft with no photographs yet is a
 * listing mid-entry, not a fault. The scan is capped rather than unbounded —
 * a book with more than fifty broken live listings does not need an exact
 * figure to know what to do next.
 */
async function portfolio(): Promise<{
  byState: { state: string; n: number }[];
  incomplete: IncompleteListing[];
}> {
  const emptyStates = PUBLICATION_STATES.map((state) => ({ state: state as string, n: 0 }));
  try {
    const [stateRows, brokenRows] = await Promise.all([
      db
        .select({ state: properties.publicationState, n: count() })
        .from(properties)
        .groupBy(properties.publicationState),
      db
        .select({
          id: properties.id,
          title: properties.title,
          price: properties.demandPrice,
          images: count(propertyImages.id),
        })
        .from(properties)
        .leftJoin(propertyImages, eq(propertyImages.propertyId, properties.id))
        .where(eq(properties.publicationState, "published"))
        .groupBy(properties.id)
        .having(or(eq(count(propertyImages.id), 0), isNull(properties.demandPrice)))
        .orderBy(desc(properties.updatedAt))
        .limit(INCOMPLETE_CAP + 1),
    ]);

    const byMap = new Map(stateRows.map((r) => [r.state, r.n]));
    return {
      byState: PUBLICATION_STATES.map((state) => ({
        state: state as string,
        n: byMap.get(state) ?? 0,
      })),
      incomplete: brokenRows.map((r) => ({
        id: r.id,
        title: r.title,
        missing:
          r.images === 0 && r.price == null
            ? "No photographs, no price"
            : r.images === 0
              ? "No photographs"
              : "No price",
      })),
    };
  } catch (err) {
    console.error("portfolio failed:", err);
    return { byState: emptyStates, incomplete: [] };
  }
}

type Tile = {
  href: string;
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
};

type AttentionRow = { href: string; label: string; note: string; n: number };

export default async function AdminDashboard() {
  const [stats, activeDeal, byStatus, leadStats, book, staleCount, todo, feed, health] =
    await Promise.all([
      counts(),
      getActiveDeal(),
      listingsByStatus(),
      leadCounts(),
      pipeline(),
      staleListingCount(),
      attention(),
      recentActivity(),
      portfolio(),
    ]);

  const published = health.byState.find((s) => s.state === "published")?.n ?? 0;
  const draft = health.byState.find((s) => s.state === "draft")?.n ?? 0;

  // KpiTile does no arithmetic and no rounding, so every figure is turned
  // into its final string here.
  const tiles: Tile[] = [
    {
      href: "/admin/properties",
      label: "Properties",
      value: String(stats.properties),
      note: `${published} published · ${draft} draft`,
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
      href: "/admin/crm/deals?view=list&open=1",
      label: "Deals in play",
      value: String(book.inPlay),
      note: `of ${book.total} on the book`,
    },
    {
      href: "/admin/crm/deals",
      label: "Brokerage pending",
      value: formatIndianShort(book.pendingTotal),
      note: "Across every open deal",
      highlight: true,
    },
  ];

  // Only the queues that actually have something in them. A row of zeroes
  // reads as work when it is the opposite, and the empty state below says
  // the desk is clear far more plainly than four noughts do.
  const todoRows: AttentionRow[] = [
    {
      href: "/admin/leads?status=new",
      label: "Leads nobody has contacted",
      note: "Still sitting at “new” in the enquiry inbox",
      n: todo.newLeads,
    },
    {
      href: "/admin/tours",
      label: "Tour requests not booked in",
      note: "Visitors waiting to hear back about a viewing",
      n: todo.newTours,
    },
    {
      href: "/admin/submissions",
      label: "Submissions awaiting approval",
      note: "Sent by owners through the public sell form",
      n: todo.submissions,
    },
    {
      href: "/admin/crm/deals?view=list&open=1",
      label: "Deals with a follow-up now due",
      note: "The reminder date on the last activity has passed",
      n: todo.overdueFollowUps,
    },
  ].filter((row) => row.n > 0);

  const withListings = byStatus.filter(({ n }) => n > 0);
  const incompleteShown = health.incomplete.slice(0, 4);
  const incompleteCount =
    health.incomplete.length > INCOMPLETE_CAP
      ? `${INCOMPLETE_CAP}+`
      : String(health.incomplete.length);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Portfolio"
        sub="What needs answering today, and how the book is doing behind it."
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

      {/* First after the figures, because it is the only block on the screen
          that asks for something back. Every count is a link to the rows it
          counted, so a number can be worked through rather than only read. */}
      <div>
        <p className="desk-eyebrow">Needs attention</p>
        {todoRows.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            note="Every enquiry has been picked up, every tour request answered, and no submission is sitting in the review queue."
            action={
              <Link href="/admin/leads" className={deskButton}>
                Open the enquiry inbox
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Waiting on someone</th>
                  <th scope="col" className={numericCell}>
                    Records
                  </th>
                </tr>
              </thead>
              <tbody>
                {todoRows.map((row) => (
                  <tr key={row.href}>
                    <td>
                      <Link href={row.href} className={deskRowLink}>
                        {row.label}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-muted">{row.note}</p>
                    </td>
                    <td className={numericCell}>
                      <Link href={row.href} className={`${deskRowLink} ${focusRing}`}>
                        {row.n}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </div>

      {/* One balanced flow, not two fixed rows. A `grid-cols-2` pairs
          whatever is adjacent in the source, which put a one-row card beside
          an eight-row table and left half the screen empty. CSS columns
          balance by height, so this stays even as each card fills up.
          `break-inside-avoid` is what stops a card being sliced in two. */}
      <div className="columns-1 gap-4 lg:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
        <div>
          <p className="desk-eyebrow">Recent activity</p>
          {feed.length === 0 ? (
            <EmptyState
              title="Nothing has come in"
              note="Enquiries, tour requests and owner submissions from the public site all land here on their own once the site starts getting traffic."
            />
          ) : (
            // overflow-hidden so a hovered first or last row does not paint
            // its square corner over the card's radius.
            <Card
              className="flex flex-col divide-y divide-line-soft overflow-hidden"
              pad="p-0"
            >
              {feed.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-raise ${focusRing}`}
                >
                  <span className="mt-0.5 shrink-0">
                    <Chip tone={item.kind === "Lead" ? "live" : "quiet"}>{item.kind}</Chip>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {item.who}
                    </span>
                    <span className="block truncate text-[12px] text-muted">{item.detail}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[11.5px] text-muted">
                    {formatDateTime(item.at)}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </div>

        <div>
          <p className="desk-eyebrow">Pipeline</p>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col" className={numericCell}>
                    Deals
                  </th>
                  <th scope="col" className={numericCell}>
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {book.stages.map(({ stage, n, pending }) => (
                  <tr key={stage}>
                    <td>
                      {/* The board ignores ?stage=, the list honours it — so
                          a stage link has to open the list view. */}
                      <Link
                        href={`/admin/crm/deals?view=list&stage=${encodeURIComponent(stage)}`}
                        className={deskRowLink}
                      >
                        {stage}
                      </Link>
                    </td>
                    <td className={numericCell}>{n}</td>
                    <td className={`${numericCell} text-gold-deep`}>
                      {pending == null ? "—" : formatIndianShort(pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <p className="mt-2 text-[12px] text-muted">
            Lost deals owe nobody a commission, so they carry no pending figure. Closed ones
            still do until the last payment is entered.
          </p>
        </div>

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
              href="/admin/properties?status=Available&sort=dom"
              className={`mt-3 inline-block ${focusRing}`}
            >
              <Chip tone="alert">
                {staleCount} available listing{staleCount === 1 ? "" : "s"} not updated in{" "}
                {STALE_DAYS}+ days
              </Chip>
            </Link>
          )}
        </div>

        <div>
          <p className="desk-eyebrow">Portfolio health</p>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Publication state</th>
                  <th scope="col" className={numericCell}>
                    Listings
                  </th>
                </tr>
              </thead>
              <tbody>
                {health.byState.map(({ state, n }) => (
                  <tr key={state}>
                    <td>
                      <Link
                        href={`/admin/properties?publication=${state}`}
                        className={`${deskRowLink} capitalize`}
                      >
                        {state}
                      </Link>
                    </td>
                    <td className={numericCell}>{n}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <span className="font-medium text-ink">Live but incomplete</span>
                    <p className="mt-0.5 text-[12px] text-muted">
                      Published with no photographs or no price
                    </p>
                  </td>
                  <td className={numericCell}>{incompleteCount}</td>
                </tr>
              </tbody>
            </Table>
          </TableWrap>

          {/* No admin list can filter on "has no images", so the rows go here
              by name — four of them is enough to start, and each opens the
              editor that fixes it. */}
          {incompleteShown.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {incompleteShown.map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/properties/${row.id}/edit`}
                  className={`flex items-center justify-between gap-3 text-[12.5px] ${focusRing}`}
                >
                  <span className={`min-w-0 truncate ${deskRowLink}`}>{row.title}</span>
                  <span className="shrink-0 text-muted">{row.missing}</span>
                </Link>
              ))}
              {health.incomplete.length > incompleteShown.length && (
                <Link
                  href="/admin/properties?publication=published"
                  className={`text-[12.5px] text-muted underline-offset-4 hover:underline ${focusRing}`}
                >
                  and {health.incomplete.length - incompleteShown.length} more
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
