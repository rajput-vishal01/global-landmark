"use client";

import { useActionState } from "react";
import type { services } from "@/lib/db/schema";
import { cardChrome, deskButtonPrimary } from "@/components/admin/desk";
import { deskFieldFull, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
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
    <form action={formAction} className={`${cardChrome} flex flex-col gap-6 p-5`}>
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={deskLabel}>
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
          className={deskFieldFull}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={deskLabel}>
          Description <span className="normal-case text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={service?.description ?? ""}
          placeholder="One or two lines shown under the title."
          className={deskFieldFull}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="icon" className={deskLabel}>
            Icon
          </label>
          {/* The shared listbox, not a native <select>: the OS draws a
              native dropdown's list itself and no stylesheet reaches it, so
              it arrives in system chrome next to every other desk control.
              Same `name`, submitted through the hidden input Select owns. */}
          <Select
            id="icon"
            name="icon"
            defaultValue={service?.icon ?? ""}
            options={[
              { value: "", label: "No icon" },
              ...SERVICE_ICON_KEYS.map((key) => ({
                value: key,
                label: SERVICE_ICON_LABELS[key],
              })),
            ]}
          />
          <ul className="mt-2 flex flex-wrap gap-4 text-muted">
            {SERVICE_ICON_KEYS.map((key) => (
              <li key={key} title={key} className="flex items-center">
                {SERVICE_ICONS[key]}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="href" className={deskLabel}>
            Link <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="href"
            name="href"
            type="text"
            maxLength={300}
            defaultValue={service?.href ?? ""}
            placeholder="/contact or https://"
            className={deskFieldFull}
          />
          <p className="text-[11.5px] text-muted">
            Must start with / or https:// — anything else is ignored.
          </p>
        </div>
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
            defaultValue={service?.sortOrder ?? 0}
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
            defaultChecked={service?.isPublished ?? true}
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
          {isPending ? "Saving..." : isEditing ? "Save service" : "Add service"}
        </button>
        {state.error && (
          <p role="alert" className="text-[12px] text-error">{state.error}</p>
        )}
      </div>
    </form>
  );
}
