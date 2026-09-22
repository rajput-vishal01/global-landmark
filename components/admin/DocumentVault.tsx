"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Select } from "@/components/ui/Select";
import { deskButton, deskButtonSmall, focusRing } from "@/components/admin/desk";
import { useModalLock, useMounted } from "@/lib/hooks";
import { withEmptyOption } from "@/lib/attributes";
import { DOCUMENTATION_FLAGS } from "@/lib/taxonomy/features";

/**
 * The property's paperwork (R-29), arranged the way a broker thinks about
 * it: by document. Each row is one kind of document — Sale Deed, Registry,
 * Naksha — with however many files belong to it (a deed runs to several
 * scanned pages). Pick what the document is, then upload; once a row has a
 * file, a fresh empty row appears for the next document.
 *
 * Files land under private/ and are served only through the admin-gated
 * /api/admin/documents/<key>. Every file can be previewed in place.
 *
 * ONE exception to private: a file can be marked "On website" so a brochure
 * can be downloaded from the property page. Per file, off by default, and
 * never derived from the document type — a type is a label picked from a
 * dropdown, and a mis-picked one must not publish a sale deed.
 */

type DocumentInput = {
  docType: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  uploadedBy: string | null;
  isPublic?: boolean | null;
};

type DocFile = {
  storageKey: string;
  docType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string;
  uploadedBy: string;
  isPublic: boolean;
};

/** One document row. `id` is client-only, so removing a row never shifts another's select. */
type Group = { id: number; docType: string };

/**
 * What the picker offers. The upload route checks the bytes of every file
 * regardless — this only decides what the OS dialog shows.
 */
const ACCEPT = ".pdf,.doc,.docx,image/*,.heic,.heif";

/** Mirrors the 30-row cap parseDocuments() enforces. */
const MAX_DOCS = 30;

/** Formats a browser draws itself; anything else (Word, HEIC, TIFF) downloads. */
const PREVIEWABLE_IMAGE = /^image\/(jpeg|png|webp|avif|gif|bmp)$/;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileUrl(storageKey: string, inline = false): string {
  return `/api/admin/documents/${storageKey}${inline ? "?inline=1" : ""}`;
}

function kindOf(mimeType: string): "pdf" | "image" | "word" | "other" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("word")) return "word";
  return "other";
}

export function DocumentVault({ initial }: { initial: DocumentInput[] }) {
  const [files, setFiles] = useState<DocFile[]>(() =>
    initial.map((d) => ({
      storageKey: d.storageKey,
      docType: d.docType,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      note: d.note ?? "",
      uploadedBy: d.uploadedBy ?? "",
      // `?? false`, never inferred from docType: a file whose visibility
      // nobody considered stays private.
      isPublic: d.isPublic ?? false,
    }))
  );
  // One row per document type already on file, plus an empty one to add the next.
  const [groups, setGroups] = useState<Group[]>(() =>
    [...new Set(initial.map((d) => d.docType).filter(Boolean)), ""].map((docType, id) => ({
      id,
      docType,
    }))
  );
  const nextId = useRef(groups.length);
  const [uploading, setUploading] = useState<{ groupId: number; done: number; total: number } | null>(
    null
  );
  const [errors, setErrors] = useState<Record<number, string[]>>({});
  const [preview, setPreview] = useState<DocFile | null>(null);

  const usedTypes = new Set(groups.map((g) => g.docType).filter(Boolean));
  const hasBlankRow = groups.some((g) => !g.docType);
  const isFull = files.length >= MAX_DOCS;

  function setGroupType(group: Group, docType: string) {
    setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, docType } : g)));
    // The files already in this row are the same document under its new name.
    if (group.docType) {
      setFiles((prev) =>
        prev.map((f) => (f.docType === group.docType ? { ...f, docType } : f))
      );
    }
  }

  function removeGroup(group: Group) {
    setFiles((prev) => prev.filter((f) => f.docType !== group.docType || !group.docType));
    setGroups((prev) => {
      const rest = prev.filter((g) => g.id !== group.id);
      return rest.some((g) => !g.docType) ? rest : [...rest, { id: nextId.current++, docType: "" }];
    });
  }

  function addBlankRow() {
    setGroups((prev) => [...prev, { id: nextId.current++, docType: "" }]);
  }

  function updateFile(storageKey: string, patch: Partial<DocFile>) {
    setFiles((prev) => prev.map((f) => (f.storageKey === storageKey ? { ...f, ...patch } : f)));
  }

  async function upload(group: Group, picked: FileList | File[] | null) {
    const list = Array.from(picked ?? []);
    if (!group.docType || list.length === 0) return;

    const room = MAX_DOCS - files.length;
    const batch = list.slice(0, Math.max(0, room));
    const problems: string[] =
      list.length > batch.length
        ? [`Only ${batch.length} of ${list.length} files fit — a listing holds ${MAX_DOCS} documents.`]
        : [];

    setUploading({ groupId: group.id, done: 0, total: batch.length });
    setErrors((prev) => ({ ...prev, [group.id]: [] }));

    // One at a time: a batch of scans can be large, and a failed file should
    // cost only itself, not the rest of the selection.
    const added: DocFile[] = [];
    for (const [i, file] of batch.entries()) {
      try {
        const body = new FormData();
        body.append("file", file);
        // `kind=document` routes the file to private/. Dropping it would
        // publish a legal document at a guessable public URL.
        body.append("kind", "document");
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as
          | { storageKey: string; mimeType: string; sizeBytes: number }
          | { error?: string };
        if (!res.ok || !("storageKey" in data)) {
          problems.push(
            res.status === 413
              ? `"${file.name}" is too large to upload.`
              : "error" in data && data.error
                ? data.error
                : `"${file.name}" did not upload (${res.status}).`
          );
        } else if (
          !files.some((f) => f.storageKey === data.storageKey) &&
          !added.some((f) => f.storageKey === data.storageKey)
        ) {
          added.push({
            storageKey: data.storageKey,
            docType: group.docType,
            fileName: file.name,
            mimeType: data.mimeType,
            sizeBytes: data.sizeBytes,
            note: "",
            uploadedBy: "",
            isPublic: false,
          });
        } else {
          problems.push(`"${file.name}" is already attached.`);
        }
      } catch (err) {
        console.error("Document upload failed:", err);
        problems.push(`"${file.name}" failed — check your connection and try again.`);
      }
      setUploading({ groupId: group.id, done: i + 1, total: batch.length });
    }

    setFiles((prev) => [...prev, ...added]);
    setErrors((prev) => ({ ...prev, [group.id]: problems }));
    setUploading(null);
    // The row now holds a document, so offer the next one.
    if (added.length > 0) {
      setGroups((prev) =>
        prev.some((g) => !g.docType) ? prev : [...prev, { id: nextId.current++, docType: "" }]
      );
    }
  }

  return (
    <>
      {/* The whole list travels as one hidden field. parseDocuments() on the
          server re-validates every row and drops anything broken — this
          state is convenience for the broker, never the gate. */}
      <input
        type="hidden"
        name="documentsJson"
        value={JSON.stringify(
          files
            .filter((f) => usedTypes.has(f.docType))
            .map((f) => ({
              docType: f.docType,
              storageKey: f.storageKey,
              fileName: f.fileName,
              mimeType: f.mimeType,
              sizeBytes: f.sizeBytes,
              note: f.note,
              uploadedBy: f.uploadedBy,
              isPublic: f.isPublic,
            }))
        )}
      />

      <ul className="flex flex-col gap-3">
        {groups.map((group, index) => {
          const groupFiles = group.docType ? files.filter((f) => f.docType === group.docType) : [];
          const busy = uploading?.groupId === group.id;
          const groupErrors = errors[group.id] ?? [];
          return (
            <li
              key={group.id}
              onDragOver={(e) => {
                if (group.docType) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!group.docType) return;
                e.preventDefault();
                void upload(group, e.dataTransfer.files);
              }}
              className={`flex flex-col gap-3 rounded-lg border p-3.5 ${
                group.docType ? "border-line bg-surface" : "border-dashed border-line bg-raise/60"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="w-5 shrink-0 text-center text-[11.5px] font-semibold tabular-nums text-muted">
                  {index + 1}
                </span>
                <div className="min-w-[12rem] flex-1">
                  <Select
                    // Remounts when the choice changes elsewhere (removal), so
                    // the shown value and the row cannot disagree.
                    key={`${group.id}-${group.docType}`}
                    id={`doc-group-${group.id}`}
                    name={`docGroup${group.id}`}
                    aria-label={`Document ${index + 1} type`}
                    defaultValue={group.docType}
                    onValueChange={(value) => setGroupType(group, value)}
                    options={withEmptyOption(
                      "— What is this document? —",
                      DOCUMENTATION_FLAGS.filter(
                        (t) => t === group.docType || !usedTypes.has(t)
                      )
                    )}
                  />
                </div>

                <label
                  className={`${deskButton} ${
                    !group.docType || busy || isFull ? "pointer-events-none opacity-50" : ""
                  } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold`}
                >
                  <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                  </svg>
                  {busy
                    ? `Uploading ${uploading.done + 1 > uploading.total ? uploading.total : uploading.done + 1} of ${uploading.total}…`
                    : groupFiles.length
                      ? "Add more files"
                      : "Upload files"}
                  <input
                    type="file"
                    multiple
                    accept={ACCEPT}
                    disabled={!group.docType || busy || isFull}
                    onChange={(e) => {
                      void upload(group, e.target.files);
                      e.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>

                {(group.docType || groups.length > 1) && (
                  <button
                    type="button"
                    onClick={() => removeGroup(group)}
                    aria-label={`Remove ${group.docType || "this row"}${groupFiles.length ? " and its files" : ""}`}
                    title="Remove this document"
                    className={`cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-raise hover:text-error ${focusRing}`}
                  >
                    <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                    </svg>
                  </button>
                )}
              </div>

              {!group.docType && (
                <p className="pl-7 text-[11.5px] text-muted">
                  Choose what the document is, then upload — several files at once is fine.
                </p>
              )}

              {groupFiles.length > 0 && (
                <ul className="flex flex-col gap-2 pl-7">
                  {groupFiles.map((file) => (
                    <FileRow
                      key={file.storageKey}
                      file={file}
                      onPreview={() => setPreview(file)}
                      onRemove={() =>
                        setFiles((prev) => prev.filter((f) => f.storageKey !== file.storageKey))
                      }
                      onTogglePublic={(isPublic) => updateFile(file.storageKey, { isPublic })}
                    />
                  ))}
                </ul>
              )}

              {groupErrors.length > 0 && (
                <ul role="alert" className="flex flex-col gap-0.5 pl-7 text-[12px] text-error">
                  {groupErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted">
          PDF, Word (.doc, .docx) or any photo · up to 20 MB each · drag files onto a row ·{" "}
          {files.length}/{MAX_DOCS} files
        </p>
        {!hasBlankRow && !isFull && (
          <button type="button" onClick={addBlankRow} className={deskButtonSmall}>
            + Add another document
          </button>
        )}
      </div>

      <PreviewDialog file={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function FileRow({
  file,
  onPreview,
  onRemove,
  onTogglePublic,
}: {
  file: DocFile;
  onPreview: () => void;
  onRemove: () => void;
  onTogglePublic: (isPublic: boolean) => void;
}) {
  const kind = kindOf(file.mimeType);
  return (
    <li
      className={`flex flex-col gap-2 rounded-md border px-2.5 py-2 ${
        file.isPublic ? "border-error/60 bg-error/5" : "border-line-soft bg-raise/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview ${file.fileName}`}
          className={`relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-line bg-surface ${focusRing}`}
        >
          {kind === "image" && PREVIEWABLE_IMAGE.test(file.mimeType) ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-gated route, not optimisable
            <img src={fileUrl(file.storageKey, true)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span
              className={`text-[10px] font-bold tracking-wide ${
                kind === "pdf" ? "text-error" : kind === "word" ? "text-[#2b579a]" : "text-soft"
              }`}
            >
              {kind === "pdf" ? "PDF" : kind === "word" ? "DOC" : "IMG"}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onPreview}
          className={`flex min-w-0 flex-1 cursor-pointer flex-col text-left ${focusRing}`}
        >
          <span className="truncate text-[13px] text-ink hover:underline">{file.fileName}</span>
          <span className="text-[11.5px] text-muted">{formatSize(file.sizeBytes)}</span>
        </button>

        <label
          className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11.5px] text-soft"
          title="Lets anyone download this file from the property page"
        >
          <input
            type="checkbox"
            checked={file.isPublic}
            onChange={(e) => onTogglePublic(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-gold)]"
          />
          On website
        </label>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.fileName}`}
          className={`shrink-0 cursor-pointer rounded-md p-1 text-muted transition-colors hover:text-error ${focusRing}`}
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      {file.isPublic && (
        <p className="text-[11.5px] leading-snug text-error">
          Anyone can download this from the property page. Only for a brochure or
          price list — never a deed, registry or anything with an owner&apos;s details.
        </p>
      )}
    </li>
  );
}

/** A file shown in place: PDFs in a frame, photos as images, the rest as a download. */
function PreviewDialog({ file, onClose }: { file: DocFile | null; onClose: () => void }) {
  const mounted = useMounted();
  useModalLock(
    file !== null,
    useCallback(() => onClose(), [onClose])
  );
  if (!mounted || !file) return null;

  const kind = kindOf(file.mimeType);
  const canShow = kind === "pdf" || PREVIEWABLE_IMAGE.test(file.mimeType);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-deep/70 p-3 backdrop-blur-sm sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${file.fileName}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[10px] bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13.5px] font-semibold text-ink">{file.fileName}</span>
            <span className="text-[11.5px] text-muted">
              {file.docType} · {formatSize(file.sizeBytes)}
            </span>
          </div>
          <a href={fileUrl(file.storageKey)} className={deskButtonSmall}>
            Download
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className={`cursor-pointer rounded-md p-1.5 text-muted hover:text-ink ${focusRing}`}
          >
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-raise">
          {kind === "pdf" ? (
            <iframe
              src={fileUrl(file.storageKey, true)}
              title={file.fileName}
              className="h-[78vh] w-full border-0 bg-surface"
            />
          ) : canShow ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-gated route, not optimisable
            <img
              src={fileUrl(file.storageKey, true)}
              alt={file.fileName}
              className="max-h-[78vh] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="text-[13px] text-ink">
                {kind === "word"
                  ? "Word files cannot be shown in the browser."
                  : "This photo format cannot be shown in the browser."}
              </span>
              <a href={fileUrl(file.storageKey)} className={deskButton}>
                Download to open it
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
