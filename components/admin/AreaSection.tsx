"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Req } from "@/components/ui/RequiredMark";
import { FormSection, countFilled, deskFieldFull, deskLabel } from "./FormSection";

import { ChecklistField } from "./ChecklistField";
import {
  AREA_MEASURES,
  AREA_UNITS,
  PLC_ATTRIBUTES,
  formatArea,
  toSqft,
  type AreaMeasureKey,
} from "@/lib/attributes";

/** One measure's live form state: what was typed, and in which unit. */
type Measure = { value: string; unit: string };

const UNIT_OPTIONS = AREA_UNITS.map((u) => ({ value: u.value, label: u.label }));

/**
 * CFF group 5 — Area. Public.
 *
 * Four measures, each with its OWN unit select rather than one shared unit
 * for the section. This is not symmetry for its own sake: a plot is quoted
 * in sq.yd or marla while the flat standing on it is quoted in sq.ft, and a
 * single section-wide unit would silently mislabel three of the four
 * numbers. The DB agrees — every measure has its own `<key>Unit` column.
 *
 * The four blocks are generated from AREA_MEASURES rather than written out,
 * so the order the broker is asked in stays owned by the taxonomy and cannot
 * drift from the order used everywhere else.
 */
export function AreaSection({
  plotArea,
  plotAreaUnit,
  builtUpArea,
  builtUpAreaUnit,
  superArea,
  superAreaUnit,
  carpetArea,
  carpetAreaUnit,
  frontFeet: initialFrontFeet,
  depthFeet: initialDepthFeet,
  plcAttributes,
  requiredToPublish,
}: {
  /** Publish-gate fields for the chosen property type (lib/taxonomy/sections). */
  requiredToPublish?: ReadonlySet<string>;
  plotArea?: number | null;
  plotAreaUnit?: string | null;
  builtUpArea?: number | null;
  builtUpAreaUnit?: string | null;
  superArea?: number | null;
  superAreaUnit?: string | null;
  carpetArea?: number | null;
  carpetAreaUnit?: string | null;
  frontFeet?: number | null;
  depthFeet?: number | null;
  plcAttributes?: string[] | null;
}) {
  const [measures, setMeasures] = useState<Record<AreaMeasureKey, Measure>>({
    plotArea: measureState(plotArea, plotAreaUnit),
    builtUpArea: measureState(builtUpArea, builtUpAreaUnit),
    superArea: measureState(superArea, superAreaUnit),
    carpetArea: measureState(carpetArea, carpetAreaUnit),
  });
  const [frontFeet, setFrontFeet] = useState(numberField(initialFrontFeet));
  const [depthFeet, setDepthFeet] = useState(numberField(initialDepthFeet));

  // The checklist owns its own state behind a hidden JSON input, so the
  // header count reads the initial value only — the same trade every other
  // section makes, and this count is a progress hint, not a validation gate.
  const initialPlc = plcAttributes ?? [];

  function editMeasure(key: AreaMeasureKey, patch: Partial<Measure>) {
    setMeasures((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  const filled = countFilled([
    ...AREA_MEASURES.map((m) => measures[m.key].value),
    frontFeet,
    depthFeet,
    initialPlc,
  ]);

  return (
    <FormSection
      title="Area"
      hint="Each measure carries its own unit — the plot in marla, the flat in sq.ft"
      filled={filled}
      total={7}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {AREA_MEASURES.map((measure) => {
          const state = measures[measure.key];
          const normalised = sqftHint(state);
          const unitId = `${measure.key}Unit`;

          return (
            <div key={measure.key} className="flex flex-col gap-2">
              <label htmlFor={measure.key} className={deskLabel}>
                {measure.label}
                {requiredToPublish?.has(measure.key) && <Req />}
              </label>

              <div className="flex gap-3">
                <input
                  id={measure.key}
                  name={measure.key}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={state.value}
                  onChange={(e) =>
                    editMeasure(measure.key, { value: e.target.value })
                  }
                  className={`${deskFieldFull} min-w-0 flex-1`}
                />
                {/* No visible label — the field label above already names the
                    measure — but the combobox still needs an accessible name
                    of its own, and Select takes no aria-label prop. */}
                <label htmlFor={unitId} className="sr-only">
                  {measure.label} unit
                </label>
                <Select
                  id={unitId}
                  name={unitId}
                  defaultValue={state.unit}
                  onValueChange={(unit) => editMeasure(measure.key, { unit })}
                  options={UNIT_OPTIONS}
                  className="w-24 shrink-0"
                />
              </div>

              {/* Live sq.ft echo, doing two jobs. It is the normalisation that
                  makes mixed-unit sorting and filtering possible at all — the
                  server writes the same conversion to areaSqft, and without a
                  common footing a 500 sq.yd plot cannot be ranked against a
                  2000 sq.ft flat. And it lets a broker sanity-check a marla or
                  bigha figure before it goes public: "4 marla" reading back as
                  1,089 Sq Ft catches a slipped decimal on the spot. Absent
                  while the box is empty or the unit is one toSqft cannot
                  convert, because a blank line is better than a wrong one. */}
              {normalised && (
                <p className="text-[11.5px] text-muted">
                  = {normalised}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="frontFeet" className={deskLabel}>
            Front{" "}
            <span className="normal-case text-muted">(running feet)</span>
          </label>
          {/* Front and depth are running feet whatever unit the areas above
              are quoted in — "30x60" is the shorthand every Tricity buyer
              uses, and it is not recoverable from the area alone: 30x60 and
              20x90 are both 1800 sq.ft and are not the same plot. Hence two
              plain feet fields with no unit select beside them. */}
          <input
            id="frontFeet"
            name="frontFeet"
            type="number"
            min={0}
            inputMode="numeric"
            value={frontFeet}
            onChange={(e) => setFrontFeet(e.target.value)}
            className={deskFieldFull}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="depthFeet" className={deskLabel}>
            Depth{" "}
            <span className="normal-case text-muted">(running feet)</span>
          </label>
          <input
            id="depthFeet"
            name="depthFeet"
            type="number"
            min={0}
            inputMode="numeric"
            value={depthFeet}
            onChange={(e) => setDepthFeet(e.target.value)}
            className={deskFieldFull}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={deskLabel}>PLC attributes</span>
        {/* Preferential-location charges are precisely what a buyer pays a
            premium for — park facing, corner, golf course facing — so these
            are public and render on the card rather than sitting in internal
            notes. Fixed taxonomy, so no free text: the server action drops
            values it does not recognise, and a broker would never learn why
            their own wording vanished. */}
        <ChecklistField
          name="plcAttributesJson"
          options={PLC_ATTRIBUTES}
          initial={initialPlc}
          allowCustom={false}
        />
      </div>
    </FormSection>
  );
}

/** DB integer + unit column, as the pair of strings the inputs hold. */
function measureState(value?: number | null, unit?: string | null): Measure {
  return { value: numberField(value), unit: unit ?? "sqft" };
}

/**
 * Empty string, never "0", for an absent number. countFilled counts 0 as a
 * legitimate answer, and a zero-foot frontage is not one — an unanswered
 * field must stay visibly unanswered in the section header count.
 */
function numberField(value?: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

/** The normalised sq.ft line, or null when there is nothing to convert. */
function sqftHint({ value, unit }: Measure): string | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const sqft = toSqft(parsed, unit);
  return sqft === null ? null : formatArea(sqft, "sqft");
}
