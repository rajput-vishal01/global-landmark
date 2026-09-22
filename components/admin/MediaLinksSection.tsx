"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { deskButton } from "@/components/admin/desk";
import { deskFieldFull, deskLabel } from "./FormSection";


/**
 * CFF group 19 — the LINK half of media. Photographs are uploaded elsewhere
 * (ImageUploader); everything here is a URL that lives on someone else's
 * server and gets embedded or linked out to.
 *
 * Two gates stand between this input and a rendered embed, and they are in
 * different files:
 *
 *   1. This component checks the URL parses and is https, so a typo is
 *      caught while the broker is still looking at it. parseMedia() in
 *      lib/admin/property-parse.ts re-runs the same check on the server —
 *      the browser check is convenience, never the guard.
 *   2. The CSP `frame-src` allowlist in next.config.ts decides what can
 *      actually render in an iframe. It currently lists only
 *      youtube-nocookie.com and instagram.com. A link to a host that is not
 *      on that list saves fine and then renders as nothing at all.
 *
 * So supporting a new video host is a TWO-FILE change: add the host to
 * frame-src in next.config.ts as well as whatever renders the embed. Adding
 * it here alone produces a blank box and a confusing bug report.
 */

type MediaInput = {
  kind?: string | null;
  url?: string | null;
  label?: string | null;
};

/**
 * Values must match MEDIA_KINDS in lib/admin/property-parse.ts — the server
 * drops any row whose kind it does not recognise.
 */
const MEDIA_KINDS = [
  { value: "video", label: "Video link" },
  { value: "drone", label: "Drone video" },
  { value: "virtual_tour", label: "Virtual tour" },
  { value: "google_map", label: "Google Map" },
  { value: "brochure", label: "Brochure" },
] as const;

/** parseMedia() rejects a longer list. */
const MAX_LINKS = 20;

/**
 * `id` is client-side only. Each row holds an uncontrolled <Select> that
 * seeds itself from `defaultValue`, so rows must be keyed by something
 * stable — with index keys, deleting a row leaves the next row's Select
 * showing the deleted row's kind.
 */
type MediaRow = { id: number; kind: string; url: string; label: string };

function toRow(input: MediaInput, id: number): MediaRow {
  return {
    id,
    kind: input.kind ?? MEDIA_KINDS[0].value,
    url: input.url ?? "",
    label: input.label ?? "",
  };
}

/**
 * Returns a message to show under the field, or null when there is nothing
 * to complain about. https only: an http embed is blocked as mixed content
 * anyway, and anything exotic (javascript:, data:) must never reach an href.
 */
function urlError(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Not a valid link — paste the full address including https://";
  }
  if (parsed.protocol !== "https:") {
    return "Links must start with https:// — http and other schemes are rejected on save.";
  }
  return null;
}

export function MediaLinksSection({ initial }: { initial: MediaInput[] }) {
  const [rows, setRows] = useState<MediaRow[]>(() =>
    (initial.length ? initial : [{}]).map(toRow)
  );
  const nextId = useRef(rows.length);

  function update(id: number, patch: Partial<MediaRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function remove(id: number) {
    setRows((prev) =>
      prev.length === 1
        ? [toRow({}, nextId.current++)]
        : prev.filter((row) => row.id !== id)
    );
  }


  return (
    <>
      {/* Emits every row that has a URL, including ones flagged above: the
          inline error tells the broker, and parseMedia() is what actually
          decides. Silently dropping a row the admin can still see on screen
          is the worse failure. */}
      <input
        type="hidden"
        name="mediaJson"
        value={JSON.stringify(
          rows
            .filter((row) => row.url.trim())
            .map((row) => ({
              kind: row.kind,
              url: row.url.trim(),
              label: row.label,
            }))
        )}
      />

      {rows.map((row, i) => {
        const error = urlError(row.url);
        const errorId = `media-${row.id}-error`;

        return (
          <div
            key={row.id}
            className="flex flex-col gap-4 rounded-lg border border-line-soft bg-raise p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                Link {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(row.id)}
                aria-label={`Remove media link ${i + 1}`}
                className="cursor-pointer px-1.5 py-1 text-error hover:opacity-70"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`media-${row.id}-kind`} className={deskLabel}>
                Type
              </label>
              {/* Namespaced name: the value that saves travels in mediaJson,
                  so the Select's own hidden input must not shadow a real
                  form field. */}
              <Select
                id={`media-${row.id}-kind`}
                name={`media.${row.id}.kind`}
                defaultValue={row.kind}
                onValueChange={(value) => update(row.id, { kind: value })}
                options={MEDIA_KINDS.map((k) => ({
                  value: k.value,
                  label: k.label,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`media-${row.id}-url`} className={deskLabel}>
                Link
              </label>
              <input
                id={`media-${row.id}-url`}
                type="url"
                inputMode="url"
                maxLength={1000}
                value={row.url}
                onChange={(e) => update(row.id, { url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`${deskFieldFull} ${error ? "border-error" : ""}`}
              />
              {error && (
                <p id={errorId} className="text-[12px] text-error">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`media-${row.id}-label`} className={deskLabel}>
                Label
              </label>
              <input
                id={`media-${row.id}-label`}
                type="text"
                maxLength={120}
                value={row.label}
                onChange={(e) => update(row.id, { label: e.target.value })}
                placeholder="Optional — e.g. Terrace walkthrough"
                className={deskFieldFull}
              />
            </div>
          </div>
        );
      })}

      {rows.length < MAX_LINKS && (
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [...prev, toRow({}, nextId.current++)])
          }
          className={`${deskButton} w-fit`}
        >
          + Add another link
        </button>
      )}

      <p className="text-[11.5px] text-muted">
        Rows without a link are discarded on save.
      </p>
    </>
  );
}
