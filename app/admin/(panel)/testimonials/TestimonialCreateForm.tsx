"use client";

import { LABEL } from "@/components/admin/form-classes";
import { useActionState } from "react";
import { createTestimonialVideo, type TestimonialFormState } from "./actions";

const initialState: TestimonialFormState = {};const FIELD =
  "border-b border-border bg-transparent py-2 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none";

export function TestimonialCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createTestimonialVideo,
    initialState
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-4 border border-border bg-white p-4"
    >
      <div className="flex min-w-64 flex-[2] flex-col gap-1.5">
        <label htmlFor="video" className={LABEL}>YouTube or Instagram link</label>
        <input id="video" name="video" type="text" required
          placeholder="youtube.com/watch?v=...  or  instagram.com/reel/..." className={FIELD} />
      </div>
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <label htmlFor="caption" className={LABEL}>
          Caption <span className="normal-case text-ink-muted">(e.g. Grand Mega Township, Panchkula)</span>
        </label>
        <input id="caption" name="caption" type="text" maxLength={200} className={FIELD} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add video"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-meta font-sans text-[#9a2b2b]">{state.error}</p>
      )}
    </form>
  );
}
