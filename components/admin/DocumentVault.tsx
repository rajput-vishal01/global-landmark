"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";
import { DOCUMENTATION_FLAGS } from "@/lib/taxonomy/features";

/**
 * CFF group 17 — the legal document vault (R-29). Unlike the property
 * gallery, nothing here is ever meant for a public page: every row points at
 * a file under private/ storage, readable only through the admin-gated
 * /api/admin/documents/<key> route built alongside this component.
 */

type DocumentInput = {
  docType: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  uploadedBy: string | null;
};

/**
 * Must match DOCUMENT_TYPES in lib/storage.ts — the upload route rejects
 * anything else regardless of what this attribute lets the OS picker show.
 */
const ACCEPT = "application/pdf,image/jpeg,image/png";

/** Mirrors the 30-row cap parseDocuments() enforces in lib/admin/property-parse.ts. */
const MAX_DOCS = 30;

/**
 * `id` is client-side only, like the row id pattern in MediaLinksSection —
 * rows are keyed by it rather than by index so removing one mid-list doesn't
 * shift another row's uncontrolled <Select> into showing the wrong docType.
 */
type DocRow = {
  id: number;
  docType: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string;
  uploadedBy: string;
};

function toRow(input: DocumentInput, id: number): DocRow {
  return {
    id,
    docType: input.docType,
    storageKey: input.storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    note: input.note ?? "",
    uploadedBy: input.uploadedBy ?? "",
  };
}

/** sizeBytes always comes back from the upload response, never typed by a user. */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentVault({ initial }: { initial: DocumentInput[] }) {
  const [rows, setRows] = useState<DocRow[]>(() =>
    initial.map((doc, i) => toRow(doc, i))
  );
  const nextId = useRef(initial.length);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(id: number, patch: Partial<DocRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function remove(id: number) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  async function uploadFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      // `kind=document` is the field that routes storeFile() to private/
      // instead of public/ — ImageUploader posts to this same endpoint
      // without it and gets the image default. Dropping this here would
      // silently publish a legal document at a guessable public URL, which
      // is the exact bug this whole component exists to prevent.
      body.append("kind", "document");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as
        | { storageKey: string; url: string; mimeType: string; sizeBytes: number }
        | { error: string };
      if (!res.ok || !("storageKey" in data)) {
        setError("error" in data ? data.error : `Upload failed (${res.status}).`);
        return;
      }
      // url is /api/admin/documents/<storageKey> — derivable from storageKey
      // alone, so it isn't stored on the row; building it twice would risk
      // the two copies drifting.
      setRows((prev) => [
        ...prev,
        {
          id: nextId.current++,
          docType: "",
          storageKey: data.storageKey,
          fileName: file.name,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          note: "",
          uploadedBy: "",
        },
      ]);
    } catch (err) {
      console.error("Document upload failed:", err);
      setError("Upload failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Every row already points at a real uploaded file; the field still
  // missing on a fresh row is docType, so that is what "filled" tracks here
  // — the badge reaches N/N once every attached document has been classified.
  const filled = countFilled(rows.map((row) => row.docType));

  return (
    <FormSection
      title="Documents"
      hint="Internal only — never shown publicly"
      filled={filled}
      total={rows.length}
    >
      {/* Whole list travels as one hidden field, exactly like mediaJson in
          MediaLinksSection. parseDocuments() on the server re-validates
          every row (docType against DOCUMENTATION_FLAGS, storageKey against
          an actual uploaded file) and drops anything broken — this
          component's state is convenience for the broker, never the gate. */}
      <input
        type="hidden"
        name="documentsJson"
        value={JSON.stringify(
          rows.map((row) => ({
            docType: row.docType,
            storageKey: row.storageKey,
            fileName: row.fileName,
            mimeType: row.mimeType,
            sizeBytes: row.sizeBytes,
            note: row.note,
            uploadedBy: row.uploadedBy,
          }))
        )}
      />

      <p className="border border-gold-deep/30 bg-cream px-4 py-3 font-sans text-meta text-ink">
        Internal only. These files can be downloaded solely by a logged-in
        admin — they never appear on the public site and are never indexed by
        search engines.
      </p>

      {rows.length > 0 && (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-4 border border-border bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-sans text-body text-ink">
                    {row.fileName}
                  </span>
                  <span className="font-sans text-meta text-ink-muted">
                    {formatSize(row.sizeBytes)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {/* Opens in a new tab so the broker can confirm the right
                      file uploaded without losing their place in the form. */}
                  <a
                    href={`/api/admin/documents/${row.storageKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-gold-deep hover:underline"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    aria-label={`Remove ${row.fileName}`}
                    className="cursor-pointer px-1.5 py-1 text-error hover:opacity-70"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={`doc-${row.id}-type`} className={LABEL}>
                  Document type
                </label>
                <Select
                  id={`doc-${row.id}-type`}
                  name={`documents.${row.id}.docType`}
                  defaultValue={row.docType}
                  onValueChange={(value) => update(row.id, { docType: value })}
                  options={DOCUMENTATION_FLAGS.map((flag) => ({
                    value: flag,
                    label: flag,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={`doc-${row.id}-note`} className={LABEL}>
                  Note
                </label>
                <input
                  id={`doc-${row.id}-note`}
                  type="text"
                  maxLength={1000}
                  value={row.note}
                  onChange={(e) => update(row.id, { note: e.target.value })}
                  placeholder="Optional — e.g. Awaiting registrar stamp"
                  className={FIELD}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={`doc-${row.id}-uploader`} className={LABEL}>
                  Uploaded by
                </label>
                {/* Free text, not a session user id — there is no admin
                    login/user system yet, so this is the only record of who
                    attached the file until one gets built. */}
                <input
                  id={`doc-${row.id}-uploader`}
                  type="text"
                  maxLength={200}
                  value={row.uploadedBy}
                  onChange={(e) => update(row.id, { uploadedBy: e.target.value })}
                  placeholder="Name of the admin who uploaded this"
                  className={FIELD}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length < MAX_DOCS ? (
        <label className="flex w-fit cursor-pointer items-center gap-3 border border-border bg-white px-5 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold">
          {busy ? "Uploading..." : "Upload document"}
          <input
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(e) => uploadFile(e.target.files)}
            className="hidden"
          />
        </label>
      ) : (
        <p className="font-sans text-meta text-ink-muted">
          {MAX_DOCS} documents attached — the maximum this form accepts.
          Remove one before uploading another.
        </p>
      )}

      <p className="font-sans text-meta text-ink-muted">
        PDF, JPEG or PNG.
      </p>

      {error && (
        <p role="alert" className="font-sans text-meta text-error">
          {error}
        </p>
      )}
    </FormSection>
  );
}
