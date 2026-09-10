"use client";

import { useState } from "react";
import { MAX_SELL_PHOTOS } from "@/lib/sell-photos";

/** Kept in step with IMAGE_MIME_TYPES / MAX_UPLOAD_BYTES in lib/storage.ts. */
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 8;

/**
 * Photo picker for the public seller form.
 *
 * A separate component from the admin ImageUploader rather than a shared one.
 * The admin gallery editor carries alt-text fields, reordering, a cover
 * marker and a paste-a-URL escape hatch — none of which a seller submitting
 * their own house needs, and the URL field in particular is something not to
 * hand an anonymous visitor. What is shared is the part that matters: both
 * post to a route that runs the same validation in lib/storage.ts.
 *
 * Emits the list as a hidden `photosJson` field, the same shape the admin
 * form uses, so the server parses one format.
 */
export function SellPhotoUpload() {
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    // Read the remaining allowance once. setUrls is async, so counting inside
    // the loop would keep seeing the pre-upload length and let a multi-file
    // selection walk past the cap.
    let slots = MAX_SELL_PHOTOS - urls.length;
    if (slots <= 0) {
      setError(`That is the ${MAX_SELL_PHOTOS}-photo limit. Remove one to add another.`);
      return;
    }

    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (slots <= 0) {
          setError(`Only the first ${MAX_SELL_PHOTOS} photos were kept.`);
          break;
        }
        // Checked here for a fast, specific message; the server enforces the
        // same limit regardless of what this component sends.
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(
            `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_MB} MB.`
          );
          continue;
        }

        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/sell/upload", { method: "POST", body });
        const data = (await res.json()) as { url?: string; error?: string };

        if (!res.ok || !data.url) {
          setError(data.error ?? `Upload failed (${res.status}).`);
          continue;
        }
        slots--;
        // Same bytes give the same URL, so a re-pick is skipped rather than
        // shown twice.
        setUrls((prev) => (prev.includes(data.url!) ? prev : [...prev, data.url!]));
      }
    } catch (err) {
      console.error("Sell photo upload failed:", err);
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="photosJson" value={JSON.stringify(urls)} />

      {urls.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, i) => (
            <li key={url} className="group relative aspect-4/3 overflow-hidden bg-ink/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- same-origin upload, no optimisation needed for a 96px thumbnail */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 flex h-7 w-7 cursor-pointer items-center justify-center bg-dark-deep/70 text-cream opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-3 border border-border bg-white px-5 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold">
        {busy ? "Uploading…" : `Add photos (${urls.length}/${MAX_SELL_PHOTOS})`}
        <input
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy}
          onChange={(e) => upload(e.target.files)}
          className="hidden"
        />
      </label>

      <p className="text-meta font-sans text-ink-muted">
        Optional, but a listing with photographs gets far more enquiries. JPEG,
        PNG, WebP or AVIF, up to {MAX_MB} MB each.
      </p>

      {error && (
        <p role="alert" className="text-meta font-sans text-error">
          {error}
        </p>
      )}
    </div>
  );
}
