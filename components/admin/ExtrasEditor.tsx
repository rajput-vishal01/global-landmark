"use client";

import { useState } from "react";

type Extra = { title: string; description: string };

/**
 * Free-form attribute rows — editable title AND description — for anything
 * the fixed fields and filters don't cover. Emits a hidden extrasJson field;
 * rows without a title are dropped on save.
 */
export function ExtrasEditor({ initial }: { initial: Extra[] }) {
  const [rows, setRows] = useState<Extra[]>(
    initial.length ? initial : [{ title: "", description: "" }]
  );

  function update(index: number, patch: Partial<Extra>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="hidden"
        name="extrasJson"
        value={JSON.stringify(rows.filter((row) => row.title.trim()))}
      />

      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border border-border bg-white p-3 sm:flex-row sm:items-start"
        >
          <input
            type="text"
            value={row.title}
            maxLength={120}
            onChange={(e) => update(i, { title: e.target.value })}
            placeholder="Title (e.g. Road Width)"
            aria-label={`Additional detail ${i + 1} title`}
            className="border-b border-border bg-transparent py-2 font-sans text-meta text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none sm:w-56 sm:shrink-0"
          />
          <input
            type="text"
            value={row.description}
            maxLength={1000}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Description (e.g. 40 ft, double entry)"
            aria-label={`Additional detail ${i + 1} description`}
            className="min-w-0 flex-1 border-b border-border bg-transparent py-2 font-sans text-meta text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={() =>
              setRows((prev) =>
                prev.length === 1
                  ? [{ title: "", description: "" }]
                  : prev.filter((_, j) => j !== i)
              )
            }
            aria-label={`Remove additional detail ${i + 1}`}
            className="cursor-pointer self-start px-1.5 py-2 text-[#9a2b2b] hover:opacity-70"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { title: "", description: "" }])}
        className="w-fit cursor-pointer border border-border bg-white px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
      >
        + Add another detail
      </button>
    </div>
  );
}
