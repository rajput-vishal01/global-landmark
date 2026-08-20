import { readBlob } from "@/lib/storage";

/**
 * Serves an uploaded property image.
 *
 * Public by design, but it refuses to hand back a blob marked private —
 * legal documents share the same store and must only ever come out of the
 * admin-gated route, even for someone who has guessed a key.
 *
 * The key is the SHA-256 of the bytes, so a key can never point at
 * different content and the response is safe to cache immutably.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  // Reject anything that is not a hash before it reaches the database.
  if (!/^[a-f0-9]{64}$/.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  let blob;
  try {
    blob = await readBlob(key);
  } catch (err) {
    console.error("image route: read failed:", err);
    return new Response("Unavailable", { status: 503 });
  }

  // Same 404 for missing and for private: a different status would confirm
  // that a given document key exists.
  if (!blob || blob.isPrivate) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(blob.data), {
    headers: {
      "Content-Type": blob.mimeType,
      "Content-Length": String(blob.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${key}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
