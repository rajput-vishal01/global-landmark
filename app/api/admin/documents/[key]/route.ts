import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { propertyDocuments } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { openStoredFile } from "@/lib/storage";

/**
 * Streams a legal document to an authenticated admin. R-29.
 *
 * IMPORTANT: `proxy.ts` matches only `/admin/:path*` — it does NOT cover
 * `/api/admin/*`. This route's own `requireAdmin()` call is the only gate
 * on it. Do not assume the proxy protects this path.
 *
 * Returns 404, never 401 and never a redirect, for BOTH an unauthenticated
 * request and a missing document. A redirect to the login page would
 * confirm to an anonymous caller that the document exists; a 401 would
 * confirm it for a caller who is logged in but guessing keys. The same 404
 * for every failure mode means the route reveals nothing either way.
 *
 * The row is looked up in `property_documents` by storage key before the
 * bytes are ever touched — serving only a key that has a known row means a
 * leaked key alone is not sufficient, and it is where the filename for the
 * download comes from, sanitised, never taken from the request.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const { key } = await params;

  const [row] = await db
    .select({
      fileName: propertyDocuments.fileName,
      mimeType: propertyDocuments.mimeType,
    })
    .from(propertyDocuments)
    .where(eq(propertyDocuments.storageKey, key));

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const file = await openStoredFile(key, "private");
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  // A filename with a quote or newline could break out of the header value;
  // strip anything that is not a plain ASCII filename character.
  const safeName = row.fileName.replace(/[^\w.\- ]/g, "_").slice(0, 200) || "document";

  return new Response(file.stream, {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      // Never cached, never indexed — this is not public content that
      // happens to be gated, it must not be discoverable at all.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
