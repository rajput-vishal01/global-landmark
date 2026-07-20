"use client";

import { useState } from "react";
import { SUGGESTED_AMENITIES } from "@/lib/attributes";

/**
 * Amenity checkboxes from the suggested list, plus free-typed custom
 * amenities for anything not covered. Emits the combined list as a hidden
 * amenitiesJson field.
 */
export function AmenitiesField({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [custom, setCustom] = useState("");

  const customOnly = selected.filter(
    (a) => !SUGGESTED_AMENITIES.includes(a as (typeof SUGGESTED_AMENITIES)[number])
  );

  function toggle(amenity: string) {
    setSelected((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  }

  function addCustom() {
    const value = custom.trim();
    if (!value || selected.includes(value)) return;
    setSelected((prev) => [...prev, value]);
    setCustom("");
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="amenitiesJson" value={JSON.stringify(selected)} />

      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
        {SUGGESTED_AMENITIES.map((amenity) => (
          <label
            key={amenity}
            className="flex cursor-pointer items-center gap-2.5 font-sans text-meta text-ink"
          >
            <input
              type="checkbox"
              checked={selected.includes(amenity)}
              onChange={() => toggle(amenity)}
              className="h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-white transition-colors checked:border-gold checked:bg-gold"
            />
            {amenity}
          </label>
        ))}
      </div>

      {customOnly.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customOnly.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-2 border border-border bg-white px-3 py-1.5 font-sans text-meta text-ink"
            >
              {amenity}
              <button
                type="button"
                onClick={() => toggle(amenity)}
                aria-label={`Remove ${amenity}`}
                className="cursor-pointer text-[#9a2b2b] hover:opacity-70"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          maxLength={100}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add an amenity not listed above"
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
    </div>
  );
}
