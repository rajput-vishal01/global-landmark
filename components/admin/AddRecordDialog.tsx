"use client";

import { useState } from "react";
import { Dialog } from "@/components/admin/Dialog";
import { deskButtonPrimary } from "@/components/admin/desk";

/**
 * "Add X" as a dialog instead of a trip to /new.
 *
 * These records are short — a service is a title and a sentence, a quote is
 * a few lines — and sending someone to another screen to type them loses their
 * place in the list they were just reading, then drops them back at the top
 * of it afterwards.
 *
 * The form arrives as `children` so this stays one component rather than one
 * per entity: each list page passes its own form, already bound to its own
 * server action. Those actions redirect on success, which closes the dialog
 * by navigating. Every /new route still exists and still works, so links,
 * bookmarks and the back button are unaffected — this is the fast path, not
 * a replacement.
 */
export function AddRecordDialog({
  label,
  title,
  description,
  children,
}: {
  /** Button text, e.g. "Add service". */
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // The screen's one filled action. Every page that renders this puts it
        // in the PageHead actions slot and has no other primary, which is the
        // rule in ADMIN_DESK §3.
        className={deskButtonPrimary}
      >
        {label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        {children}
      </Dialog>
    </>
  );
}
