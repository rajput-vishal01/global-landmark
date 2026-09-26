import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmClients } from "@/lib/db/schema";
import { ClientForm } from "@/components/admin/ClientForm";
import { formatIndianShort } from "@/lib/attributes";
import { brokerageAmount, brokeragePending } from "@/lib/taxonomy/brokerage";
import { updateClient } from "../client-actions";
import { ActivityForm } from "./ActivityForm";
import { formatDate, formatDateTime } from "@/lib/dates";
import {
  Card,
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskRowLink,
  numericCell,
  type ChipTone,
} from "@/components/admin/desk";

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



/**
 * Stage read as a step along the gold ramp: the early stages are quiet, the
 * paperwork stages are marked, a closed deal is ink, and only a lost one is
 * an error state.
 */
const STAGE_TONES: Record<string, ChipTone> = {
  Enquiry: "neutral",
  "Site Visit": "neutral",
  Negotiation: "quiet",
  Token: "quiet",
  Agreement: "live",
  Registry: "live",
  Closed: "strong",
  Lost: "alert",
};


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
    <div className="flex flex-col gap-6">
      <PageHead
        title={client.name}
        sub={
          client.convertedFromLeadId
            ? `Converted from website lead #${client.convertedFromLeadId}.`
            : "Profile, deals and everything logged against this client."
        }
        actions={
          <Link href={`/admin/crm/deals/new?clientId=${client.id}`} className={deskButton}>
            Add deal
          </Link>
        }
      />

      {/* Profile — always editable, not a read-only dump. */}
      <ClientForm client={client} action={updateClient} />

      {/* Deals. */}
      <section>
        <h2 className="desk-eyebrow">Deals</h2>
        {client.deals.length === 0 ? (
          <EmptyState
            title="No deals yet"
            note="A deal tracks one property through the pipeline, with its brokerage and payments against it."
            action={
              <Link href={`/admin/crm/deals/new?clientId=${client.id}`} className={deskButton}>
                Add the first deal
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <Table className="min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col">Property</th>
                  <th scope="col">Stage</th>
                  <th scope="col" className={numericCell}>
                    Deal value
                  </th>
                  <th scope="col" className={numericCell}>
                    Brokerage pending
                  </th>
                  <th scope="col" />
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
                    <tr key={deal.id}>
                      <td>
                        {deal.property
                          ? `${deal.property.title}${deal.property.refCode ? ` (${deal.property.refCode})` : ""}`
                          : "No property linked"}
                      </td>
                      <td>
                        <Chip tone={STAGE_TONES[deal.stage] ?? "neutral"}>{deal.stage}</Chip>
                      </td>
                      <td className={`${numericCell} whitespace-nowrap`}>
                        {deal.dealValue != null ? formatIndianShort(deal.dealValue) : "—"}
                      </td>
                      <td className={`${numericCell} whitespace-nowrap`}>
                        {pending != null ? formatIndianShort(pending) : "—"}
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/crm/deals/${deal.id}`} className={deskRowLink}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>

      {/* Activity timeline. */}
      <section>
        <h2 className="desk-eyebrow">Activity</h2>

        <div className="flex flex-col gap-3">
          <ActivityForm clientId={client.id} />

          {client.activities.length === 0 ? (
            <p className="text-[13px] text-soft">
              Nothing logged yet — the form above records a call, a site visit or a note.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {client.activities.map((a) => (
                <li key={a.id}>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Chip>{a.kind}</Chip>
                      <span className="text-[12px] tabular-nums text-muted">
                        {formatDateTime(a.occurredAt)}
                        {a.author ? ` · ${a.author}` : ""}
                      </span>
                    </div>
                    {a.note && <p className="mt-2 text-[13px] text-ink">{a.note}</p>}
                    {a.followUpAt && (
                      <p className="mt-2">
                        <Chip tone={new Date(a.followUpAt) < new Date() ? "alert" : "live"}>
                          Follow up · {formatDate(a.followUpAt)}
                        </Chip>
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
