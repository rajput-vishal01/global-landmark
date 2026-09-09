"use client";

import Link from "next/link";
import { LEAD_STATUSES } from "@/lib/taxonomy/leads";
import { Select } from "@/components/ui/Select";
import { Card, deskField, deskLinkButton } from "@/components/admin/desk";
import { useAutoSubmit } from "@/components/admin/use-auto-submit";

/**
 * GET form, URL as state — same reasoning as PropertyFilters: survives
 * refresh/back button, works before JS loads, a filtered link is shareable.
 *
 * Source and assigned-agent options are passed in rather than hardcoded:
 * `source` is free text set by whichever public surface wrote the lead
 * (contact form, WhatsApp modal, enquiry cart, ...) and there is no fixed
 * agent roster yet (no `users` table — R-54/Phase 6), so both lists are the
 * distinct values actually present in `leads` today.
 */
export type LeadFilterValues = {
  q: string;
  status: string;
  source: string;
  assignedTo: string;
};

/** 44px tap target on a phone, desk density from `sm` — same as PropertyFilters. */
const CONTROL = `${deskField} w-full min-h-11 sm:min-h-0`;

/**
 * `Select` rather than a native `<select>`: the OS draws a native dropdown's
 * list itself and no stylesheet reaches it. Same `name`, same option `value`s,
 * submitted through the hidden input Select owns — the query string is
 * unchanged.
 *
 * The label is a real `<label htmlFor>`: `Select` renders a `<button
 * role="combobox">`, which is a labelable element, so the association holds.
 */
function FilterSelect({
  name,
  label,
  anyLabel,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  anyLabel: string;
  options: readonly string[];
  value: string;
  onChange: () => void;
}) {
  // Same shape the native <select> had: the "any" row first, value "".
  const items = [
    { value: "", label: anyLabel },
    ...options.map((o) => ({ value: o, label: o })),
  ];
  const id = `lead-filter-${name}`;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="desk-eyebrow">
        {label}
      </label>
      <Select id={id} name={name} options={items} defaultValue={value} onValueChange={onChange} />
    </div>
  );
}

export function LeadFilters({
  values,
  sources,
  agents,
  isFiltered,
}: {
  values: LeadFilterValues;
  sources: string[];
  agents: string[];
  isFiltered: boolean;
}) {
  const { formRef, submitNow, submitSoon } = useAutoSubmit();

  return (
    <Card>
      <form ref={formRef} method="get" action="/admin/leads" className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label htmlFor="lead-filter-q" className="desk-eyebrow">
            Search
          </label>
          <input
            id="lead-filter-q"
            type="search"
            name="q"
            defaultValue={values.q}
            placeholder="Name, email, phone or interest"
            className={CONTROL}
            onChange={submitSoon}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
          <FilterSelect
            name="status"
            label="Status"
            anyLabel="Any status"
            options={LEAD_STATUSES}
            value={values.status}
            onChange={submitNow}
          />
          <FilterSelect
            name="source"
            label="Source"
            anyLabel="Any source"
            options={sources}
            value={values.source}
            onChange={submitNow}
          />
          <FilterSelect
            name="assignedTo"
            label="Assigned to"
            anyLabel="Anyone"
            options={agents}
            value={values.assignedTo}
            onChange={submitNow}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* No Apply button: the form submits itself. This stays so that
              pressing Enter in the search box still works, and so the
              filters are not dead before the JavaScript loads. */}
          <button type="submit" className="sr-only">
            Apply filters
          </button>
          {isFiltered && (
            <Link href="/admin/leads" className={deskLinkButton}>
              Clear filters
            </Link>
          )}
        </div>
      </form>
    </Card>
  );
}
