"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD, LABEL } from "@/components/form-classes";
import { createDeal, type DealFormState } from "@/app/admin/(panel)/crm/deal-actions";

const initialState: DealFormState = {};

/** Create-deal form (R-30). Stage always starts at "Enquiry" — no stage picker on create. */
export function NewDealForm({
  clients,
  properties,
  defaultClientId,
}: {
  clients: { id: number; name: string }[];
  properties: { id: number; title: string; refCode: string | null }[];
  defaultClientId?: number;
}) {
  const [state, formAction, isPending] = useActionState(createDeal, initialState);

  const clientOptions = [
    { value: "", label: "— Select a client —" },
    ...clients.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  const propertyOptions = [
    { value: "", label: "— No property linked yet —" },
    ...properties.map((p) => ({
      value: String(p.id),
      label: p.refCode ? `${p.title} · ${p.refCode}` : p.title,
    })),
  ];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="clientId" className={LABEL}>
            Client
          </label>
          <Select
            id="clientId"
            name="clientId"
            options={clientOptions}
            defaultValue={defaultClientId ? String(defaultClientId) : ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="propertyId" className={LABEL}>
            Property
          </label>
          <Select id="propertyId" name="propertyId" options={propertyOptions} defaultValue="" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="dealValue" className={LABEL}>
            Deal value <span className="normal-case text-ink-muted">(rupees)</span>
          </label>
          <input
            id="dealValue"
            name="dealValue"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="12000000"
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="brokeragePercent" className={LABEL}>
            Brokerage % <span className="normal-case text-ink-muted">(e.g. 2 or 2.5)</span>
          </label>
          <input
            id="brokeragePercent"
            name="brokeragePercent"
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            placeholder="2"
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="sharedWithName" className={LABEL}>
            Shared with <span className="normal-case text-ink-muted">(name, if any)</span>
          </label>
          <input id="sharedWithName" name="sharedWithName" type="text" maxLength={200} className={FIELD} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="sharedAmount" className={LABEL}>
            Shared amount <span className="normal-case text-ink-muted">(rupees)</span>
          </label>
          <input
            id="sharedAmount"
            name="sharedAmount"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="assignedTo" className={LABEL}>
          Assigned to
        </label>
        <input
          id="assignedTo"
          name="assignedTo"
          type="text"
          maxLength={200}
          placeholder="Agent name"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full cursor-pointer bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-fit"
        >
          {isPending ? "Creating..." : "Create deal"}
        </button>
        {state.error && (
          <p role="alert" className="font-sans text-meta text-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
