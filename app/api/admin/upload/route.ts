import { requireAdmin } from "@/lib/admin/session";
import { storeFile } from "@/lib/storage";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

/**
 * Admin image upload. Files come through this server — never
 * browser-direct to a third party — are validated here, and are stored in
 * Postgres by lib/storage.ts.
 *
 * Next 16 route handlers parse multipart natively via request.formData(),
 * so there is no need for multer or any other body-parser middleware:
 * multer expects Node req/res streams, which this runtime does not use.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authenticated, but still bounded: a stuck retry loop in the uploader
  // should not be able to fill the database.
  if (isRateLimited("upload", clientIp(request.headers), 200, 1000)) {
    return Response.json(
      { error: "Too many uploads in a short time. Wait a moment and retry." },
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

  const result = await storeFile(file, "image");
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result.file, { status: 201 });
}
