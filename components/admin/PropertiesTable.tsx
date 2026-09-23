"use client";

import { useCallback, useMemo, useState } from "react";
import { useActionForm } from "@/lib/use-action-form";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { useModalLock } from "@/lib/hooks";
import { EASE } from "@/lib/motion";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  Chip,
  Table,
  TableWrap,
  cardChrome,
  deskButton,
  deskButtonDanger,
  deskFace,
  deskRowLink,
  numericCell,
  type ChipTone,
} from "@/components/admin/desk";
import { daysOnMarket } from "@/lib/taxonomy/status";
import type { DeleteState } from "@/app/admin/(panel)/properties/actions";
import { formatDate } from "@/lib/dates";

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

/**
 * Publication state as a step of the gold ramp: live for what the public can
 * see, then down the ramp as it recedes from them. Not a red/amber/green set —
 * the brand has one accent (ADMIN_DESK section 7).
 */
const PUBLICATION_TONE: Record<string, ChipTone> = {
  published: "live",
  draft: "neutral",
  archived: "quiet",
};

/** Right-aligned in both the heading and the cell, so the column reads straight. */
const NUMERIC_HEADS = new Set(["Reference", "Days"]);

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
 *
 * Cell chrome comes from `Table`, which styles `thead th` and `tbody td`
 * itself. The local per-cell padding/size classes this used to carry are
 * gone: a table that dresses its own cells drifts away from every other
 * list on the desk one class at a time.
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

      <TableWrap>
        <Table className="min-w-[900px]">
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all properties on this page"
                  className="h-4 w-4 accent-gold"
                />
              </th>
              {["Reference", "Property", "Status", "City", "Updated", "Days", ""].map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={NUMERIC_HEADS.has(h) ? numericCell : undefined}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const days = daysOnMarket(new Date(p.listedAt), p.listingStatus);
              return (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="h-4 w-4 accent-gold"
                    />
                  </td>
                  <td className={`whitespace-nowrap text-muted ${numericCell}`}>
                    {p.refCode ?? "—"}
                  </td>
                  {/* Fixed-width, single-line. A title that wraps turns a
                      scannable list into three-line blocks and the row
                      height stops being uniform, which is the thing that
                      makes a table readable at a glance. Full text stays
                      available on hover via the title attribute. */}
                  <td className="max-w-[24rem]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-[4px] bg-raise">
                        {p.coverUrl && (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts
                          <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p title={p.title} className="truncate font-medium text-ink">
                          {p.title}
                        </p>
                        <p className="truncate text-[12px] text-muted">
                          {[p.locality, p.projectName, p.addedBy].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-1.5">
                      <Chip tone={PUBLICATION_TONE[p.publicationState] ?? "neutral"}>
                        <span className="capitalize">{p.publicationState}</span>
                      </Chip>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-soft">{p.city ?? "—"}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(p.updatedAt)}</td>
                  <td className={`whitespace-nowrap text-muted ${numericCell}`}>
                    {days === null ? "—" : days}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/properties/${p.id}/edit`} className={deskRowLink}>
                        Edit
                      </Link>
                      {/* R-12: the 2nd-10th flat in a tower starts from a clone, not a blank form. */}
                      <form action={duplicateAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className={`cursor-pointer ${deskRowLink}`}>
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
        </Table>
      </TableWrap>
    </div>
  );
}

/** The bar above the table once anything is selected — count, a preview of what's selected, and the delete trigger. */
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
  // Selection clears only once the delete has actually succeeded. It used to
  // clear straight after dispatch, which unmounted this bar mid-request — so a
  // failed bulk delete never showed its error and simply looked like it worked.
  const { state, isPending, formRef, formProps } = useActionForm(action, {}, {
    onSuccess: onDone,
  });
  const [open, setOpen] = useState(false);
  const previewTitles = [...new Set(titles)].slice(0, 3);
  const preview =
    previewTitles.join(", ") + (new Set(titles).size > previewTitles.length ? ", …" : "");

  useModalLock(
    open,
    useCallback(() => setOpen(false), [])
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-gold bg-gold/10 px-4 py-3">
      <p className="text-[13px] text-ink">
        <span className="font-semibold">{count}</span> selected — {preview}
      </p>
      <form {...formProps}>
        {ids.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isPending}
          className={`${deskButtonDanger} disabled:cursor-wait disabled:opacity-50`}
        >
          {isPending ? "Removing..." : `Delete ${count} selected`}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="w-full text-[12px] text-error">
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
                  className={`w-full max-w-md ${cardChrome} p-7`}
                >
                  <span aria-hidden className="block h-px w-10 bg-gold" />
                  <h2 className={`${deskFace} mt-5 text-[17px] font-bold text-ink`}>
                    Delete {count} properties?
                  </h2>
                  <p className="mt-3 text-[13px] text-soft">
                    {preview}. Every image on each of these listings is removed too. This cannot be
                    undone.
                  </p>
                  <div className="mt-7 flex justify-end gap-3">
                    <button
                      type="button"
                      autoFocus
                      onClick={() => setOpen(false)}
                      className={deskButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        formRef.current?.requestSubmit();
                      }}
                      className={deskButtonDanger}
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
