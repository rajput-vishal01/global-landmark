import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmDeals } from "@/lib/db/schema";
import {
  BoardView,
  ListFilters,
  ListView,
  agentLabel,
  filterRows,
  readFilters,
} from "./_views";
import { formatIndianShort } from "@/lib/attributes";
import { DEAL_STAGES, brokerageAmount, brokeragePending } from "@/lib/taxonomy/brokerage";
import {
  Card,
  KpiRow,
  KpiTile,
  PageHead,
  deskButtonPrimary,
} from "@/components/admin/desk";

export const metadata = { title: "Deal pipeline" };

async function loadDeals() {
  try {
    return await db.query.crmDeals.findMany({
      with: {
        client: { columns: { id: true, name: true } },
        property: { columns: { id: true, title: true, refCode: true } },
        payments: { columns: { amount: true } },
      },
      orderBy: [desc(crmDeals.updatedAt)],
    });
  } catch (err) {
    console.error("loadDeals failed:", err);
    return [];
  }
}

type Deal = Awaited<ReturnType<typeof loadDeals>>[number];

/** Deal + its two derived money figures, computed once and reused everywhere below. */
function withFigures(deal: Deal) {
  const amount = brokerageAmount(deal.dealValue, deal.brokeragePercent, deal.brokerageAmountOverride);
  const pending = brokeragePending(amount, deal.payments);
  return { deal, amount, pending };
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default async function DealsPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    stage?: string;
    agent?: string;
    q?: string;
    open?: string;
  }>;
}) {
  // View and filters both live in the URL, not component state: they survive
  // the reload a stage change triggers, the back button works, and a filtered
  // pipeline is a link someone can send.
  const sp = await searchParams;
  const isList = sp.view === "list";
  const filters = readFilters(sp);
  const rows = (await loadDeals()).map(withFigures);
  const now = new Date();

  // "Total pending" and the per-agent split both skip Lost deals — a fallen-
  // through deal owes nobody a commission, so counting its unpaid brokerage
  // would overstate real receivables.
  const openRows = rows.filter((r) => r.deal.stage !== "Lost");
  const totalPending = openRows.reduce((sum, r) => sum + (r.pending ?? 0), 0);

  const closedThisMonth = rows.filter(
    (r) => r.deal.stage === "Closed" && r.deal.closedAt && isSameMonth(new Date(r.deal.closedAt), now)
  );
  const closedValueThisMonth = closedThisMonth.reduce((sum, r) => sum + (r.deal.dealValue ?? 0), 0);

  const stageCounts = new Map<string, number>(DEAL_STAGES.map((s) => [s, 0]));
  for (const r of rows) stageCounts.set(r.deal.stage, (stageCounts.get(r.deal.stage) ?? 0) + 1);

  const agentPending = new Map<string, number>();
  for (const r of openRows) {
    const agent = r.deal.assignedTo?.trim() || "Unassigned";
    agentPending.set(agent, (agentPending.get(agent) ?? 0) + (r.pending ?? 0));
  }
  const agentRows = [...agentPending.entries()].sort((a, b) => b[1] - a[1]);

  const VIEWS = [
    { label: "Board", href: "/admin/crm/deals", active: !isList },
    { label: "List", href: "/admin/crm/deals?view=list", active: isList },
  ];

  // Agent options come from the deals that exist, not a fixed list — an agent
  // who has never been assigned a deal is not worth an empty filter option.
  const agents = [...new Set(rows.map((r) => agentLabel(r.deal.assignedTo)))].sort();
  const listRows = isList ? filterRows(rows, filters) : rows;

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Deal pipeline"
        sub="Every deal in play, what it is worth, and what brokerage is still owed."
        actions={
          <>
            {/* Plain links, not a client toggle — the view is a URL param, so
                this needs no JavaScript and works on a middle-click. */}
            <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
              {VIEWS.map(({ label, href, active }) => (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    active ? "bg-ink text-cream" : "text-soft hover:text-ink"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <Link href="/admin/crm/deals/new" className={deskButtonPrimary}>
              New deal
            </Link>
          </>
        }
      />

      {/* R-31 summary view: total pending, this month's closed value,
          per-stage counts, per-agent split. */}
      <KpiRow>
        <KpiTile
          label="Brokerage pending"
          value={formatIndianShort(totalPending)}
          // "Not lost", not "open". A Closed deal with brokerage still unpaid
          // is money owed and belongs in this figure — but the list's "Still
          // in play" filter hides Closed, so the two deliberately count
          // different sets and each has to say which.
          note="Everything not lost"
          highlight
        />
        <KpiTile
          label="Closed this month"
          value={formatIndianShort(closedValueThisMonth)}
          note={`${closedThisMonth.length} deal${closedThisMonth.length === 1 ? "" : "s"}`}
        />
      </KpiRow>

      {/* These two are lists, not single figures, so they stay cards: a
          KpiTile takes one formatted string and would have to drop the
          breakdown to fit. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <p className="desk-eyebrow">Per stage</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink">
            {DEAL_STAGES.map((s) => (
              <span key={s}>
                {s} <span className="tabular-nums text-muted">({stageCounts.get(s) ?? 0})</span>
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <p className="desk-eyebrow">Pending by agent</p>
          {agentRows.length === 0 ? (
            <p className="text-[13px] text-soft">No open deals yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {agentRows.map(([agent, amount]) => (
                <div key={agent} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate text-ink">{agent}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {formatIndianShort(amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {isList ? (
        <div className="flex flex-col gap-4">
          <ListFilters
            filters={filters}
            agents={agents}
            shown={listRows.length}
            total={rows.length}
          />
          <ListView rows={listRows} filtered={listRows.length !== rows.length} />
        </div>
      ) : (
        <BoardView rows={rows} />
      )}
    </div>
  );
}
