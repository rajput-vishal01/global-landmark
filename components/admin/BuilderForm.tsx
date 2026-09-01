"use client";

import { useActionState } from "react";
import type { Builder } from "@/lib/db/schema";
import { FIELD, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import type { BuilderFormState } from "@/app/admin/(panel)/builders/actions";

type Action = (
  prev: BuilderFormState,
  formData: FormData
) => Promise<BuilderFormState>;

const initialState: BuilderFormState = {};

const INTERNAL_NOTE = "text-meta font-sans text-ink-muted";

/** Create + edit builder form — CRM contact fields are internal only. */
export function BuilderForm({
  builder,
  action,
}: {
  builder?: Builder;
  action: Action;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = Boolean(builder);

  return (
    <form action={formAction} className="flex flex-col gap-6 border border-border bg-white p-6">
      {builder && <input type="hidden" name="id" value={builder.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={LABEL}>
          Name
          <Req />
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          defaultValue={builder?.name}
          placeholder="e.g. DLF Limited"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="belongsTo" className={LABEL}>
          Belongs to <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input
          id="belongsTo"
          name="belongsTo"
          type="text"
          maxLength={200}
          defaultValue={builder?.belongsTo ?? ""}
          placeholder="e.g. Chandigarh Tricity"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="about" className={LABEL}>
          About <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="about"
          name="about"
          rows={4}
          maxLength={2000}
          defaultValue={builder?.about ?? ""}
          className={FIELD}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="website" className={LABEL}>
            Website <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            id="website"
            name="website"
            type="url"
            maxLength={300}
            defaultValue={builder?.website ?? ""}
            placeholder="https://"
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="logoUrl" className={LABEL}>
            Logo URL <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="text"
            maxLength={500}
            defaultValue={builder?.logoUrl ?? ""}
            placeholder="https://"
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contactName" className={LABEL}>
            Contact name
          </label>
          <p className={INTERNAL_NOTE}>Internal only — never shown on the public site</p>
          <input
            id="contactName"
            name="contactName"
            type="text"
            maxLength={200}
            defaultValue={builder?.contactName ?? ""}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contactPhone" className={LABEL}>
            Contact phone
          </label>
          <p className={INTERNAL_NOTE}>Internal only — never shown on the public site</p>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            maxLength={30}
            defaultValue={builder?.contactPhone ?? ""}
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pastProjects" className={LABEL}>
          Past / old projects
        </label>
        <p className={INTERNAL_NOTE}>
          Internal track record used when pitching — not published
        </p>
        <textarea
          id="pastProjects"
          name="pastProjects"
          rows={3}
          maxLength={2000}
          defaultValue={builder?.pastProjects ?? ""}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priceAppreciation" className={LABEL}>
          Price appreciation track record
        </label>
        <p className={INTERNAL_NOTE}>
          Internal projection, not a published claim
        </p>
        <textarea
          id="priceAppreciation"
          name="priceAppreciation"
          rows={3}
          maxLength={2000}
          defaultValue={builder?.priceAppreciation ?? ""}
          className={FIELD}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEditing ? "Save builder" : "Add builder"}
        </button>
        {state.error && (
          <p role="alert" className="text-meta font-sans text-error">{state.error}</p>
        )}
      </div>
    </form>
  );
}
