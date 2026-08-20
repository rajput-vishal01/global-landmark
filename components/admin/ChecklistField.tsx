"use client";

import { useState } from "react";

/**
 * Checkbox list with optional free-typed additions, emitted as a hidden
 * JSON field so the server action parses one value instead of N.
 *
 * Generalised from AmenitiesField, which was hardcoded to one list and one
 * field name. The CFF needs this same widget for amenities, parking, PLC
 * attributes, room flags, documentation, legal flags, loan flags, furnishing
 * inventory and banks on panel — so the options and the field name are props.
 *
 * `allowCustom` is off by default: a checklist validated against a fixed
 * taxonomy (parking types, legal flags) must not accept arbitrary strings,
 * because the server action drops unknown values and the admin would be left
 * wondering where their entry went. Turn it on only where free text genuinely
 * round-trips — amenities and banks on panel.
 */
export function ChecklistField({
  name,
  options,
  initial,
  allowCustom = false,
  customPlaceholder = "Add another",
  columns = 3,
  max = 60,
}: {
  /** Hidden input name, e.g. "amenitiesJson". */
  name: string;
  options: readonly string[];
  initial: string[];
  allowCustom?: boolean;
  customPlaceholder?: string;
  columns?: 2 | 3;
  max?: number;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [custom, setCustom] = useState("");

  // Anything selected that is not in the taxonomy — shown as removable chips
  // so an admin can see and clear values a previous list version allowed.
  const customOnly = selected.filter((v) => !options.includes(v));

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function addCustom() {
    const value = custom.trim();
    if (!value || selected.includes(value) || selected.length >= max) return;
    setSelected((prev) => [...prev, value]);
    setCustom("");
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />

      <div
        className={`grid grid-cols-2 gap-x-6 gap-y-2.5 ${
          columns === 3 ? "sm:grid-cols-3" : ""
        }`}
      >
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2.5 font-sans text-meta text-ink"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-white transition-colors checked:border-gold checked:bg-gold"
            />
            {option}
          </label>
        ))}
      </div>

      {customOnly.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customOnly.map((value) => (
            <span
              key={value}
              className="flex items-center gap-2 border border-border bg-white px-3 py-1.5 font-sans text-meta text-ink"
            >
              {value}
              <button
                type="button"
                onClick={() => toggle(value)}
                aria-label={`Remove ${value}`}
                className="cursor-pointer text-error hover:opacity-70"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {allowCustom && (
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            maxLength={100}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              // Enter must not submit the surrounding form from here.
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder={customPlaceholder}
            className="flex-1 border-b border-border bg-transparent py-2 font-sans text-meta text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustom}
            className="cursor-pointer border border-border bg-white px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
