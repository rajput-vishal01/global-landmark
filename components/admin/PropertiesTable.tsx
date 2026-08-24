"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { useModalLock } from "@/lib/hooks";
import { EASE } from "@/lib/motion";
import { StatusBadge } from "@/components/admin/BasicDetailsSection";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { daysOnMarket } from "@/lib/taxonomy/status";
import type { DeleteState } from "@/app/admin/(panel)/properties/actions";

type Row = {
  id: number;
  refCode: string | null;
  title: string;
  city: string | null;
  locality: string | null;
  listingStatus: string;
  publicationState: string;
  addedBy: string;
  listedAt: Date;
  updatedAt: Date;
  projectName: string | null;
  coverUrl: string | null;
};

type BulkAction = (prev: DeleteState, formData: FormData) => Promise<DeleteState>;

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

const TH =
  "text-eyebrow whitespace-nowrap px-4 py-3 text-left font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";

/**
 * The properties list table, plus multi-select + bulk delete. Selection
 * lives in this one client component rather than the whole page, so the
 * page itself (search, filters, sort, pagination) stays a plain Server
 * Component — only the checkboxes and the row actions need JS.
 *
 * Built for the exact situation a broker hits after a double-submitted
 * "Create property": a screen full of near-identical drafts and no
 * terminal to run scripts/dedupe-properties.mjs from. Select, confirm,
 * gone — same safe row-then-files delete order the single Delete button
 * already uses, just loopable.
 */
export function PropertiesTable({
  rows,
  duplicateAction,
  deleteAction,
  bulkDeleteAction,
}: {
  rows: Row[];
  duplicateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: BulkAction;
  bulkDeleteAction: BulkAction;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const allSelected = rows.length > 0 && selected.size === rows.length;

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }, [rows]);

  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedTitles = useMemo(
    () => rows.filter((r) => selected.has(r.id)).map((r) => r.title),
    [rows, selected]
  );

  return (
    <div className="flex flex-col gap-4">
      {selected.size > 0 && (
        <BulkDeleteBar
          count={selected.size}
          titles={selectedTitles}
          ids={[...selected]}
          action={bulkDeleteAction}
          onDone={() => setSelected(new Set())}
        />
      )}

      <div className="overflow-x-auto border border-border bg-white">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all properties on this page"
                  className="h-4 w-4 accent-gold"
                />
              </th>
              {["Reference", "Property", "Status", "City", "Updated", "Days", ""].map((h, i) => (
                <th key={i} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const days = daysOnMarket(new Date(p.listedAt), p.listingStatus);
              return (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="h-4 w-4 accent-gold"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink-muted">
                    {p.refCode ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden bg-ink/5">
                        {p.coverUrl && (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts
                          <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-body font-medium text-ink">{p.title}</p>
                        <p className="text-meta font-sans text-ink-muted">
                          {[p.locality, p.projectName, p.addedBy].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge status={p.listingStatus} />
                      {p.publicationState !== "published" && (
                        <span className="text-meta font-sans capitalize text-ink-muted">
                          {p.publicationState}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink">
                    {p.city ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-meta font-sans text-ink-muted">
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-meta font-sans tabular-nums text-ink-muted">
                    {days === null ? "—" : days}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-5">
                      <Link
                        href={`/admin/properties/${p.id}/edit`}
                        className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                      >
                        Edit
                      </Link>
                      {/* R-12: the 2nd-10th flat in a tower starts from a clone, not a blank form. */}
                      <form action={duplicateAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="cursor-pointer text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                        >
                          Duplicate
                        </button>
                      </form>
                      <DeleteButton
                        action={deleteAction}
                        id={p.id}
                        confirmText={`Delete "${p.title}" and all of its images? This cannot be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Sticky bar above the table once anything is selected — count, a preview of what's selected, and the delete trigger. */
function BulkDeleteBar({
  count,
  titles,
  ids,
  action,
  onDone,
}: {
  count: number;
  titles: string[];
  ids: number[];
  action: BulkAction;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const previewTitles = [...new Set(titles)].slice(0, 3);
  const preview =
    previewTitles.join(", ") + (new Set(titles).size > previewTitles.length ? ", …" : "");

  useModalLock(
    open,
    useCallback(() => setOpen(false), [])
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-gold bg-gold/10 px-5 py-3.5">
      <p className="font-sans text-meta text-ink">
        <span className="font-medium">{count}</span> selected — {preview}
      </p>
      <form
        ref={formRef}
        action={(fd) => {
          formAction(fd);
          onDone();
        }}
      >
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isPending}
          className="cursor-pointer bg-error px-5 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
        >
          {isPending ? "Removing..." : `Delete ${count} selected`}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="w-full text-meta font-sans text-error">
          {state.error}
        </p>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-dark-deep/60 p-5 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              >
                <m.div
                  role="alertdialog"
                  aria-modal="true"
                  aria-label="Confirm bulk removal"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md border border-border bg-white p-8"
                >
                  <span aria-hidden className="block h-px w-10 bg-gold" />
                  <h2 className="mt-5 font-serif text-h4 text-ink">Delete {count} properties?</h2>
                  <p className="mt-3 text-body font-sans text-ink-muted">
                    {preview}. Every image on each of these listings is removed too. This cannot be undone.
                  </p>
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      autoFocus
                      onClick={() => setOpen(false)}
                      className="cursor-pointer border border-ink/25 px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        formRef.current?.requestSubmit();
                      }}
                      className="cursor-pointer bg-error px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                    >
                      Delete {count}
                    </button>
                  </div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
