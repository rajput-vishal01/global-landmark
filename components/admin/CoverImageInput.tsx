"use client";

import { useState } from "react";

/** Kept in step with IMAGE_MIME_TYPES / MAX_UPLOAD_BYTES in lib/storage.ts. */
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 8;

/**
 * One image, one field — the single-cover counterpart to ImageUploader.
 *
 * Same upload flow (our own /api/admin/upload, nothing browser-direct to a
 * third party) and the same unsplash-only paste rule, but without the
 * gallery's ordering, alt text and cover-picking: an area has exactly one
 * photograph, and offering a list would let an admin add five and silently
 * lose four.
 *
 * Only the URL is submitted. The storage key is derived from it server-side
 * — a key taken from the client could name someone else's file and make a
 * save delete it.
 */
export function CoverImageInput({
  name,
  initial,
}: {
  name: string;
  initial: string | null;
}) {
  const [url, setUrl] = useState(initial ?? "");
  const [pasteUrl, setPasteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    // Checked here for a fast, specific message; the server enforces the
    // same limits regardless of what this component sends.
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_MB} MB.`
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { url: string } | { error: string };
      if (!res.ok || !("url" in data)) {
        setError("error" in data ? data.error : `Upload failed (${res.status}).`);
        return;
      }
      setUrl(data.url);
    } catch (err) {
      console.error("Cover image upload failed:", err);
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function addPastedUrl() {
    const next = pasteUrl.trim();
    // Must match IMAGE_HOSTS in lib/admin/property-parse.ts and
    // remotePatterns in next.config.ts — an unlisted host makes next/image
    // throw at render and takes the public page down with it.
    let hostname = "";
    try {
      hostname = new URL(next).hostname;
    } catch {
      /* handled below */
    }
    if (hostname !== "images.unsplash.com") {
      setError("Pasted URLs must be images.unsplash.com; upload a file otherwise.");
      return;
    }
    setError(null);
    setUrl(next);
    setPasteUrl("");
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={url} />

      {url && (
        <div className="flex items-center gap-3 border border-border bg-white p-2">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-ink/5">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="min-w-0 flex-1 truncate font-sans text-meta text-ink-muted">
            {url}
          </span>
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Remove cover image"
            className="cursor-pointer px-1.5 py-1 text-error hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-3 border border-border bg-white px-5 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold">
        {busy ? "Uploading..." : url ? "Replace image" : "Upload image"}
        <input
          type="file"
          accept={ACCEPT}
          disabled={busy}
          onChange={(e) => upload(e.target.files)}
          className="hidden"
        />
      </label>
      <p className="text-meta font-sans text-ink-muted">
        JPEG, PNG, WebP or AVIF, up to {MAX_MB} MB. Landscape crops best.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          placeholder="or paste an images.unsplash.com URL"
          className="flex-1 border-b border-border bg-transparent py-2 font-sans text-meta text-ink focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          onClick={addPastedUrl}
          className="cursor-pointer border border-border bg-white px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
        >
          Add
        </button>
      </div>

      {error && (
        <p role="alert" className="text-meta font-sans text-error">{error}</p>
      )}
    </div>
  );
}
