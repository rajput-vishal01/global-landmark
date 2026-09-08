"use client";

import { useState } from "react";
import { deskButton } from "@/components/admin/desk";
import { deskFieldFull } from "./FormSection";

type UploaderImage = { url: string; storageKey: string | null; alt: string };

/** Kept in step with IMAGE_MIME_TYPES / MAX_UPLOAD_BYTES in lib/storage.ts. */
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 8;
/**
 * Must match MAX_IMAGES in lib/admin/property-parse.ts. The server rejects an
 * over-long list with "Image list is invalid", which reads as a bug rather
 * than a limit — so the cap is enforced and named here too, before a broker
 * spends a minute uploading files that the save will refuse.
 */
const MAX_IMAGES = 20;

/**
 * Gallery editor. Files are uploaded through our own server, which stores
 * them in the database — no third-party account, and nothing leaves the
 * app. Pasting a URL is still supported for the remaining stock imagery,
 * which lives on an external host until the client's photos arrive.
 *
 * Emits the list as a hidden imagesJson field.
 */
export function ImageUploader({
  initial,
  onBusyChange,
}: {
  initial: UploaderImage[];
  /** Lets the parent form block submit while uploads are in flight. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [images, setImages] = useState<UploaderImage[]>(initial);
  const [pasteUrl, setPasteUrl] = useState("");
  const [busy, setBusyState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusy(value: boolean) {
    setBusyState(value);
    onBusyChange?.(value);
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      // Read once from state rather than per iteration: setImages is async,
      // so counting inside the loop would still see the pre-upload length and
      // let a multi-file selection sail past the cap.
      let slots = MAX_IMAGES - images.length;
      if (slots <= 0) {
        setError(`Already at the ${MAX_IMAGES}-image limit. Remove one to add another.`);
        return;
      }
      for (const file of Array.from(files)) {
        if (slots <= 0) {
          setError(`Only the first ${MAX_IMAGES} images were kept — that is the limit per listing.`);
          break;
        }
        // Checked here for a fast, specific message; the server enforces
        // the same limits regardless of what this component sends.
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(
            `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_MB} MB.`
          );
          continue;
        }
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await res.json()) as
          | { url: string; storageKey: string }
          | { error: string };
        if (!res.ok || !("url" in data)) {
          setError("error" in data ? data.error : `Upload failed (${res.status}).`);
          continue;
        }
        // Same bytes uploaded twice yield the same key, so skip the duplicate
        // rather than showing the image twice in one gallery.
        slots--;
        setImages((prev) =>
          prev.some((img) => img.storageKey === data.storageKey)
            ? prev
            : [...prev, { url: data.url, storageKey: data.storageKey, alt: "" }]
        );
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function addPastedUrl() {
    const url = pasteUrl.trim();
    if (images.length >= MAX_IMAGES) {
      setError(`Already at the ${MAX_IMAGES}-image limit. Remove one to add another.`);
      return;
    }
    // Must match IMAGE_HOSTS in the property action and remotePatterns in
    // next.config.ts — an unlisted host makes next/image throw at render.
    let hostname = "";
    try {
      hostname = new URL(url).hostname;
    } catch {
      /* handled below */
    }
    if (hostname !== "images.unsplash.com") {
      setError("Pasted URLs must be images.unsplash.com; upload a file otherwise.");
      return;
    }
    setError(null);
    setImages((prev) => [...prev, { url, storageKey: null, alt: "" }]);
    setPasteUrl("");
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      {images.length > 0 && (
        <ul className="flex flex-col gap-2">
          {images.map((img, i) => (
            <li
              key={`${img.url}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-line-soft bg-raise p-2"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-raise">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <input
                type="text"
                value={img.alt}
                onChange={(e) =>
                  setImages((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, alt: e.target.value } : p))
                  )
                }
                placeholder="Alt text"
                className={`${deskFieldFull} flex-1`}
              />
              <span className="text-[11.5px] text-muted">
                {i === 0 ? "Cover" : `#${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  aria-label="Move up"
                  className="cursor-pointer px-1.5 py-1 text-muted hover:text-ink disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}
                  aria-label="Move down"
                  className="cursor-pointer px-1.5 py-1 text-muted hover:text-ink disabled:opacity-30">↓</button>
                <button type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                  className="cursor-pointer px-1.5 py-1 text-error hover:opacity-70">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className={`${deskButton} w-fit`}>
        {busy ? "Uploading..." : `Upload images (${images.length}/${MAX_IMAGES})`}
        <input
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy}
          onChange={(e) => uploadFiles(e.target.files)}
          className="hidden"
        />
      </label>
      <p className="text-[11.5px] text-muted">
        JPEG, PNG, WebP or AVIF, up to {MAX_MB} MB each. The first image is the
        cover.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          placeholder="or paste an images.unsplash.com URL"
          className={`${deskFieldFull} flex-1`}
        />
        <button
          type="button"
          onClick={addPastedUrl}
          className={deskButton}
        >
          Add
        </button>
      </div>

      {error && (
        <p role="alert" className="text-[12px] text-error">{error}</p>
      )}
    </div>
  );
}
