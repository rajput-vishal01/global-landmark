"use client";

import { useActionState } from "react";
import type { services } from "@/lib/db/schema";
import { FIELD, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import {
  SERVICE_ICONS,
  SERVICE_ICON_KEYS,
  SERVICE_ICON_LABELS,
} from "@/components/service-icons";
import type { ServiceFormState } from "@/app/admin/(panel)/services/actions";

type Service = typeof services.$inferSelect;

type Action = (
  prev: ServiceFormState,
  formData: FormData
) => Promise<ServiceFormState>;

const initialState: ServiceFormState = {};

/**
 * Create + edit form for an "Our Services" card. The icon is picked from a
 * fixed list, never typed as markup — see components/service-icons.tsx.
 */
export function ServiceForm({
  service,
  action,
}: {
  service?: Service;
  action: Action;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = Boolean(service);

  return (
    <form action={formAction} className="flex flex-col gap-6 border border-border bg-white p-6">
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={LABEL}>
          Title
          <Req />
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={service?.title}
          placeholder="e.g. Home Loan"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={LABEL}>
          Description <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={service?.description ?? ""}
          placeholder="One or two lines shown under the title."
          className={FIELD}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="icon" className={LABEL}>
            Icon
          </label>
          <select
            id="icon"
            name="icon"
            defaultValue={service?.icon ?? ""}
            className={FIELD}
          >
            <option value="">No icon</option>
            {SERVICE_ICON_KEYS.map((key) => (
              <option key={key} value={key}>
                {SERVICE_ICON_LABELS[key]}
              </option>
            ))}
          </select>
          <ul className="mt-2 flex flex-wrap gap-4 text-ink-muted">
            {SERVICE_ICON_KEYS.map((key) => (
              <li key={key} title={key} className="flex items-center">
                {SERVICE_ICONS[key]}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="href" className={LABEL}>
            Link <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            id="href"
            name="href"
            type="text"
            maxLength={300}
            defaultValue={service?.href ?? ""}
            placeholder="/contact or https://"
            className={FIELD}
          />
          <p className="text-meta font-sans text-ink-muted">
            Must start with / or https:// — anything else is ignored.
          </p>
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
            defaultValue={service?.sortOrder ?? 0}
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
            defaultChecked={service?.isPublished ?? true}
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
          {isPending ? "Saving..." : isEditing ? "Save service" : "Add service"}
        </button>
        {state.error && (
          <p role="alert" className="text-meta font-sans text-error">{state.error}</p>
        )}
      </div>
    </form>
  );
}
