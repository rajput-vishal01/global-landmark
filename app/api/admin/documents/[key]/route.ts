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
 * The row is looked up in `property_documents` for the filename, sanitised,
 * never taken from the request. A file uploaded into the form but not yet
 * saved has no row; it is still served (to an admin only, the one gate that
 * matters here) so it can be previewed before the listing is saved.
 *
 * `?inline=1` asks for the file to open in the browser rather than download
 * — the form’s preview. Only formats a browser can actually render are
 * sent inline; Word files always download.
 */
const INLINE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
]);

export async function GET(
  request: Request,
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

  const file = await openStoredFile(key, "private");
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  // A filename with a quote or newline could break out of the header value;
  // strip anything that is not a plain ASCII filename character.
  const mimeType = row?.mimeType ?? file.mimeType;
  const inline =
    new URL(request.url).searchParams.get("inline") === "1" && INLINE_TYPES.has(mimeType);
  const safeName = (row?.fileName ?? key).replace(/[^\w.\- ]/g, "_").slice(0, 200) || "document";

  return new Response(file.stream, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
      // Never cached, never indexed — this is not public content that
      // happens to be gated, it must not be discoverable at all.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
