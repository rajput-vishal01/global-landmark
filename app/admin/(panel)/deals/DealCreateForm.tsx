"use client";

import { useActionForm } from "@/lib/use-action-form";
import { FIELD, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { useState } from "react";
import { createDeal, type DealFormState } from "./actions";
import { addDays, mondayOf, weekLabel } from "@/lib/week";

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
  const [week, setWeek] = useState(defaultWeek);
  const [weeks, setWeeks] = useState(1);

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
        {/* ponytail: the native date picker, snapped to the week it lands in
            — <input type="week"> is unsupported in Safari and Firefox, and a
            calendar library for one field is not worth shipping. */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="weekStart" className={LABEL}>Week<Req /></label>
          <input
            id="weekStart"
            name="weekStart"
            type="date"
            required
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="weeks" className={LABEL}>Repeat</label>
          <input
            id="weeks"
            name="weeks"
            type="number"
            min={1}
            max={12}
            value={weeks}
            onChange={(e) => setWeeks(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
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
      {/* Says back what will be saved. Any date works; the week it belongs to
          is what runs, so "Fri the 9th" schedules Mon 5 – Sun 11. */}
      <p className="font-sans text-meta text-ink-muted">
        {week ? (
          <>
            Runs <span className="text-ink">{weekLabel(week)}</span>
            {weeks > 1 && (
              <>
                , then {weeks - 1} more {weeks === 2 ? "week" : "weeks"}, ending{" "}
                <span className="text-ink">{weekLabel(addDays(mondayOf(week), (weeks - 1) * 7))}</span>
              </>
            )}
            .
          </>
        ) : (
          "Pick any day and the whole week it falls in runs, Monday to Sunday."
        )}
      </p>

      {state.error && (
        <p role="alert" className="text-meta font-sans text-error">{state.error}</p>
      )}
    </form>
  );
}
