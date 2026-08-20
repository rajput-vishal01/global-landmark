"use client";

import { useState } from "react";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";

/**
 * CFF group 20 — Property specifications. Public; renders as the spec table
 * on the detail page (R-25).
 *
 * Floor number and total floors belong to this CFF group too, but they are
 * already asked for in the location section where the block/society/unit
 * address is built up — asking twice would let the two copies disagree.
 *
 * Every measure here is in FEET, matching how the client's own form and every
 * local broker states them ("30 ft road", "12 ft ceiling"). The unit is in
 * the label rather than a dropdown: a mixed-unit column would need conversion
 * on read for a value nobody ever quotes in metres, and the DB columns are
 * plain integers.
 */
export function SpecificationsSection({
  roadWidth: initialRoadWidth,
  entranceWidth: initialEntranceWidth,
  ceilingHeight: initialCeilingHeight,
  isCorner: initialIsCorner,
  isParkFacing: initialIsParkFacing,
}: {
  roadWidth?: number | null;
  entranceWidth?: number | null;
  ceilingHeight?: number | null;
  isCorner?: boolean | null;
  isParkFacing?: boolean | null;
}) {
  const [roadWidth, setRoadWidth] = useState(numberToInput(initialRoadWidth));
  const [entranceWidth, setEntranceWidth] = useState(
    numberToInput(initialEntranceWidth)
  );
  const [ceilingHeight, setCeilingHeight] = useState(
    numberToInput(initialCeilingHeight)
  );
  const [isCorner, setIsCorner] = useState(initialIsCorner ?? false);
  const [isParkFacing, setIsParkFacing] = useState(initialIsParkFacing ?? false);

  // Only the three measures count toward the header total. A ticked box is an
  // answer and so is an unticked one, so counting them would show 2/5 on an
  // untouched section and make the hint meaningless.
  const filled = countFilled([roadWidth, entranceWidth, ceilingHeight]);

  return (
    <FormSection
      title="Property specifications"
      hint="Road, entrance and ceiling — all in feet"
      filled={filled}
      total={3}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <MeasureField
          name="roadWidth"
          label="Road width"
          value={roadWidth}
          onChange={setRoadWidth}
          placeholder="30"
        />
        <MeasureField
          name="entranceWidth"
          label="Entrance width"
          value={entranceWidth}
          onChange={setEntranceWidth}
          placeholder="12"
        />
        <MeasureField
          name="ceilingHeight"
          label="Ceiling height"
          value={ceilingHeight}
          onChange={setCeilingHeight}
          placeholder="10"
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className={LABEL}>Position</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Flag
            name="isCorner"
            label="Corner property"
            checked={isCorner}
            onChange={setIsCorner}
          />
          <Flag
            name="isParkFacing"
            label="Park facing"
            checked={isParkFacing}
            onChange={setIsParkFacing}
          />
        </div>
      </div>
    </FormSection>
  );
}

function MeasureField({
  name,
  label,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className={LABEL}>
        {label} <span className="normal-case text-ink-muted">(feet)</span>
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min={0}
        // inputMode is what actually decides the phone keypad. type="number"
        // alone gives a full keyboard on some Android builds, and this form is
        // filled standing at a gate.
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FIELD}
      />
    </div>
  );
}

/**
 * One boolean spec.
 *
 * An unchecked HTML checkbox submits NOTHING — the key is simply absent from
 * the FormData. On an edit that reads as "field not present" rather than
 * "false", so unticking a box would leave the old `true` sitting on the row
 * forever. The hidden input carries "false" and is placed BEFORE the checkbox
 * so that when the box IS ticked the later "true" wins on the server, and
 * when it is not the "false" stands alone.
 */
function Flag({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 font-sans text-body text-ink">
      <input type="hidden" name={name} value="false" />
      <input
        type="checkbox"
        name={name}
        value="true"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-white checked:border-gold checked:bg-gold"
      />
      {label}
    </label>
  );
}

/** Integer columns arrive as null on a new listing; "" is the empty input. */
function numberToInput(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}
