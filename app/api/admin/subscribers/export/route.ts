import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";

/**
 * Streams the newsletter list as CSV — same contract as the leads export.
 *
 * IMPORTANT: `proxy.ts` only matches `/admin/:path*`, not `/api/admin/*`.
 * This route's own `requireAdmin()` call is the only gate, and failure is a
 * 404 (not 401 or a redirect) so an unauthenticated caller learns nothing
 * about whether the endpoint exists.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt));

  const lines = [
    ["ID", "Email", "Source", "Subscribed At", "Unsubscribed At"]
      .map(csvField)
      .join(","),
  ];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.email,
        r.source ?? "",
        r.createdAt.toISOString(),
        r.unsubscribedAt?.toISOString() ?? "",
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
      "Content-Disposition": `attachment; filename="subscribers-${date}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/** RFC 4180: quote a field if it carries a comma, quote, or newline; double
 * any quote inside. */
function csvField(value: unknown): string {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
