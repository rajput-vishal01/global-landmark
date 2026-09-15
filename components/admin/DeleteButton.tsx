"use client";

import { useCallback, useState } from "react";
import { useActionForm } from "@/lib/use-action-form";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useModalLock } from "@/lib/hooks";
import { EASE } from "@/lib/motion";
import {
  cardChrome,
  deskButton,
  deskButtonDanger,
  deskButtonSmall,
  deskFace,
} from "@/components/admin/desk";
import type { DeleteState } from "@/app/admin/(panel)/properties/actions";

type Action = (prev: DeleteState, formData: FormData) => Promise<DeleteState>;

/**
 * Delete used across admin tables, guarded by a confirm dialog.
 *
 * The confirm is the point of the component, not decoration: the trigger only
 * opens the dialog, and the form is submitted from inside it. Re-skinning the
 * chrome does not change that flow.
 */
export function DeleteButton({
  action,
  id,
  label = "Delete",
  confirmText,
}: {
  action: Action;
  id: number;
  label?: string;
  confirmText: string;
}) {
  const { state, isPending, formRef, formProps } = useActionForm(action, {});
  const [open, setOpen] = useState(false);

  useModalLock(
    open,
    useCallback(() => setOpen(false), [])
  );

  return (
    <>
      <form {...formProps} className="inline-flex flex-col items-end gap-1">
        <input type="hidden" name="id" value={id} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isPending}
          className={`${deskButtonSmall} disabled:cursor-wait disabled:opacity-50`}
        >
          {isPending ? "Removing..." : label}
        </button>
        {state.error && (
          <span role="alert" className="text-[12px] text-error">
            {state.error}
          </span>
        )}
      </form>

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
                  aria-label="Confirm removal"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full max-w-md ${cardChrome} p-7`}
                >
                  <span aria-hidden className="block h-px w-10 bg-gold" />
                  <h2 className={`${deskFace} mt-5 text-[17px] font-bold text-ink`}>
                    Are you sure?
                  </h2>
                  <p className="mt-3 text-[13px] text-soft">{confirmText}</p>
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
                      {label}
                    </button>
                  </div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
