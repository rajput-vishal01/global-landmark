import { openStoredFile } from "@/lib/storage";

/**
 * Serves an uploaded property image from the public upload directory.
 *
 * It can only ever resolve paths under $UPLOAD_DIR/public — legal documents
 * live under private/ and are unreachable from here by construction, not by
 * a flag this route has to remember to check.
 *
 * The filename is the SHA-256 of the bytes, so a key can never point at
 * different content and the response is safe to cache immutably.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const file = await openStoredFile(key, "public");

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.stream, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${key}"`,
      // The type comes from our own extension map, but say so anyway: this
      // route serves admin-uploaded bytes.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
