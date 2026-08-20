import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmDeals } from "@/lib/db/schema";
import { DealStageQuickForm } from "@/components/admin/DealStageQuickForm";
import { formatIndianShort } from "@/lib/attributes";
import { DEAL_STAGES, brokerageAmount, brokeragePending } from "@/lib/taxonomy/brokerage";

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

export default async function DealsPipelinePage() {
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

  const columns = DEAL_STAGES.map((stage) => ({
    stage,
    deals: rows.filter((r) => r.deal.stage === stage),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-h2 text-ink">Deal pipeline</h1>
        <Link
          href="/admin/crm/deals/new"
          className="bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          New deal
        </Link>
      </div>

      {/* R-31 summary view: total pending, this month's closed value,
          per-stage counts, per-agent split. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 border border-border bg-white p-5">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
            Brokerage pending
          </span>
          <span className="font-serif text-h3 text-gold-deep">{formatIndianShort(totalPending)}</span>
          <span className="font-sans text-meta text-ink-muted">Across open deals</span>
        </div>
        <div className="flex flex-col gap-1 border border-border bg-white p-5">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
            Closed this month
          </span>
          <span className="font-serif text-h3 text-ink">{formatIndianShort(closedValueThisMonth)}</span>
          <span className="font-sans text-meta text-ink-muted">
            {closedThisMonth.length} deal{closedThisMonth.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-col gap-2 border border-border bg-white p-5 sm:col-span-2 lg:col-span-1">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
            Per stage
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {DEAL_STAGES.map((s) => (
              <span key={s} className="font-sans text-meta text-ink">
                {s} <span className="tabular-nums text-ink-muted">({stageCounts.get(s) ?? 0})</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-border bg-white p-5 sm:col-span-2 lg:col-span-1">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
            Pending by agent
          </span>
          {agentRows.length === 0 ? (
            <span className="font-sans text-meta text-ink-muted">No open deals yet.</span>
          ) : (
            <div className="flex flex-col gap-1">
              {agentRows.map(([agent, amount]) => (
                <div key={agent} className="flex items-center justify-between gap-3">
                  <span className="truncate font-sans text-meta text-ink">{agent}</span>
                  <span className="shrink-0 font-sans text-meta tabular-nums text-ink-muted">
                    {formatIndianShort(amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The board itself: one column per stage, cards stacked under each.
          A simpler, non-drag-and-drop pipeline — the per-card Select below
          is how a deal moves stage. */}
      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {columns.map(({ stage, deals }) => (
          <div key={stage} className="flex min-w-[240px] flex-col gap-3">
            <h2 className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink">
              {stage} <span className="tabular-nums text-ink-muted">({deals.length})</span>
            </h2>
            <div className="flex flex-col gap-3">
              {deals.length === 0 ? (
                <p className="font-sans text-meta text-ink-muted">No deals.</p>
              ) : (
                deals.map(({ deal, amount, pending }) => (
                  <div key={deal.id} className="flex flex-col gap-2 border border-border bg-white p-4">
                    <Link
                      href={`/admin/crm/deals/${deal.id}`}
                      className="font-sans text-body font-medium text-ink underline decoration-transparent underline-offset-4 hover:decoration-gold"
                    >
                      {deal.client?.name ?? "Unknown client"}
                    </Link>
                    <p className="font-sans text-meta text-ink-muted">
                      {deal.property
                        ? deal.property.refCode
                          ? `${deal.property.title} · ${deal.property.refCode}`
                          : deal.property.title
                        : "No property linked"}
                    </p>
                    <div className="flex items-center justify-between gap-3 font-sans text-meta">
                      <span className="text-ink-muted">
                        Value {deal.dealValue != null ? formatIndianShort(deal.dealValue) : "—"}
                      </span>
                      <span className="text-gold-deep">
                        Pending {pending != null ? formatIndianShort(pending) : "—"}
                      </span>
                    </div>
                    {amount != null && (
                      <p className="font-sans text-meta text-ink-muted">
                        Brokerage {formatIndianShort(amount)}
                      </p>
                    )}
                    {deal.assignedTo && (
                      <p className="font-sans text-meta text-ink-muted">{deal.assignedTo}</p>
                    )}
                    <DealStageQuickForm id={deal.id} stage={deal.stage} />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
