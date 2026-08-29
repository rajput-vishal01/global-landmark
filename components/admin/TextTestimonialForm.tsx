"use client";

import { useActionState } from "react";
import type { textTestimonials } from "@/lib/db/schema";
import { FIELD, LABEL } from "@/components/form-classes";
import type { TextTestimonialFormState } from "@/app/admin/(panel)/text-testimonials/actions";

type TextTestimonial = typeof textTestimonials.$inferSelect;

type Action = (
  prev: TextTestimonialFormState,
  formData: FormData
) => Promise<TextTestimonialFormState>;

const initialState: TextTestimonialFormState = {};

/** Create + edit form for a written testimonial (quote + author). */
export function TextTestimonialForm({
  testimonial,
  action,
}: {
  testimonial?: TextTestimonial;
  action: Action;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = Boolean(testimonial);

  return (
    <form action={formAction} className="flex flex-col gap-6 border border-border bg-white p-6">
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="quote" className={LABEL}>
          Quote
        </label>
        <textarea
          id="quote"
          name="quote"
          required
          rows={4}
          maxLength={1000}
          defaultValue={testimonial?.quote}
          placeholder="What the client said — quotation marks are added automatically."
          className={FIELD}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="author" className={LABEL}>
            Author
          </label>
          <input
            id="author"
            name="author"
            type="text"
            required
            maxLength={200}
            defaultValue={testimonial?.author}
            placeholder="e.g. Rakesh Sharma"
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="context" className={LABEL}>
            Context <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            id="context"
            name="context"
            type="text"
            maxLength={200}
            defaultValue={testimonial?.context ?? ""}
            placeholder="e.g. Bought in Sector 71"
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sortOrder" className={LABEL}>
            Sort order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            step={1}
            defaultValue={testimonial?.sortOrder ?? 0}
            className={FIELD}
          />
          <p className="text-meta font-sans text-ink-muted">
            Lowest first on the landing page.
          </p>
        </div>

        <label htmlFor="isPublished" className="flex items-center gap-3 self-end pb-2">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            defaultChecked={testimonial?.isPublished ?? true}
            className="h-4 w-4 accent-gold"
          />
          <span className={LABEL}>Published</span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEditing ? "Save testimonial" : "Add testimonial"}
        </button>
        {state.error && (
          <p role="alert" className="text-meta font-sans text-error">{state.error}</p>
        )}
      </div>
    </form>
  );
}
