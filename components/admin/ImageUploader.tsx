"use client";

import { useState } from "react";
import { getUploadSignature } from "@/app/admin/(panel)/properties/actions";

export type UploaderImage = { url: string; publicId: string | null; alt: string };

/**
 * Gallery editor: Cloudinary direct upload when configured, URL-paste
 * fallback otherwise. Emits the list as a hidden imagesJson field.
 */
export function ImageUploader({
  initial,
  cloudinaryEnabled,
}: {
  initial: UploaderImage[];
  cloudinaryEnabled: boolean;
}) {
  const [images, setImages] = useState<UploaderImage[]>(initial);
  const [pasteUrl, setPasteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const sig = await getUploadSignature();
      if (!sig) {
        setError("Cloudinary is not configured — paste image URLs instead.");
        return;
      }
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sig.apiKey);
        body.append("timestamp", String(sig.timestamp));
        body.append("folder", sig.folder);
        body.append("signature", sig.signature);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body }
        );
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const data = (await res.json()) as { secure_url: string; public_id: string };
        setImages((prev) => [
          ...prev,
          { url: data.secure_url, publicId: data.public_id, alt: "" },
        ]);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Upload failed. Try again or paste an image URL.");
    } finally {
      setBusy(false);
    }
  }

  function addPastedUrl() {
    const url = pasteUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      setError("Enter a full image URL (https://...).");
      return;
    }
    setError(null);
    setImages((prev) => [...prev, { url, publicId: null, alt: "" }]);
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
              className="flex items-center gap-3 border border-border bg-white p-2"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-ink/5">
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
                className="min-w-0 flex-1 border-b border-border bg-transparent py-1 font-sans text-meta text-ink focus:border-gold focus:outline-none"
              />
              <span className="text-meta font-sans text-ink-muted">
                {i === 0 ? "Cover" : `#${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  aria-label="Move up"
                  className="cursor-pointer px-1.5 py-1 text-ink-muted hover:text-ink disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}
                  aria-label="Move down"
                  className="cursor-pointer px-1.5 py-1 text-ink-muted hover:text-ink disabled:opacity-30">↓</button>
                <button type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                  className="cursor-pointer px-1.5 py-1 text-[#9a2b2b] hover:opacity-70">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cloudinaryEnabled ? (
        <label className="flex w-fit cursor-pointer items-center gap-3 border border-border bg-white px-5 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold">
          {busy ? "Uploading..." : "Upload images"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => uploadFiles(e.target.files)}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="https://... image URL (Cloudinary not configured)"
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
      )}

      {error && (
        <p role="alert" className="text-meta font-sans text-[#9a2b2b]">{error}</p>
      )}
    </div>
  );
}
