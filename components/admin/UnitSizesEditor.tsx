"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";
import { AREA_UNITS, formatRupees, withEmptyOption } from "@/lib/attributes";

/**
 * The "2 BHK / 1750 sq.ft / ₹3.2 Cr" price list a project page publishes.
 *
 * `configurations` already holds the range as strings ("2-4 BHK") so the
 * filters can match on it; what it cannot hold is an area and a price PER
 * configuration, which is the only part a buyer actually compares. Hence
 * rows rather than a wider properties table.
 *
 * PUBLIC, unlike the demand price. The figure here is the advertised
 * starting price for a unit type — the sort of number that goes in a
 * newspaper ad — so there is no per-row publish flag: the negotiated demand
 * price stays on `properties` behind `showPricePublicly`, and these two
 * numbers are not the same number.
 */

type UnitSizeInput = {
  unitLabel?: string | null;
  areaValue?: number | null;
  areaUnit?: string | null;
  price?: number | null;
};

/**
 * `id` is client-side only, the same pattern as OwnersEditor: each row owns
 * an uncontrolled <Select>, so keying by array index would leave a deleted
 * row's Select instance mounted and showing the wrong unit.
 */
type UnitSizeRow = {
  id: number;
  unitLabel: string;
  areaValue: string;
  areaUnit: string;
  price: string;
};

/** Mirrors the 30-row cap parseUnitSizes() enforces. */
const MAX_ROWS = 30;

function toRow(input: UnitSizeInput, id: number): UnitSizeRow {
  return {
    id,
    unitLabel: input.unitLabel ?? "",
    areaValue: input.areaValue == null ? "" : String(input.areaValue),
    areaUnit: input.areaUnit ?? "sqft",
    price: input.price == null ? "" : String(input.price),
  };
}

/** "" must mean unanswered, not zero — Number("") is 0, which would lie. */
function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function toPayload(row: UnitSizeRow) {
  return {
    unitLabel: row.unitLabel,
    areaValue: toNumber(row.areaValue),
    areaUnit: row.areaUnit,
    price: toNumber(row.price),
  };
}

export function UnitSizesEditor({ initial }: { initial: UnitSizeInput[] }) {
  const [rows, setRows] = useState<UnitSizeRow[]>(() =>
    (initial.length ? initial : [{}]).map(toRow)
  );
  const nextId = useRef(rows.length);

  function update(id: number, patch: Partial<UnitSizeRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function remove(id: number) {
    setRows((prev) =>
      prev.length === 1
        ? [toRow({}, nextId.current++)]
        : prev.filter((row) => row.id !== id)
    );
  }

  // A row is "filled" once it has a label — that is also the row the server
  // keeps, so the count matches what actually saves.
  const filled = countFilled(rows.map((row) => row.unitLabel));

  return (
    <FormSection
      title="Unit sizes"
      hint="The public Unit / Area / Price table on the property page"
      filled={filled}
      total={rows.length}
    >
      <input
        type="hidden"
        name="unitSizesJson"
        value={JSON.stringify(
          rows.filter((row) => row.unitLabel.trim()).map(toPayload)
        )}
      />

      <p className="font-sans text-meta text-ink-muted">
        Published as written. This is the advertised starting price per unit
        type, not the demand price on this listing — that one stays behind the
        price section&apos;s own publish toggle.
      </p>

      {rows.map((row, i) => (
        <div
          key={row.id}
          className="flex flex-col gap-4 border border-border bg-white p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
              Unit {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(row.id)}
              aria-label={`Remove unit size ${i + 1}`}
              className="cursor-pointer px-1.5 py-1 text-error hover:opacity-70"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`unit-${row.id}-label`} className={LABEL}>
                Unit
              </label>
              <input
                id={`unit-${row.id}-label`}
                type="text"
                maxLength={60}
                value={row.unitLabel}
                onChange={(e) => update(row.id, { unitLabel: e.target.value })}
                placeholder="3 + S BHK"
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`unit-${row.id}-price`} className={LABEL}>
                Price
              </label>
              <input
                id={`unit-${row.id}-price`}
                type="number"
                min={0}
                inputMode="numeric"
                value={row.price}
                onChange={(e) => update(row.id, { price: e.target.value })}
                placeholder="32000000"
                className={FIELD}
              />
              {/* Rupees are entered in full — the readout is what catches a
                  stray zero before it reaches the public page. */}
              <p className="font-sans text-meta text-ink-muted">
                {toNumber(row.price) != null
                  ? formatRupees(toNumber(row.price) as number)
                  : "Blank shows “On request” on the public table."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`unit-${row.id}-area`} className={LABEL}>
                Area
              </label>
              <input
                id={`unit-${row.id}-area`}
                type="number"
                min={0}
                inputMode="numeric"
                value={row.areaValue}
                onChange={(e) => update(row.id, { areaValue: e.target.value })}
                placeholder="1750"
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`unit-${row.id}-unit`} className={LABEL}>
                Area unit
              </label>
              <Select
                id={`unit-${row.id}-unit`}
                name={`unitSizes.${row.id}.areaUnit`}
                defaultValue={row.areaUnit}
                onValueChange={(value) => update(row.id, { areaUnit: value })}
                options={withEmptyOption(
                  "Not set",
                  AREA_UNITS.map((u) => u.value)
                )}
              />
            </div>
          </div>
        </div>
      ))}

      {rows.length < MAX_ROWS && (
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, toRow({}, nextId.current++)])}
          className="w-fit cursor-pointer border border-border bg-white px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
        >
          + Add another unit
        </button>
      )}

      <p className="font-sans text-meta text-ink-muted">
        Rows without a unit label are discarded on save.
      </p>
    </FormSection>
  );
}
