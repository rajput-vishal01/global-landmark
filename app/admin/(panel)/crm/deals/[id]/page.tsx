import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmDeals } from "@/lib/db/schema";
import { DealEditForm } from "@/components/admin/DealEditForm";
import { PaymentForm } from "@/components/admin/PaymentForm";
import { formatRupees } from "@/lib/attributes";
import { brokerageAmount, brokeragePending, bpToPercent } from "@/lib/taxonomy/brokerage";
import { formatDate } from "@/lib/dates";

export const metadata = { title: "Deal" };

async function loadDeal(id: number) {
  return db.query.crmDeals.findFirst({
    where: eq(crmDeals.id, id),
    with: {
      client: { columns: { id: true, name: true, phone: true } },
      property: { columns: { id: true, title: true, refCode: true } },
      payments: { orderBy: (p, { desc }) => [desc(p.paidAt)] },
      activities: { orderBy: (a, { desc }) => [desc(a.occurredAt)] },
    },
  });
}


const STAT = "flex flex-col gap-1 border border-border bg-white p-5";
const STAT_LABEL = "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";
const STAT_VALUE = "font-serif text-h3 text-ink";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const deal = await loadDeal(numericId);
  if (!deal) notFound();

  const totalAmount = brokerageAmount(deal.dealValue, deal.brokeragePercent, deal.brokerageAmountOverride);
  const pending = brokeragePending(totalAmount, deal.payments);
  const paidSoFar =
    totalAmount != null && pending != null ? totalAmount - pending : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">
            {deal.client ? (
              <Link
                href={`/admin/crm/${deal.client.id}`}
                className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
              >
                {deal.client.name}
              </Link>
            ) : (
              "Deal"
            )}
          </h1>
          <p className="mt-1 font-sans text-body text-ink-muted">
            {deal.property
              ? `${deal.property.title}${deal.property.refCode ? ` · ${deal.property.refCode}` : ""}`
              : "No property linked"}
          </p>
        </div>
        <Link
          href="/admin/crm/deals"
          className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted underline decoration-border underline-offset-4 hover:decoration-gold"
        >
          ← Pipeline
        </Link>
      </div>

      {/* Prominent computed figures — R-31's whole point: pending is never
          stored, always recomputed from amount minus every payment row. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={STAT}>
          <span className={STAT_LABEL}>Brokerage amount</span>
          <span className={STAT_VALUE}>
            {totalAmount != null ? formatRupees(totalAmount) : "—"}
          </span>
          {deal.brokeragePercent != null && deal.brokerageAmountOverride == null && (
            <span className="font-sans text-meta text-ink-muted">
              {bpToPercent(deal.brokeragePercent)}% of deal value
            </span>
          )}
          {deal.brokerageAmountOverride != null && (
            <span className="font-sans text-meta text-ink-muted">Manual override</span>
          )}
        </div>
        <div className={STAT}>
          <span className={STAT_LABEL}>Received so far</span>
          <span className={STAT_VALUE}>{paidSoFar != null ? formatRupees(paidSoFar) : "—"}</span>
          <span className="font-sans text-meta text-ink-muted">
            {deal.payments.length} payment{deal.payments.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className={STAT}>
          <span className={STAT_LABEL}>Pending</span>
          <span className={`${STAT_VALUE} ${pending && pending > 0 ? "text-gold-deep" : ""}`}>
            {pending != null ? formatRupees(pending) : "—"}
          </span>
        </div>
      </div>

      <DealEditForm
        deal={{
          id: deal.id,
          stage: deal.stage,
          dealValue: deal.dealValue,
          brokeragePercent:
            deal.brokeragePercent != null ? String(bpToPercent(deal.brokeragePercent)) : "",
          brokerageAmountOverride: deal.brokerageAmountOverride,
          sharedWithName: deal.sharedWithName,
          sharedAmount: deal.sharedAmount,
          assignedTo: deal.assignedTo,
        }}
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-h4 text-ink">Payments</h2>
        {deal.payments.length === 0 ? (
          <p className="font-sans text-body text-ink-muted">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Amount", "Mode", "Note"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deal.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink">
                      {formatRupees(p.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink-muted">
                      {p.mode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-meta font-sans text-ink-muted">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaymentForm dealId={deal.id} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-h4 text-ink">Activity</h2>
        {deal.activities.length === 0 ? (
          <p className="font-sans text-body text-ink-muted">No activity logged for this deal yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deal.activities.map((a) => (
              <li key={a.id} className="border border-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink">
                    {a.kind}
                  </span>
                  <span className="font-sans text-meta text-ink-muted">
                    {formatDate(a.occurredAt)}
                    {a.author ? ` · ${a.author}` : ""}
                  </span>
                </div>
                {a.note && <p className="mt-2 font-sans text-body text-ink">{a.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
