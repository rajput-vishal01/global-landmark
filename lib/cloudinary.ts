import { v2 as cloudinary } from "cloudinary";

/**
 * Server-only Cloudinary access. When env is missing the admin falls back to
 * paste-image-URL mode and deletes skip the remote call — the site keeps
 * working without an account.
 */

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configured() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

const UPLOAD_FOLDER = "global-landmark/properties";

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/** Signed params for a direct browser → Cloudinary upload. */
export function signUpload(): UploadSignature {
  const c = configured();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = c.utils.api_sign_request(
    { timestamp, folder: UPLOAD_FOLDER },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    folder: UPLOAD_FOLDER,
    signature,
  };
}

/**
 * Deletes assets by public id. Throws on API failure so callers abort the
 * DB delete — a failed remote delete must never leave orphaned images.
 * Ids from URL-paste/seed rows are null and are filtered out by callers.
 */
export async function deleteCloudinaryImages(
  publicIds: string[]
): Promise<void> {
  if (!publicIds.length) return;
  if (!isCloudinaryConfigured()) return; // nothing hosted remotely to delete
  const c = configured();
  // delete_resources caps at 100 ids per call
  for (let i = 0; i < publicIds.length; i += 100) {
    await c.api.delete_resources(publicIds.slice(i, i + 100));
  }
}
