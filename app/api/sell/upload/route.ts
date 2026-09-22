import { storeFile } from "@/lib/storage";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

/**
 * Photo upload for the public "list your property" form.
 *
 * A SEPARATE route from /api/admin/upload, deliberately, rather than opening
 * that one up. This is the only unauthenticated write-to-disk endpoint in the
 * app, and the difference between the two is the whole point:
 *
 *  - `kind` is not read from the request. The admin route lets a caller pick
 *    "document", which writes to the private bucket that legal papers live in;
 *    here it is hardcoded to "image" so a seller cannot reach that bucket at
 *    all, whatever they post.
 *  - The rate limit is per connection AND global. `clientIp` is spoofable —
 *    the global cap is the part a spoofed header cannot walk around.
 *
 * What it does NOT need to guard, because lib/storage.ts already does:
 * MIME type (a fixed allowlist, extension derived from it and never from the
 * client), a 20MB ceiling, and a filename that is the SHA-256 of the bytes —
 * so nothing user-supplied reaches the path, and the same photo uploaded
 * twice overwrites itself instead of filling the disk.
 */
export async function POST(request: Request) {
  // 40 per connection is roughly four full submissions' worth of photos; the
  // form itself only allows five submissions a day from one connection.
  if (isRateLimited("sell-upload", clientIp(request.headers), 40, 400)) {
    return Response.json(
      { error: "Too many uploads from this connection. Try again later." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Malformed upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file received." }, { status: 400 });
  }

  // "image", always. See the note above.
  const result = await storeFile(file, "image");
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result.file, { status: 201 });
}
