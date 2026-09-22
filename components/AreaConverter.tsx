"use client";

import { useState } from "react";
import { AREA_UNITS, convertArea, formatArea, type AreaUnit } from "@/lib/taxonomy/area";

// R-40: sq.ft / sq.yd / marla / kanal / acre only — biswa and bigha stay
// out (regional convention, see area.ts) since this widget is a quick
// visitor-facing toggle, not the full CFF unit list.
const CONVERTER_UNITS: { value: AreaUnit; label: string }[] = AREA_UNITS.filter(
  (u) => u.value !== "biswa" && u.value !== "bigha"
);

/** Inline area-unit converter for the property detail Area block (R-40). */
export function AreaConverter({ value, unit }: { value: number; unit: AreaUnit }) {
  const [selected, setSelected] = useState<AreaUnit>(unit);
  const converted = convertArea(value, unit, selected);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap gap-x-4" role="group" aria-label="Convert area to">
        {CONVERTER_UNITS.map((u) => {
          const isActive = u.value === selected;
          return (
            <button
              key={u.value}
              type="button"
              onClick={() => setSelected(u.value)}
              aria-pressed={isActive}
              className={`text-eyebrow relative py-2 font-sans font-medium uppercase tracking-[0.12em] transition-colors duration-300 ${
                isActive ? "text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {u.label}
              <span
                aria-hidden
                className={`absolute bottom-1 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 ease-out ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>
      {converted != null && (
        <p className="mt-2 font-sans text-meta text-ink">
          {formatArea(Math.round(converted * 100) / 100, selected)}
        </p>
      )}
    </div>
  );
}
