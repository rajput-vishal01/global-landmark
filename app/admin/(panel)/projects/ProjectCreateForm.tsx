"use client";

import { useActionState } from "react";
import { createProject, type ProjectFormState } from "./actions";

const initialState: ProjectFormState = {};

export function ProjectCreateForm() {
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-4 border border-border bg-white p-4"
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <label htmlFor="name" className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink">
          Name
        </label>
        <input id="name" name="name" type="text" required maxLength={200}
          placeholder="e.g. Green Lotus"
          className="border-b border-border bg-transparent py-2 font-sans text-body text-ink focus:border-gold focus:outline-none" />
      </div>
      <div className="flex min-w-64 flex-[2] flex-col gap-1.5">
        <label htmlFor="description" className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink">
          Description <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input id="description" name="description" type="text" maxLength={2000}
          className="border-b border-border bg-transparent py-2 font-sans text-body text-ink focus:border-gold focus:outline-none" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add project"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-meta font-sans text-[#9a2b2b]">{state.error}</p>
      )}
    </form>
  );
}
