import Link from "next/link";
import { DealStageQuickForm } from "@/components/admin/DealStageQuickForm";
import { Select } from "@/components/ui/Select";
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

export function ListView({ rows, filtered }: { rows: Row[]; filtered?: boolean }) {
  if (rows.length === 0) {
    // Two different situations that must not read the same: an empty pipeline
    // is a prompt to add a deal, an empty filter is a prompt to widen it.
    return (
      <p className="font-sans text-meta text-ink-muted">
        {filtered ? "No deals match these filters." : "No deals yet."}
      </p>
    );
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

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export type DealFilters = {
  stage: string;
  agent: string;
  q: string;
  openOnly: boolean;
};

/** Stages that mean the deal is no longer in play. */
const SETTLED: readonly string[] = ["Closed", "Lost"];

/** The agent label used everywhere — a blank assignee is one bucket, not many. */
export function agentLabel(assignedTo: string | null): string {
  return assignedTo?.trim() || "Unassigned";
}

export function readFilters(sp: Record<string, string | undefined>): DealFilters {
  return {
    stage: sp.stage ?? "",
    agent: sp.agent ?? "",
    q: sp.q ?? "",
    openOnly: sp.open === "1",
  };
}

export function filterRows(rows: Row[], f: DealFilters): Row[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter(({ deal }) => {
    if (f.stage && deal.stage !== f.stage) return false;
    if (f.agent && agentLabel(deal.assignedTo) !== f.agent) return false;
    if (f.openOnly && SETTLED.includes(deal.stage)) return false;
    if (q) {
      // Ref code included on purpose: it is what a broker reads off a
      // WhatsApp message, and searching it is faster than scanning titles.
      const haystack = [
        deal.client?.name,
        deal.property?.title,
        deal.property?.refCode,
        deal.assignedTo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

const FIELD_LABEL =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";

/**
 * A plain GET form. The filters end up in the URL, which means the back
 * button works, a filtered pipeline can be sent to someone, and the view
 * survives the reload that a stage change triggers — none of which a
 * client-side filter would give for free.
 */
export function ListFilters({
  filters,
  agents,
  shown,
  total,
}: {
  filters: DealFilters;
  agents: string[];
  shown: number;
  total: number;
}) {
  const stageOptions = [
    { value: "", label: "All stages" },
    ...DEAL_STAGES.map((s) => ({ value: s, label: s })),
  ];
  const agentOptions = [
    { value: "", label: "All agents" },
    ...agents.map((a) => ({ value: a, label: a })),
  ];
  const isFiltered =
    Boolean(filters.stage || filters.agent || filters.q.trim()) || filters.openOnly;

  return (
    <form method="get" className="flex flex-col gap-4 border border-border bg-white p-5">
      <input type="hidden" name="view" value="list" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Search</span>
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Client, property or ref code"
            className="border-b border-border bg-transparent py-2 font-sans text-meta text-ink focus:border-gold focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Stage</span>
          <Select name="stage" options={stageOptions} defaultValue={filters.stage} aria-label="Filter by stage" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Agent</span>
          <Select name="agent" options={agentOptions} defaultValue={filters.agent} aria-label="Filter by agent" />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex cursor-pointer items-center gap-2 font-sans text-meta text-ink">
            <input
              type="checkbox"
              name="open"
              value="1"
              defaultChecked={filters.openOnly}
              className="size-4 accent-ink"
            />
            Open deals only
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="cursor-pointer bg-ink px-5 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-cream transition-opacity hover:opacity-90"
            >
              Apply
            </button>
            {isFiltered && (
              <Link
                href="/admin/crm/deals?view=list"
                className="px-3 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-ink hover:decoration-gold"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="font-sans text-meta text-ink-muted" aria-live="polite">
        {isFiltered
          ? `Showing ${shown} of ${total} deal${total === 1 ? "" : "s"}.`
          : `${total} deal${total === 1 ? "" : "s"}.`}
      </p>
    </form>
  );
}
