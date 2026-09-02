import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { csvField } from "@/lib/csv";

/**
 * Streams every lead as CSV. R-32.
 *
 * IMPORTANT: same as app/api/admin/documents/[key]/route.ts — `proxy.ts`
 * only matches `/admin/:path*`, not `/api/admin/*`. This route's own
 * `requireAdmin()` call is the only gate, and failure is a 404 (not 401 or a
 * redirect) so the route reveals nothing to an unauthenticated caller.
 *
 * ponytail: exports the whole table, ignoring any list filters — leads is a
 * small table and "export everything, filter in the spreadsheet" is the
 * simpler contract. Add query-param filtering here if the table grows large
 * enough that broker actually wants a scoped export.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      interest: leads.interest,
      status: leads.status,
      assignedTo: leads.assignedTo,
      source: leads.source,
      pageUrl: leads.pageUrl,
      propertyIds: leads.propertyIds,
      message: leads.message,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .orderBy(desc(leads.createdAt));

  const header = [
    "ID",
    "Name",
    "Email",
    "Phone",
    "Interest",
    "Status",
    "Assigned To",
    "Source",
    "Page URL",
    "Property IDs",
    "Message",
    "Created At",
  ];

  const lines = [header.map(csvField).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.name,
        r.email ?? "",
        r.phone ?? "",
        r.interest ?? "",
        r.status,
        r.assignedTo ?? "",
        r.source ?? "",
        r.pageUrl ?? "",
        (r.propertyIds ?? []).join("; "),
        r.message ?? "",
        r.createdAt.toISOString(),
      ]
        .map(csvField)
        .join(",")
    );
  }

  const csv = lines.join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

