"use client";

import { useId, useState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD } from "@/components/form-classes";
import {
  CHARGE_BASES,
  CHARGE_TYPES,
  withEmptyOption,
  type Charge,
} from "@/lib/attributes";

/**
 * Repeatable charge rows for CFF group 6 — the sibling of ExtrasEditor, and
 * the same bargain: the whole list goes out as one hidden `chargesJson`
 * field so the server action parses a single value instead of N indexed
 * ones, and rows without a charge type are dropped on save.
 *
 * Every row carries a BASIS as well as an amount, because the same number
 * means three different things depending on it. Rs 50,000 lump sum is
 * Rs 50,000. Rs 50 per sq.ft on a 2,000 sq.ft flat is Rs 1,00,000. 5% of
 * the demand price moves every time the price does. Storing an amount
 * without its basis would make every total derived from it a guess, and the
 * total in question is the one a client gets quoted on the phone.
 *
 * `isIncludedInDemand` exists so the all-in total does not double-count.
 * Brokers routinely quote a demand price that already has maintenance, PLC
 * or club charges folded into it; without a flag saying so, the all-in
 * would add that money a second time and hand the client a figure nobody
 * has ever asked for. allInPrice() skips these rows rather than adding them.
 */

/** One live form row. */
type Row = {
  /**
   * Stable identity for the React key. Index keys are fine in ExtrasEditor
   * because every input there is controlled, but the two Selects here are
   * UNCONTROLLED — each keeps its displayed value in its own useState seeded
   * from defaultValue. Under an index key, removing a middle row would leave
   * those Selects mounted and hand their state to whichever row shifted up,
   * so the list would silently re-label its own charges.
   */
  uid: number;
  chargeType: string;
  /**
   * The raw string the broker typed, not a number. Number-typed state turns
   * a cleared box into 0, so backspacing the last digit would leave a real
   * Rs 0 charge on the row instead of an empty one. Converted once, at
   * serialise time.
   */
  amount: string;
  basis: string;
  isIncludedInDemand: boolean;
};

const TYPE_OPTIONS = withEmptyOption("— Select a charge —", CHARGE_TYPES);
const BASIS_OPTIONS = CHARGE_BASES.map((b) => ({ value: b.value, label: b.label }));

/**
 * What the amount box is asking for, which is not the same question for all
 * three bases. A placeholder rather than a fourth control in the row: at
 * 360px the row is already four stacked fields.
 */
const AMOUNT_PLACEHOLDER: Record<string, string> = {
  lump_sum: "Amount in Rs",
  per_sqft: "Rs per sq.ft",
  percent: "% of demand price",
};

// ponytail: module counter, not crypto.randomUUID() — these ids never leave
// the component and never reach the DB, they only have to be distinct
// within one mounted list.
let lastUid = 0;

const blankRow = (): Row => ({
  uid: (lastUid += 1),
  chargeType: "",
  amount: "",
  basis: "lump_sum",
  isIncludedInDemand: false,
});

/** The checkbox shape ChecklistField already uses across the admin. */
const CHECKBOX =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-white transition-colors checked:border-gold checked:bg-gold";

export function ChargesEditor({
  initial,
  onChange,
}: {
  initial: Charge[];
  /**
   * Optional live echo of the parsed list. PriceSection shows an all-in
   * total beside these rows, and a money figure that lags the row a broker
   * just typed is worse than no figure at all. The other sections get away
   * with reading their initial value only because their counts are progress
   * hints — this one is a number someone quotes out loud.
   */
  onChange?: (charges: Charge[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.length ? initial.map(toRow) : [blankRow()]
  );
  const baseId = useId();

  /**
   * Single write path, so the parent echo can never drift from the hidden
   * input. Notifying from the handler rather than a useEffect keeps this a
   * plain event -> state -> callback flow with nothing to re-sync.
   */
  function commit(next: Row[]) {
    setRows(next);
    onChange?.(toCharges(next));
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="hidden"
        name="chargesJson"
        value={JSON.stringify(toCharges(rows))}
      />

      {rows.map((row, i) => {
        const typeId = `${baseId}-${row.uid}-type`;
        const basisId = `${baseId}-${row.uid}-basis`;

        return (
          <div
            key={row.uid}
            className="flex flex-col gap-3 border border-border bg-white p-3"
          >
            {/* Stacked on a phone, one line from sm up. Four controls side by
                side at 360px would leave every one of them unreadable. */}
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                {/* Select takes no aria-label prop and the row carries no
                    visible field label to borrow, so the combobox gets its
                    accessible name from an sr-only label — the same fix
                    AreaSection uses for its unit selects. */}
                <label htmlFor={typeId} className="sr-only">
                  Charge {i + 1} type
                </label>
                <Select
                  id={typeId}
                  name={typeId}
                  defaultValue={row.chargeType}
                  onValueChange={(chargeType) =>
                    commit(rows.map((r, j) => (j === i ? { ...r, chargeType } : r)))
                  }
                  options={TYPE_OPTIONS}
                  className="sm:w-52 sm:shrink-0"
                />

                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={row.amount}
                  onChange={(e) =>
                    commit(
                      rows.map((r, j) =>
                        j === i ? { ...r, amount: e.target.value } : r
                      )
                    )
                  }
                  placeholder={AMOUNT_PLACEHOLDER[row.basis] ?? "Amount in Rs"}
                  aria-label={`Charge ${i + 1} amount`}
                  className={`${FIELD} min-w-0 flex-1`}
                />

                <label htmlFor={basisId} className="sr-only">
                  Charge {i + 1} basis
                </label>
                <Select
                  id={basisId}
                  name={basisId}
                  defaultValue={row.basis}
                  onValueChange={(basis) =>
                    commit(rows.map((r, j) => (j === i ? { ...r, basis } : r)))
                  }
                  options={BASIS_OPTIONS}
                  className="sm:w-48 sm:shrink-0"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  commit(
                    rows.length === 1
                      ? [blankRow()]
                      : rows.filter((_, j) => j !== i)
                  )
                }
                aria-label={`Remove charge ${i + 1}`}
                className="cursor-pointer self-start px-1.5 py-2 text-error hover:opacity-70"
              >
                ✕
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 font-sans text-meta text-ink">
              <input
                type="checkbox"
                checked={row.isIncludedInDemand}
                onChange={(e) =>
                  commit(
                    rows.map((r, j) =>
                      j === i ? { ...r, isIncludedInDemand: e.target.checked } : r
                    )
                  )
                }
                className={CHECKBOX}
              />
              Already included in the demand price
            </label>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => commit([...rows, blankRow()])}
        className="w-fit cursor-pointer border border-border bg-white px-4 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
      >
        + Add another charge
      </button>
    </div>
  );
}

/** A saved charge, back as the strings the inputs hold. */
function toRow(charge: Charge): Row {
  return {
    uid: (lastUid += 1),
    chargeType: charge.chargeType,
    amount: String(charge.amount),
    basis: charge.basis,
    isIncludedInDemand: charge.isIncludedInDemand,
  };
}

/**
 * Rows as the server and allInPrice() want them. Rows with no charge type
 * are dropped — the same rule ExtrasEditor applies to rows with no title,
 * and it is what lets the list always keep one empty row to type into.
 *
 * Amounts land as whole rupees: the column is an integer, and a charge
 * quoted to the paisa is a precision nobody in this market uses. A blank or
 * unparseable box becomes 0 rather than NaN, which would otherwise poison
 * every total downstream of it.
 */
function toCharges(rows: Row[]): Charge[] {
  return rows
    .filter((row) => row.chargeType.trim() !== "")
    .map((row) => ({
      chargeType: row.chargeType,
      amount: Math.max(0, Math.round(Number(row.amount) || 0)),
      basis: row.basis,
      isIncludedInDemand: row.isIncludedInDemand,
    }));
}
