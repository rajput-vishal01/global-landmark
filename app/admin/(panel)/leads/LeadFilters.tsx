import Link from "next/link";
import { LEAD_STATUSES } from "@/lib/taxonomy/leads";
import { FIELD } from "@/components/form-classes";

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

const LABEL_CLS =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";
const CONTROL = `${FIELD} min-h-11`;

function FilterSelect({
  name,
  label,
  anyLabel,
  options,
  value,
}: {
  name: string;
  label: string;
  anyLabel: string;
  options: readonly string[];
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL_CLS}>{label}</span>
      <span className="relative block">
        <select name={name} defaultValue={value} className={`${CONTROL} pr-6`}>
          <option value="">{anyLabel}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          width="11"
          height="7"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </span>
    </label>
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
  return (
    <form
      method="get"
      action="/admin/leads"
      className="flex flex-col gap-5 border border-border bg-white p-4 sm:p-5"
    >
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLS}>Search</span>
        <input
          type="search"
          name="q"
          defaultValue={values.q}
          placeholder="Name, email, phone or interest"
          className={CONTROL}
        />
      </label>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <FilterSelect
          name="status"
          label="Status"
          anyLabel="Any status"
          options={LEAD_STATUSES}
          value={values.status}
        />
        <FilterSelect
          name="source"
          label="Source"
          anyLabel="Any source"
          options={sources}
          value={values.source}
        />
        <FilterSelect
          name="assignedTo"
          label="Assigned to"
          anyLabel="Anyone"
          options={agents}
          value={values.assignedTo}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          className="bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Apply
        </button>
        {isFiltered && (
          <Link
            href="/admin/leads"
            className="text-meta font-sans text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-gold"
          >
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}
