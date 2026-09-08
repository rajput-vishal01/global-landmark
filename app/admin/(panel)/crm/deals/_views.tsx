import Link from "next/link";
import { DealStageQuickForm } from "@/components/admin/DealStageQuickForm";
import { formatIndianShort } from "@/lib/attributes";
import { formatDate } from "@/lib/dates";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";

/**
 * The two ways to read the pipeline. Split out of page.tsx because that file
 * already carries the loader and every derived figure, and a board plus a
 * table in the same file put it past 300 lines of mostly markup.
 */

export type Row = {
  deal: {
    id: number;
    stage: string;
    dealValue: number | null;
    assignedTo: string | null;
    updatedAt: Date | string | null;
    client: { id: number; name: string } | null;
    property: { id: number; title: string; refCode: string | null } | null;
  };
  amount: number | null;
  pending: number | null;
};

/** "Imperial Residency · GL-ZKP-26-0003", or a plain note when nothing is linked. */
function propertyLabel(property: Row["deal"]["property"]): string {
  if (!property) return "No property linked";
  return property.refCode ? `${property.title} · ${property.refCode}` : property.title;
}

export function BoardView({ rows }: { rows: Row[] }) {
  const columns = DEAL_STAGES.map((stage) => ({
    stage,
    deals: rows.filter((r) => r.deal.stage === stage),
  }));

  return (
    // min-w on the columns keeps them readable while the board scrolls on a
    // laptop; xl:min-w-0 lets all eight share the full width on a desktop
    // instead of forcing a scrollbar the page is wide enough not to need.
    <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {columns.map(({ stage, deals }) => (
        <div key={stage} className="flex min-w-[220px] flex-col gap-3 xl:min-w-0">
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
                    {propertyLabel(deal.property)}
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
  );
}

const TH =
  "whitespace-nowrap px-3 py-2 text-left text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";
const TD = "px-3 py-3 align-top font-sans text-meta text-ink";

export function ListView({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="font-sans text-meta text-ink-muted">No deals yet.</p>;
  }

  // Stage order, not update order: the table is the same pipeline read
  // top-to-bottom, so a deal keeps its place relative to the board.
  // indexOf on the readonly tuple rejects a plain string, and a row whose
  // stage is somehow off-list sorts last rather than to the top on -1.
  const rank = (stage: string) => {
    const i = (DEAL_STAGES as readonly string[]).indexOf(stage);
    return i === -1 ? DEAL_STAGES.length : i;
  };
  const ordered = [...rows].sort((a, b) => rank(a.deal.stage) - rank(b.deal.stage));

  return (
    <div className="overflow-x-auto border border-border bg-white">
      <table className="w-full border-collapse">
        <thead className="border-b border-border">
          <tr>
            <th scope="col" className={TH}>Client</th>
            <th scope="col" className={TH}>Property</th>
            <th scope="col" className={TH}>Stage</th>
            <th scope="col" className={`${TH} text-right`}>Value</th>
            <th scope="col" className={`${TH} text-right`}>Brokerage</th>
            <th scope="col" className={`${TH} text-right`}>Pending</th>
            <th scope="col" className={TH}>Agent</th>
            <th scope="col" className={TH}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map(({ deal, amount, pending }) => (
            <tr key={deal.id} className="border-b border-border last:border-b-0">
              <td className={TD}>
                <Link
                  href={`/admin/crm/deals/${deal.id}`}
                  className="font-medium text-ink underline decoration-transparent underline-offset-4 hover:decoration-gold"
                >
                  {deal.client?.name ?? "Unknown client"}
                </Link>
              </td>
              <td className={`${TD} text-ink-muted`}>{propertyLabel(deal.property)}</td>
              <td className={`${TD} min-w-[220px]`}>
                <DealStageQuickForm id={deal.id} stage={deal.stage} />
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                {deal.dealValue != null ? formatIndianShort(deal.dealValue) : "—"}
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-ink-muted`}>
                {amount != null ? formatIndianShort(amount) : "—"}
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums text-gold-deep`}>
                {pending != null ? formatIndianShort(pending) : "—"}
              </td>
              <td className={`${TD} whitespace-nowrap text-ink-muted`}>
                {deal.assignedTo?.trim() || "Unassigned"}
              </td>
              <td className={`${TD} whitespace-nowrap text-ink-muted`}>
                {formatDate(deal.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
