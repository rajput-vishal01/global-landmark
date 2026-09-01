"use client";

import { useState } from "react";
import { Dialog } from "@/components/admin/Dialog";

/**
 * "Add X" as a dialog instead of a trip to /new.
 *
 * These records are short — a builder is a name, a service is a title and a
 * sentence — and sending someone to another screen to type them loses their
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
  /** Button text, e.g. "Add builder". */
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
        // Matches Button variant="outline" — this is the same affordance in
        // the same place, so it must not read as a different kind of control.
        className="text-eyebrow inline-flex cursor-pointer items-center justify-center border border-ink/25 px-7 py-3.5 font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:border-gold"
      >
        {label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        {children}
      </Dialog>
    </>
  );
}
