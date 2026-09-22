"use client";

import { useState } from "react";
import { MAX_SELL_PHOTOS } from "@/lib/sell-photos";

/** Kept in step with IMAGE_MIME_TYPES / MAX_UPLOAD_BYTES in lib/storage.ts. */
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 20;

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
  const [dragging, setDragging] = useState(false);

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
        // Not every failure is our JSON: a proxy in front of the app answers
        // an oversized upload with its own HTML 413 page. Parsing that threw,
        // which reported a connection problem and abandoned the other files.
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

        if (!res.ok || !data.url) {
          setError(
            data.error ??
              (res.status === 413
                ? `"${file.name}" is too large to upload.`
                : `Upload failed (${res.status}).`)
          );
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

  const full = urls.length >= MAX_SELL_PHOTOS;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="photosJson" value={JSON.stringify(urls)} />

      {/* A drop zone as well as a picker: sellers usually have the photos
          open in a folder already, and dragging them in is the natural move.
          The whole zone is the <label>, so a click anywhere opens the picker. */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) void upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-10 text-center transition-colors ${
          full || busy ? "cursor-not-allowed" : "cursor-pointer"
        } ${dragging ? "border-gold bg-gold/5" : "border-border bg-cream/40 hover:border-gold/60 hover:bg-gold/5"}`}
      >
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-white text-gold-deep"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <span className="font-sans text-body font-semibold text-ink">
          {busy ? "Uploading…" : full ? "Photo limit reached" : "Drop photos here or click to browse"}
        </span>
        <span className="text-meta font-sans text-ink-muted">
          JPEG, PNG, WebP or AVIF, up to {MAX_MB} MB each · {urls.length}/{MAX_SELL_PHOTOS} added
        </span>
        <input
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy || full}
          onChange={(e) => {
            void upload(e.target.files);
            // Cleared so picking the same file again still fires onChange.
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>

      {urls.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {urls.map((url, i) => (
            <li key={url} className="group relative aspect-4/3 overflow-hidden border border-border bg-ink/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- same-origin upload, no optimisation needed for a 96px thumbnail */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
                aria-label={`Remove photo ${i + 1}`}
                // Always visible on touch screens, where there is no hover.
                className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-dark-deep/75 text-[12px] text-cream transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-meta font-sans text-error">
          {error}
        </p>
      )}
    </div>
  );
}
