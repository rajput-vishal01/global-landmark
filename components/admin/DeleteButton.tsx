"use client";

import { useCallback, useRef, useState } from "react";
import { useActionState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useModalLock } from "@/lib/hooks";
import { EASE } from "@/lib/motion";
import type { DeleteState } from "@/app/admin/(panel)/properties/actions";

type Action = (prev: DeleteState, formData: FormData) => Promise<DeleteState>;

/** Delete used across admin tables, guarded by a branded confirm dialog. */
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
  const [state, formAction, isPending] = useActionState(action, {});
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useModalLock(
    open,
    useCallback(() => setOpen(false), [])
  );

  return (
    <>
      <form ref={formRef} action={formAction} className="inline-flex flex-col items-end gap-1">
        <input type="hidden" name="id" value={id} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isPending}
          className="cursor-pointer text-meta font-sans text-error underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current disabled:cursor-wait disabled:opacity-50"
        >
          {isPending ? "Removing..." : label}
        </button>
        {state.error && (
          <span role="alert" className="text-meta font-sans text-error">
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
                  className="w-full max-w-md border border-border bg-white p-8"
                >
                  <span aria-hidden className="block h-px w-10 bg-gold" />
                  <h2 className="mt-5 font-serif text-h4 text-ink">Are you sure?</h2>
                  <p className="mt-3 text-body font-sans text-ink-muted">{confirmText}</p>
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
