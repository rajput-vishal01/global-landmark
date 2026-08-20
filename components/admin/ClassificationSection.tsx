"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";
import { ChecklistField } from "./ChecklistField";
import {
  DEAL_ATTRIBUTES,
  FACINGS,
  POSSESSION_STATUSES,
  PROPERTY_AGES,
  PROPERTY_TYPES,
  withEmptyOption,
} from "@/lib/attributes";

/**
 * CFF groups 2, 10, 11 and 12 — what kind of property this is, which way it
 * points, when it can be handed over and how old it is. All public.
 *
 * The four live together because they are the questions a buyer asks in one
 * breath, and because they are cheap: four dropdowns and a two-box checklist
 * is a section a broker can finish at a gate without sitting down.
 *
 * Property type is the consequential one — lib/taxonomy/sections.ts maps it
 * to a shape, and the shape decides which of the other nineteen sections the
 * form even renders. Hence `onTypeChange`: the parent re-derives the visible
 * sections from it while the broker is still standing there, instead of after
 * a save round-trip.
 */
export function ClassificationSection({
  propertyType: initialPropertyType,
  dealAttributes,
  facing: initialFacing,
  possessionStatus: initialPossessionStatus,
  propertyAge: initialPropertyAge,
  onTypeChange,
}: {
  propertyType?: string | null;
  dealAttributes?: string[] | null;
  facing?: string | null;
  possessionStatus?: string | null;
  propertyAge?: string | null;
  /** Lets the parent show/hide the other sections as the type changes. */
  onTypeChange?: (type: string) => void;
}) {
  const [propertyType, setPropertyType] = useState(initialPropertyType ?? "");
  const [facing, setFacing] = useState(initialFacing ?? "");
  const [possessionStatus, setPossessionStatus] = useState(
    initialPossessionStatus ?? ""
  );
  const [propertyAge, setPropertyAge] = useState(initialPropertyAge ?? "");

  // The checklist owns its own state behind a hidden JSON input, so the count
  // reads the initial value only. Good enough for a progress hint — it is not
  // a validation gate, and re-lifting that state here would buy nothing.
  const initialDealAttributes = dealAttributes ?? [];

  function chooseType(next: string) {
    setPropertyType(next);
    onTypeChange?.(next);
  }

  const filled = countFilled([
    propertyType,
    initialDealAttributes,
    facing,
    possessionStatus,
    propertyAge,
  ]);

  return (
    <FormSection
      title="Classification"
      hint="Type drives which of the other sections this form asks for"
      filled={filled}
      total={5}
      defaultOpen
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="propertyType" className={LABEL}>
          Property type
        </label>
        <Select
          id="propertyType"
          name="propertyType"
          defaultValue={propertyType}
          onValueChange={chooseType}
          options={withEmptyOption("— Select a type —", PROPERTY_TYPES)}
        />
        <p className="font-sans text-meta text-ink-muted">
          A plot is not asked for rooms or furnishing; a warehouse is not asked
          for amenities. Choosing the type here changes the rest of the form.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>Deal attributes</span>
        {/* Pre-Leased and Investment describe the DEAL, not the building — a
            pre-leased shop is still a Shop — so they are a separate checklist
            that combines with any physical type above rather than two more
            entries in the type dropdown. Fixed taxonomy, so no free text: the
            server action drops values it does not recognise, and a broker
            would never learn why their entry vanished. */}
        <ChecklistField
          name="dealAttributesJson"
          options={DEAL_ATTRIBUTES}
          initial={initialDealAttributes}
          allowCustom={false}
          columns={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="facing" className={LABEL}>
            Facing
          </label>
          {/* Every one of these three is clearable. A broker who picked a
              value on a guess must be able to take it back to unknown —
              without an empty option the only way out is to leave something
              wrong on a public listing. */}
          <Select
            id="facing"
            name="facing"
            defaultValue={facing}
            onValueChange={setFacing}
            options={withEmptyOption("— None —", FACINGS)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="possessionStatus" className={LABEL}>
            Possession
          </label>
          <Select
            id="possessionStatus"
            name="possessionStatus"
            defaultValue={possessionStatus}
            onValueChange={setPossessionStatus}
            options={withEmptyOption("— None —", POSSESSION_STATUSES)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="propertyAge" className={LABEL}>
            Age
          </label>
          <Select
            id="propertyAge"
            name="propertyAge"
            defaultValue={propertyAge}
            onValueChange={setPropertyAge}
            options={withEmptyOption("— None —", PROPERTY_AGES)}
          />
        </div>
      </div>
    </FormSection>
  );
}
