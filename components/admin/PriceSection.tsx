"use client";

import { useState } from "react";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";
import { ChargesEditor } from "./ChargesEditor";
import {
  allInPrice,
  formatIndianShort,
  formatRupees,
  type Charge,
} from "@/lib/attributes";

/**
 * CFF group 6 — Price and charges.
 *
 * Two things in this section behave unlike anything else on the form. The
 * first is `showPricePublicly`, which decides whether a real number or the
 * words "Price on request" reach the public site. The second is
 * `circleRate`, which is internal and has no public path at all. Both are
 * called out in the UI rather than left to be inferred from a field name,
 * because a broker filling this in at a site visit is the last person who
 * gets to decide what a client sees.
 */

/** The checkbox shape ChecklistField already uses across the admin. */
const CHECKBOX =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-white transition-colors checked:border-gold checked:bg-gold";

export function PriceSection({
  demandPrice: initialDemandPrice,
  perSqftRate: initialPerSqftRate,
  isNegotiable: initialIsNegotiable,
  showPricePublicly: initialShowPricePublicly,
  charges: initialCharges,
  areaSqft,
  circleRate: initialCircleRate,
}: {
  demandPrice?: number | null;
  perSqftRate?: number | null;
  isNegotiable?: boolean | null;
  showPricePublicly?: boolean | null;
  charges?: Charge[] | null;
  /** Normalised area, for resolving per-sq.ft charges into a total. */
  areaSqft?: number | null;
  /** INTERNAL. Lives on property_internal, never on properties. */
  circleRate?: number | null;
}) {
  const [demandPrice, setDemandPrice] = useState(numberField(initialDemandPrice));
  const [perSqftRate, setPerSqftRate] = useState(numberField(initialPerSqftRate));
  const [circleRate, setCircleRate] = useState(numberField(initialCircleRate));
  const [isNegotiable, setIsNegotiable] = useState(initialIsNegotiable ?? false);
  /**
   * Default OFF, and deliberately not `?? true`. A listing whose price
   * publication was never considered must fall on the side of withholding —
   * a price published by accident cannot be unpublished from the client who
   * already read it.
   */
  const [showPricePublicly, setShowPricePublicly] = useState(
    initialShowPricePublicly ?? false
  );
  /**
   * Mirrored from ChargesEditor so the all-in below updates as rows are
   * typed. ChargesEditor still owns the rows and still emits chargesJson —
   * this copy only feeds the readout.
   */
  const [charges, setCharges] = useState<Charge[]>(initialCharges ?? []);

  const demandValue = toAmount(demandPrice);
  const allIn = allInPrice(demandValue, charges, areaSqft ?? null);

  /**
   * A per-sq.ft charge with no area to multiply resolves to zero inside
   * allInPrice, silently. On a money screen that is the dangerous kind of
   * wrong — the total looks complete and is short by a lakh — so it gets
   * said out loud instead.
   */
  const missingArea =
    areaSqft == null &&
    charges.some((c) => !c.isIncludedInDemand && c.basis === "per_sqft");

  const filled = countFilled([demandPrice, perSqftRate, charges, circleRate]);

  return (
    <FormSection
      title="Price and charges"
      hint="The exact price is published only if you tick it below"
      filled={filled}
      total={4}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="demandPrice" className={LABEL}>
            Demand price{" "}
            <span className="normal-case text-ink-muted">(rupees)</span>
          </label>
          <input
            id="demandPrice"
            name="demandPrice"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={demandPrice}
            onChange={(e) => setDemandPrice(e.target.value)}
            className={FIELD}
          />
          {/* Live lakh/crore echo of what was actually typed. The failure it
              prevents is concrete and common: a demand price entered in
              rupees is eight or nine digits long, and one keystroke too many
              or too few turns Rs 1.2 Cr into Rs 12 Cr or Rs 12 Lakh. Neither
              misreads as wrong in a box full of zeros, but both read as
              obviously wrong here, before the listing goes out. */}
          <p
            className={`font-sans text-meta ${
              demandValue == null ? "text-ink-muted" : "text-gold-deep"
            }`}
          >
            {demandValue == null
              ? "Enter the full figure in rupees — 12000000, not 1.2."
              : `Reads as ${formatIndianShort(demandValue)}`}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="perSqftRate" className={LABEL}>
            Rate{" "}
            <span className="normal-case text-ink-muted">(rupees per sq.ft)</span>
          </label>
          <input
            id="perSqftRate"
            name="perSqftRate"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={perSqftRate}
            onChange={(e) => setPerSqftRate(e.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      {/* An unticked checkbox submits NOTHING — the browser omits the field
          entirely rather than sending false. On an edit form that reads the
          existing row, a missing field means "unchanged", so unticking would
          silently leave the old true in place and the change would appear to
          have been ignored. The hidden false below guarantees the field is
          always present; because it sits BEFORE the checkbox, the checkbox
          value comes second, so the server must read the LAST value for the
          name (getAll(name).at(-1)) — get() returns the first and would
          always see false. */}
      <div className="flex flex-col gap-2">
        <input type="hidden" name="isNegotiable" value="false" />
        <label className="flex cursor-pointer items-center gap-2.5 font-sans text-body text-ink">
          <input
            type="checkbox"
            name="isNegotiable"
            value="true"
            checked={isNegotiable}
            onChange={(e) => setIsNegotiable(e.target.checked)}
            className={CHECKBOX}
          />
          Price is negotiable
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <span className={LABEL}>Other charges</span>
        <ChargesEditor initial={initialCharges ?? []} onChange={setCharges} />

        <div className="flex flex-col gap-1 border border-border bg-cream px-4 py-3">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
            All-in total
          </span>
          <span className="font-sans text-body tabular-nums text-ink">
            {allIn == null ? "—" : formatRupees(allIn)}
          </span>
          <span className="font-sans text-meta text-ink-muted">
            {allIn == null
              ? "An all-in total needs a demand price to build on. Enter one above and this fills in."
              : `${formatIndianShort(allIn)} — demand price plus every charge not already included in it.`}
          </span>
          {missingArea && (
            <span className="font-sans text-meta text-error">
              A per-sq.ft charge is counting as zero because this listing has
              no area yet. Fill in the Area section for a true total.
            </span>
          )}
        </div>
      </div>

      {/* The highest-consequence control on this section. Same hidden-false
          pairing as above, and it matters most here: a stuck true would keep
          publishing a price the client asked to hide, and neither the broker
          nor the client would see anything in the admin to explain it.

          What the flag actually does: the price is resolved server-side in
          SQL — the public query selects the figure only when this column is
          true — so an unpublished price is never serialised into the page
          and never reaches the browser at all. It is not a CSS hide, and it
          does not sit in a payload waiting to be read out of devtools. */}
      <div className="flex flex-col gap-2 border border-border bg-white p-4">
        <input type="hidden" name="showPricePublicly" value="false" />
        <label className="flex cursor-pointer items-start gap-2.5 font-sans text-body text-ink">
          <input
            type="checkbox"
            name="showPricePublicly"
            value="true"
            checked={showPricePublicly}
            onChange={(e) => setShowPricePublicly(e.target.checked)}
            className={`${CHECKBOX} mt-1`}
          />
          Show the exact price on the public site
        </label>
        <p
          className={`font-sans text-meta ${
            showPricePublicly ? "text-gold-deep" : "text-ink-muted"
          }`}
        >
          {showPricePublicly
            ? `On — the public listing shows ${
                demandValue == null ? "the demand price" : formatIndianShort(demandValue)
              } to anyone who opens it.`
            : "Off — the public listing shows “Price on request”. The figure stays in the admin and buyers have to enquire."}
        </p>
      </div>

      {/* Circle rate is the government's minimum valuation, and it is what a
          negotiation is argued against. It is not a listing detail and it is
          never published — which is why it lives on the property_internal
          table rather than on properties. That split is the actual
          protection: no public query joins that table, so there is no
          SELECT anywhere on the site that could return this column, whatever
          a future component asks for. Kept in its own block so it never
          reads as one more field in the price list above. */}
      <div className="flex flex-col gap-2 border border-border bg-cream p-4">
        <label htmlFor="circleRate" className={LABEL}>
          Circle rate{" "}
          <span className="normal-case text-ink-muted">(rupees per sq.ft)</span>
        </label>
        <input
          id="circleRate"
          name="circleRate"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={circleRate}
          onChange={(e) => setCircleRate(e.target.value)}
          className={FIELD}
        />
        <p className="font-sans text-meta text-ink-muted">
          Internal only — never shown on the public site, never sent to the
          browser, and not included in the all-in total above.
        </p>
      </div>
    </FormSection>
  );
}

/**
 * Empty string, never "0", for an absent number. countFilled counts 0 as a
 * legitimate answer, and a zero-rupee demand price is not one — an
 * unanswered field must stay visibly unanswered in the section header count.
 */
function numberField(value?: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * The typed box as an amount, or null when there is nothing usable in it.
 * null rather than 0, because allInPrice() treats a null demand price as
 * "cannot be totalled" and a 0 as "free" — and the readouts above both key
 * off that distinction.
 */
function toAmount(raw: string): number | null {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
