"use client";

import { useActionForm } from "@/lib/use-action-form";
import type { CrmClient } from "@/lib/db/schema";
import { LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { PROPERTY_TYPES } from "@/lib/attributes";
import { CITY_NAMES } from "@/lib/locations";
import { ChecklistField } from "@/components/admin/ChecklistField";
import { cardChrome, deskButtonPrimary, deskField } from "@/components/admin/desk";
import type { ClientFormState } from "@/app/admin/(panel)/crm/client-actions";

type Action = (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;

const initialState: ClientFormState = {};

/** Desk field chrome plus the full width every field in this form wants. */
const FIELD = `${deskField} w-full`;

/** Create + edit client profile form (R-30) — reused as the always-editable
 * profile section on the client detail page. */
export function ClientForm({ client, action }: { client?: CrmClient; action: Action }) {
  const { state, isPending, formProps } = useActionForm(action, initialState);
  const isEditing = Boolean(client);

  return (
    <form {...formProps} className={`${cardChrome} flex flex-col gap-6 p-5`}>
      {client && <input type="hidden" name="id" value={client.id} />}

      <div className="grid gap-6 sm:grid-cols-3">
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
            defaultValue={client?.name}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={LABEL}>
            Phone <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={client?.phone ?? ""}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={LABEL}>
            Email <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={200}
            defaultValue={client?.email ?? ""}
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="requirementNotes" className={LABEL}>
          Requirement notes <span className="normal-case text-muted">(optional)</span>
        </label>
        <textarea
          id="requirementNotes"
          name="requirementNotes"
          rows={4}
          maxLength={4000}
          defaultValue={client?.requirementNotes ?? ""}
          placeholder="What they're looking for, timelines, constraints..."
          className={FIELD}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="budgetMin" className={LABEL}>
            Budget min (₹) <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="budgetMin"
            name="budgetMin"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={client?.budgetMin ?? ""}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="budgetMax" className={LABEL}>
            Budget max (₹) <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="budgetMax"
            name="budgetMax"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={client?.budgetMax ?? ""}
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL}>
          Preferred locations <span className="normal-case text-muted">(optional)</span>
        </label>
        <ChecklistField
          name="preferredLocationsJson"
          options={CITY_NAMES}
          initial={client?.preferredLocations ?? []}
          allowCustom
          customPlaceholder="Add a locality"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL}>
          Preferred types <span className="normal-case text-muted">(optional)</span>
        </label>
        <ChecklistField
          name="preferredTypesJson"
          options={PROPERTY_TYPES}
          initial={client?.preferredTypes ?? []}
          allowCustom
        />
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={isPending} className={`${deskButtonPrimary} disabled:cursor-wait disabled:opacity-60`}>
          {isPending ? "Saving..." : isEditing ? "Save client" : "Add client"}
        </button>
        {state.error && (
          <p role="alert" className="text-[13px] text-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
