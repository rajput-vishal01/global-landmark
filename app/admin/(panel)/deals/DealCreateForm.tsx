"use client";

import { LABEL } from "@/components/admin/form-classes";
import { useActionState, useState } from "react";
import { createDeal, type DealFormState } from "./actions";

const initialState: DealFormState = {};

export type DealPickerItem = {
  id: number;
  title: string;
  kind: "project" | "unit";
  location: string;
};

/**
 * Deal scheduler with a searchable picker over everything already in the
 * system — properties and projects — so the admin selects instead of
 * re-entering details.
 */
export function DealCreateForm({ items }: { items: DealPickerItem[] }) {
  const [state, formAction, isPending] = useActionState(createDeal, initialState);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const q = query.trim().toLowerCase();
  const matches = q
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
      )
    : items;
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <form action={formAction} className="flex flex-col gap-5 border border-border bg-white p-4">
      <div className="flex flex-col gap-2">
        <span className={LABEL}>Property or project</span>
        <input type="hidden" name="propertyId" value={selectedId ?? ""} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything already added..."
          aria-label="Search properties and projects"
          className="w-full appearance-none rounded-none border-b border-border bg-transparent py-2.5 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <ul className="max-h-56 overflow-y-auto border border-border">
          {matches.length === 0 ? (
            <li className="px-4 py-3 font-sans text-meta text-ink-muted">
              Nothing matches. Add it under Properties first.
            </li>
          ) : (
            matches.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors duration-150 ${
                      isSelected ? "bg-cream" : "bg-white hover:bg-cream/60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block truncate font-sans text-meta ${isSelected ? "font-medium text-gold-deep" : "text-ink"}`}>
                        {item.title}
                      </span>
                      <span className="block truncate font-sans text-[0.75rem] text-ink-muted">
                        {item.location}
                      </span>
                    </span>
                    <span className="text-eyebrow shrink-0 bg-ink/5 px-2 py-1 font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                      {item.kind === "project" ? "Project" : "Property"}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        {selected && (
          <p className="font-sans text-meta text-ink-muted">
            Selected: <span className="text-gold-deep">{selected.title}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {/* ponytail: native date inputs — a picker lib adds nothing here */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startsAt" className={LABEL}>Starts</label>
          <input id="startsAt" name="startsAt" type="date" required
            className="border-b border-border bg-transparent py-2 font-sans text-body text-ink focus:border-gold focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endsAt" className={LABEL}>Ends</label>
          <input id="endsAt" name="endsAt" type="date" required
            className="border-b border-border bg-transparent py-2 font-sans text-body text-ink focus:border-gold focus:outline-none" />
        </div>
        <button
          type="submit"
          disabled={isPending || selectedId === null}
          className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Scheduling..." : "Schedule deal"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-meta font-sans text-[#9a2b2b]">{state.error}</p>
      )}
    </form>
  );
}
