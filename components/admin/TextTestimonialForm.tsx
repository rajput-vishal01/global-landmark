"use client";

import { useActionState } from "react";
import type { textTestimonials } from "@/lib/db/schema";
import { cardChrome, deskButtonPrimary } from "@/components/admin/desk";
import { deskFieldFull, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { CoverImageInput } from "@/components/admin/CoverImageInput";
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
    <form action={formAction} className={`${cardChrome} flex flex-col gap-6 p-5`}>
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="quote" className={deskLabel}>
          Quote
          <Req />
        </label>
        <textarea
          id="quote"
          name="quote"
          required
          rows={4}
          maxLength={1000}
          defaultValue={testimonial?.quote}
          placeholder="What the client said — quotation marks are added automatically."
          className={deskFieldFull}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="author" className={deskLabel}>
            Author
            <Req />
          </label>
          <input
            id="author"
            name="author"
            type="text"
            required
            maxLength={200}
            defaultValue={testimonial?.author}
            placeholder="e.g. Rakesh Sharma"
            className={deskFieldFull}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="context" className={deskLabel}>
            Context <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="context"
            name="context"
            type="text"
            maxLength={200}
            defaultValue={testimonial?.context ?? ""}
            placeholder="e.g. Bought in Sector 71"
            className={deskFieldFull}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={deskLabel}>
          Photo <span className="normal-case text-muted">(optional)</span>
        </span>
        <CoverImageInput name="avatarUrl" initial={testimonial?.avatarUrl ?? null} />
        <p className="text-[11.5px] text-muted">
          Shown as a round portrait on the card. Without one the card falls
          back to the author&rsquo;s initials, so a quote never waits on a
          headshot.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sortOrder" className={deskLabel}>
            Sort order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            step={1}
            defaultValue={testimonial?.sortOrder ?? 0}
            className={deskFieldFull}
          />
          <p className="text-[11.5px] text-muted">
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
          <span className={deskLabel}>Published</span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className={`${deskButtonPrimary} disabled:cursor-wait disabled:opacity-60`}
        >
          {isPending ? "Saving..." : isEditing ? "Save testimonial" : "Add testimonial"}
        </button>
        {state.error && (
          <p role="alert" className="text-[12px] text-error">{state.error}</p>
        )}
      </div>
    </form>
  );
}
