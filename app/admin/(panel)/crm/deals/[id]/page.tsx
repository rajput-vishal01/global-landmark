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
import {
  Card,
  Chip,
  KpiRow,
  KpiTile,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  numericCell,
} from "@/components/admin/desk";

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

  // The note under "Brokerage amount": how the figure was arrived at, which is
  // the first thing anybody questioning it wants to know.
  const amountNote =
    deal.brokerageAmountOverride != null
      ? "Manual override"
      : deal.brokeragePercent != null
        ? `${bpToPercent(deal.brokeragePercent)}% of deal value`
        : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title={deal.client?.name ?? "Deal"}
        sub={
          deal.property
            ? `${deal.property.title}${deal.property.refCode ? ` · ${deal.property.refCode}` : ""}`
            : "No property linked."
        }
        actions={
          <>
            {deal.client && (
              <Link href={`/admin/crm/${deal.client.id}`} className={deskButton}>
                Open client
              </Link>
            )}
            <Link href="/admin/crm/deals" className={deskButton}>
              Pipeline
            </Link>
          </>
        }
      />

      {/* Prominent computed figures — R-31's whole point: pending is never
          stored, always recomputed from amount minus every payment row. */}
      <KpiRow>
        <KpiTile
          label="Brokerage amount"
          value={totalAmount != null ? formatRupees(totalAmount) : "—"}
          note={amountNote}
        />
        <KpiTile
          label="Received so far"
          value={paidSoFar != null ? formatRupees(paidSoFar) : "—"}
          note={`${deal.payments.length} payment${deal.payments.length === 1 ? "" : "s"}`}
        />
        <KpiTile
          label="Pending"
          value={pending != null ? formatRupees(pending) : "—"}
          highlight={pending != null && pending > 0}
        />
      </KpiRow>

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

      <section>
        <h2 className="desk-eyebrow">Payments</h2>
        <div className="flex flex-col gap-3">
          {deal.payments.length === 0 ? (
            <p className="text-[13px] text-soft">
              Nothing received yet — record the first instalment below and the pending figure
              above follows it.
            </p>
          ) : (
            <TableWrap>
              <Table className="min-w-[480px]">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className={numericCell}>
                      Amount
                    </th>
                    <th scope="col">Mode</th>
                    <th scope="col">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {deal.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap">{formatDate(p.paidAt)}</td>
                      <td className={`${numericCell} whitespace-nowrap`}>
                        {formatRupees(p.amount)}
                      </td>
                      <td className="whitespace-nowrap text-soft">{p.mode ?? "—"}</td>
                      <td className="text-soft">{p.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
          <PaymentForm dealId={deal.id} />
        </div>
      </section>

      <section>
        <h2 className="desk-eyebrow">Activity</h2>
        {deal.activities.length === 0 ? (
          <p className="text-[13px] text-soft">
            Nothing logged against this deal yet — activity is recorded on the client&apos;s page.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {deal.activities.map((a) => (
              <li key={a.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Chip>{a.kind}</Chip>
                    <span className="text-[12px] tabular-nums text-muted">
                      {formatDate(a.occurredAt)}
                      {a.author ? ` · ${a.author}` : ""}
                    </span>
                  </div>
                  {a.note && <p className="mt-2 text-[13px] text-ink">{a.note}</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
