"use client";

import { useState } from "react";
import { Dialog } from "@/components/admin/Dialog";
import { TextTestimonialForm } from "@/components/admin/TextTestimonialForm";
import { createTextTestimonial } from "@/app/admin/(panel)/text-testimonials/actions";

/**
 * "Add client quote" as a dialog rather than a trip to /new.
 *
 * A quote is five short fields; sending someone to another screen for it
 * loses their place in the list they were just reading. The /new route
 * still exists and still works — this is the fast path, not a replacement,
 * so a bookmark or a direct link is unaffected. The action redirects on
 * success, which closes the dialog by navigating.
 */
export function AddQuoteButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-eyebrow cursor-pointer border border-ink/25 px-6 py-3 font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold hover:text-gold-deep"
      >
        Add client quote
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a client quote"
        description="Appears in the “What our clients say” wall on the landing page."
      >
        <TextTestimonialForm action={createTextTestimonial} />
      </Dialog>
    </>
  );
}
