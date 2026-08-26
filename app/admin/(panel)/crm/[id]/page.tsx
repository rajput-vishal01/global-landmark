import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmClients } from "@/lib/db/schema";
import { ClientForm } from "@/components/admin/ClientForm";
import { FIELD, LABEL } from "@/components/form-classes";
import { formatIndianShort } from "@/lib/attributes";
import { brokerageAmount, brokeragePending, isClosedStage } from "@/lib/taxonomy/brokerage";
import { ACTIVITY_KINDS } from "@/lib/taxonomy/activities";
import { addActivity, updateClient } from "../client-actions";

export const metadata = { title: "Client" };

async function loadClient(id: number) {
  return db.query.crmClients.findFirst({
    where: eq(crmClients.id, id),
    with: {
      deals: {
        with: {
          property: { columns: { id: true, title: true, refCode: true } },
          payments: true,
        },
        orderBy: (deals, { desc }) => [desc(deals.updatedAt)],
      },
      activities: {
        orderBy: (activities, { desc }) => [desc(activities.occurredAt)],
      },
    },
  });
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateOnly(value: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StageBadge({ stage }: { stage: string }) {
  const tone = isClosedStage(stage)
    ? stage === "Closed"
      ? "border-gold text-gold-deep"
      : "border-ink/25 text-ink-muted"
    : "border-ink/25 text-ink";
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] ${tone}`}
    >
      {stage}
    </span>
  );
}

/**
 * The client "everything on one screen" detail page (R-30) — same philosophy
 * as the project pitch view: profile facts (here, always-editable via
 * ClientForm), the deal list (read-only from this side; the deal-pipeline
 * engineer owns stage changes at /admin/crm/deals/[id]), and the activity
 * timeline with its inline add form.
 */
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const client = await loadClient(numericId);
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">{client.name}</h1>
          {client.convertedFromLeadId && (
            <p className="mt-1 text-meta font-sans text-ink-muted">
              Converted from website lead #{client.convertedFromLeadId}
            </p>
          )}
        </div>
        <Link
          href={`/admin/crm/deals/new?clientId=${client.id}`}
          className="border border-border px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold hover:text-gold-deep"
        >
          Add deal
        </Link>
      </div>

      {/* Profile — always editable, not a read-only dump. */}
      <ClientForm client={client} action={updateClient} />

      {/* Deals. */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-h3 text-ink">Deals</h2>
        {client.deals.length === 0 ? (
          <p className="text-meta font-sans text-ink-muted">
            No deals yet.{" "}
            <Link
              href={`/admin/crm/deals/new?clientId=${client.id}`}
              className="underline decoration-border underline-offset-4 hover:decoration-gold"
            >
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto border border-border bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border">
                  {["Property", "Stage", "Deal value", "Brokerage pending", ""].map((h) => (
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
                {client.deals.map((deal) => {
                  const totalBrokerage = brokerageAmount(
                    deal.dealValue,
                    deal.brokeragePercent,
                    deal.brokerageAmountOverride
                  );
                  const pending = brokeragePending(totalBrokerage, deal.payments);
                  return (
                    <tr key={deal.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-sans text-body text-ink">
                        {deal.property
                          ? `${deal.property.title}${deal.property.refCode ? ` (${deal.property.refCode})` : ""}`
                          : "No property linked"}
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={deal.stage} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink">
                        {deal.dealValue != null ? formatIndianShort(deal.dealValue) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink">
                        {pending != null ? formatIndianShort(pending) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/crm/deals/${deal.id}`}
                          className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Activity timeline. */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-h3 text-ink">Activity</h2>

        <form
          action={addActivity}
          className="flex flex-col gap-4 border border-border bg-white p-5 sm:flex-row sm:items-end sm:flex-wrap"
        >
          <input type="hidden" name="clientId" value={client.id} />
          <div className="flex w-40 flex-col gap-1.5">
            <label htmlFor="kind" className={LABEL}>
              Kind
            </label>
            <select id="kind" name="kind" required className={FIELD}>
              {ACTIVITY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <label htmlFor="note" className={LABEL}>
              Note
            </label>
            <textarea id="note" name="note" rows={1} maxLength={4000} className={FIELD} />
          </div>
          <div className="flex w-40 flex-col gap-1.5">
            <label htmlFor="author" className={LABEL}>
              Author
            </label>
            <input id="author" name="author" type="text" maxLength={200} className={FIELD} />
          </div>
          {/* Blank = right now, so logging a call as it ends stays one click.
              Set it to record a call that already happened on an earlier day. */}
          <div className="flex w-52 flex-col gap-1.5">
            <label htmlFor="occurredAt" className={LABEL}>
              Happened on
            </label>
            <input
              id="occurredAt"
              name="occurredAt"
              type="datetime-local"
              className={FIELD}
            />
          </div>
          <div className="flex w-44 flex-col gap-1.5">
            <label htmlFor="followUpAt" className={LABEL}>
              Follow up on
            </label>
            <input id="followUpAt" name="followUpAt" type="date" className={FIELD} />
          </div>
          <button
            type="submit"
            className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
          >
            Log activity
          </button>
        </form>

        {client.activities.length === 0 ? (
          <p className="text-meta font-sans text-ink-muted">No activity logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {client.activities.map((a) => (
              <li key={a.id} className="border border-border bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink">
                    {a.kind}
                  </span>
                  <span className="text-meta font-sans tabular-nums text-ink-muted">
                    {formatDateTime(a.occurredAt)}
                    {a.author ? ` · ${a.author}` : ""}
                  </span>
                </div>
                {a.note && <p className="mt-2 text-body font-sans text-ink">{a.note}</p>}
                {a.followUpAt && (
                  <p
                    className={`mt-2 inline-flex border px-2.5 py-1 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] ${
                      new Date(a.followUpAt) < new Date()
                        ? "border-error/40 text-error"
                        : "border-gold text-gold-deep"
                    }`}
                  >
                    Follow up · {formatDateOnly(a.followUpAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
