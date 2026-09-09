import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { crmClients, properties } from "@/lib/db/schema";
import { NewDealForm } from "@/components/admin/NewDealForm";
import { PageHead } from "@/components/admin/desk";

export const metadata = { title: "New deal" };

/**
 * Both lists are small enough (admin-only, low hundreds of rows) for a plain
 * Select — R-30/31's build note explicitly calls this "fine for now"; a
 * searchable picker is the upgrade trigger once either list gets long.
 */
async function loadPickers() {
  try {
    const [clients, propertyRows] = await Promise.all([
      db.query.crmClients.findMany({
        columns: { id: true, name: true },
        orderBy: [asc(crmClients.name)],
      }),
      db
        .select({ id: properties.id, title: properties.title, refCode: properties.refCode })
        .from(properties)
        .orderBy(asc(properties.title)),
    ]);
    return { clients, properties: propertyRows };
  } catch (err) {
    console.error("loadPickers failed:", err);
    return { clients: [], properties: [] };
  }
}

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const { clients, properties: propertyRows } = await loadPickers();
  const defaultClientId = clientId ? Number(clientId) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="New deal"
        sub="Starts at Enquiry. Deal value and brokerage can be filled in later."
      />
      <NewDealForm
        clients={clients}
        properties={propertyRows}
        defaultClientId={
          defaultClientId && Number.isInteger(defaultClientId) ? defaultClientId : undefined
        }
      />
    </div>
  );
}
