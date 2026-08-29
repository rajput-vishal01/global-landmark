import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { propertyDocuments } from "@/lib/db/schema";
import { openStoredFile } from "@/lib/storage";

/**
 * Streams a document the admin has explicitly PUBLISHED — a brochure.
 *
 * Deliberately a separate route from /api/admin/documents/[key], which is
 * auth-gated and stays that way. This one is anonymous, so it carries two
 * independent gates and needs both to pass:
 *
 *   1. `isPublic = true` is in the WHERE clause, not a check on a row that
 *      was already fetched. A registry paper, a sale deed or an owner's KYC
 *      scan simply does not come back from this query, so there is no row to
 *      forget to inspect. The flag defaults to false and is never inferred
 *      from `docType` — a doc type is a label someone typed, not consent.
 *   2. The bytes are read from the PUBLIC bucket only. A document that has
 *      never been published has no file there at all, so even a leaked
 *      storage key resolves to nothing.
 *
 * 404 for every failure — unauthorised, unpublished, missing — for the same
 * reason the admin route does it: a different response per cause would tell
 * an anonymous caller which keys name real documents.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const [row] = await db
    .select({
      fileName: propertyDocuments.fileName,
      mimeType: propertyDocuments.mimeType,
    })
    .from(propertyDocuments)
    .where(
      and(eq(propertyDocuments.storageKey, key), eq(propertyDocuments.isPublic, true))
    );

  if (!row) return new Response("Not found", { status: 404 });

  const file = await openStoredFile(key, "public");
  if (!file) return new Response("Not found", { status: 404 });

  // Same header sanitisation as the admin route — the filename is admin
  // input, and a quote or newline in it could break out of the value.
  const safeName = row.fileName.replace(/[^\w.\- ]/g, "_").slice(0, 200) || "document";

  return new Response(file.stream, {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      // The key is a content hash, so it can never point at different bytes
      // — but keep it short-lived anyway: unpublishing must actually take
      // effect, and a year-long immutable cache would outlive the decision.
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
