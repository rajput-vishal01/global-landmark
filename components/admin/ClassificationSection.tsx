"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { FormSection, countFilled, deskLabel } from "./FormSection";

import { ChecklistField } from "./ChecklistField";
import {
  DEAL_ATTRIBUTES,
  FACINGS,
  POSSESSION_STATUSES,
  PROPERTY_AGES,
  withEmptyOption,
} from "@/lib/attributes";

/**
 * CFF groups 10, 11 and 12 — which way the property points, when it can be
 * handed over and how old it is, plus the deal attributes. All public.
 *
 * These live together because they are the questions a buyer asks in one
 * breath, and because they are cheap: three dropdowns and a two-box checklist
 * is a section a broker can finish at a gate without sitting down.
 *
 * Property type used to live here and no longer does — it is the one field
 * that decides which of the other nineteen sections the form even renders
 * (lib/taxonomy/sections.ts maps it to a shape), so burying the only real
 * type picker in a collapsible section left brokers hunting for it. It is
 * now answered up in the identity block beside "Unit or project".
 */
export function ClassificationSection({
  dealAttributes,
  facing: initialFacing,
  possessionStatus: initialPossessionStatus,
  propertyAge: initialPropertyAge,
}: {
  dealAttributes?: string[] | null;
  facing?: string | null;
  possessionStatus?: string | null;
  propertyAge?: string | null;
}) {
  const [facing, setFacing] = useState(initialFacing ?? "");
  const [possessionStatus, setPossessionStatus] = useState(
    initialPossessionStatus ?? ""
  );
  const [propertyAge, setPropertyAge] = useState(initialPropertyAge ?? "");

  // The checklist owns its own state behind a hidden JSON input, so the count
  // reads the initial value only. Good enough for a progress hint — it is not
  // a validation gate, and re-lifting that state here would buy nothing.
  const initialDealAttributes = dealAttributes ?? [];

  const filled = countFilled([
    initialDealAttributes,
    facing,
    possessionStatus,
    propertyAge,
  ]);

  return (
    <FormSection
      title="Classification"
      hint="Facing, possession and age — what a buyer asks in one breath"
      filled={filled}
      total={4}
      defaultOpen
    >
      <div className="flex flex-col gap-2">
        <span className={deskLabel}>Deal attributes</span>
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
          <label htmlFor="facing" className={deskLabel}>
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
          <label htmlFor="possessionStatus" className={deskLabel}>
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
          <label htmlFor="propertyAge" className={deskLabel}>
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
