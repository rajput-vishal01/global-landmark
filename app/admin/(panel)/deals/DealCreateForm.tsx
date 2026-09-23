"use client";

import { useActionForm } from "@/lib/use-action-form";
import { FIELD, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { useState } from "react";
import { createDeal, type DealFormState } from "./actions";
import { addDays, lengthInDays, rangeLabel } from "@/lib/week";

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
export function DealCreateForm({
  items,
  defaultWeek,
}: {
  items: DealPickerItem[];
  /** The first week nothing is booked in — what the broker almost always wants. */
  defaultWeek: string;
}) {
  const { state, isPending, formProps } = useActionForm(createDeal, initialState);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [startsAt, setStartsAt] = useState(defaultWeek);
  // A week is the common case, so the end follows the start until it is set
  // by hand — a sale that runs three days or a fortnight just changes it.
  const [endsAt, setEndsAt] = useState(addDays(defaultWeek, 6));
  const [repeat, setRepeat] = useState(1);
  const valid = Boolean(startsAt && endsAt && endsAt >= startsAt);
  const span = valid ? lengthInDays(startsAt, endsAt) : 0;

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
    <form {...formProps} className="flex flex-col gap-5 border border-border bg-white p-4">
      <div className="flex flex-col gap-2">
        <span className={LABEL}>
          Property or project
          <Req />
        </span>
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
        {/* ponytail: the browser's own date picker. A sale can open on any
            day, so these are two plain dates; the end follows the start by a
            week until it is changed. */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startsAt" className={LABEL}>Starts<Req /></label>
          <input
            id="startsAt"
            name="startsAt"
            type="date"
            required
            value={startsAt}
            onChange={(e) => {
              const next = e.target.value;
              if (next && (!endsAt || endsAt < next)) setEndsAt(addDays(next, 6));
              setStartsAt(next);
            }}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endsAt" className={LABEL}>Ends<Req /></label>
          <input
            id="endsAt"
            name="endsAt"
            type="date"
            required
            min={startsAt || undefined}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="repeat" className={LABEL}>Repeat</label>
          <input
            id="repeat"
            name="repeat"
            type="number"
            min={1}
            max={12}
            value={repeat}
            onChange={(e) => setRepeat(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
            className={`${FIELD} w-24`}
          />
        </div>
        <button
          type="submit"
          disabled={isPending || selectedId === null}
          className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Scheduling..." : "Schedule deal"}
        </button>
      </div>
      {/* Says back exactly what will be saved, repeats included. */}
      <p className="font-sans text-meta text-ink-muted">
        {valid ? (
          <>
            Runs <span className="text-ink">{rangeLabel(startsAt, endsAt)}</span> ({span}{" "}
            {span === 1 ? "day" : "days"})
            {repeat > 1 && (
              <>
                , then {repeat - 1} more of the same length, the last ending{" "}
                <span className="text-ink">{addDays(endsAt, (repeat - 1) * span)}</span>
              </>
            )}
            .
          </>
        ) : (
          "Pick the day the deal opens and the day it closes."
        )}
      </p>

      {state.error && (
        <p role="alert" className="text-meta font-sans text-error">{state.error}</p>
      )}
    </form>
  );
}
