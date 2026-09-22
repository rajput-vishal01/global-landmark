"use client";

import { useState } from "react";
import { deskFieldFull, deskLabel } from "./FormSection";

import { ChecklistField } from "./ChecklistField";
import {
  LEGAL_FLAGS,
  LOAN_FLAGS,
} from "@/lib/attributes";

/** The one legal flag that pulls a second field onto the form. */
const RERA_FLAG = "RERA Registered";

/**
 * Banks are free-add only — there is no fixed list. Which banks sit on a
 * project's panel changes per project and per quarter, and a hardcoded list
 * would be wrong the week after it was written. An empty options array turns
 * ChecklistField into a pure chip entry: nothing to tick, everything typed,
 * each entry removable. Module-level so it is one array, not one per render.
 */
const NO_FIXED_OPTIONS: readonly string[] = [];

/**
 * Legal and loan (CFF 13, 14) — public trust signals. The internal
 * documentation checklist lives with the document uploads instead, in the
 * form’s Paperwork section, so public and internal data never share a box.
 */
export function LegalLoanSection({
  legalFlags,
  reraNumber: initialReraNumber,
  loanFlags,
  banksOnPanel,
}: {
  legalFlags?: string[] | null;
  reraNumber?: string | null;
  loanFlags?: string[] | null;
  banksOnPanel?: string[] | null;
}) {
  // The checklists own their own state behind hidden JSON inputs, so these
  // initial values are what the header count reads. A progress hint, not a
  // validation gate.
  const initialLegalFlags = legalFlags ?? [];
  const initialLoanFlags = loanFlags ?? [];
  const initialBanks = banksOnPanel ?? [];

  const [hasRera, setHasRera] = useState(initialLegalFlags.includes(RERA_FLAG));
  const [reraNumber, setReraNumber] = useState(initialReraNumber ?? "");

  /**
   * ChecklistField owns its selection state internally and exposes no change
   * callback, so the only live signal the parent can act on is the checkbox
   * `change` event bubbling out of it. We identify which flag moved by the
   * label the checkbox sits inside.
   *
   * ponytail: this couples to ChecklistField's markup (a checkbox nested in a
   * label whose text is the option). It is the cheapest way to get a live
   * gate without touching a widget nine other sections already depend on — if
   * that widget ever grows an `onChange` prop, delete this and pass it.
   */
  function onLegalToggle(e: React.FormEvent<HTMLDivElement>) {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
      return;
    }
    if (input.closest("label")?.textContent?.trim() === RERA_FLAG) {
      setHasRera(input.checked);
    }
  }


  return (
    <>
      <div className="flex flex-col gap-2" onChange={onLegalToggle}>
        <span className={deskLabel}>Legal</span>
        {/* Public, and deliberately short. A RERA registration number is
            expected in Indian property advertising — an ad claiming RERA
            registration without quoting the number is the thing buyers have
            been taught to distrust — which is why the tick and the number are
            one pair on the public side.

            "Mortgaged" is absent on purpose. It belongs to the same CFF group
            but it is a negotiating position, not a selling point, so it lives
            on the internal table via INTERNAL_LEGAL_FLAGS and cannot reach
            the public legal strip by accident.

            Fixed taxonomy, so no free text: the server drops what it does not
            recognise and the broker would never learn why. */}
        <ChecklistField
          name="legalFlagsJson"
          options={LEGAL_FLAGS}
          initial={initialLegalFlags}
          allowCustom={false}
          columns={2}
        />
      </div>

      {hasRera ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="reraNumber" className={deskLabel}>
            RERA number
          </label>
          <input
            id="reraNumber"
            name="reraNumber"
            type="text"
            maxLength={100}
            value={reraNumber}
            onChange={(e) => setReraNumber(e.target.value)}
            placeholder="PBRERA-SAS79-PR0123"
            className={deskFieldFull}
          />
          <p className="text-[11.5px] text-muted">
            Shown publicly beside the RERA badge. Quote it exactly as
            registered.
          </p>
        </div>
      ) : (
        // Carries an empty value while the field is not rendered, so
        // un-ticking RERA clears the stored number instead of leaving a
        // registration on a listing that no longer claims one.
        <input type="hidden" name="reraNumber" value="" />
      )}

      <div className="flex flex-col gap-2">
        <span className={deskLabel}>Loan</span>
        <ChecklistField
          name="loanFlagsJson"
          options={LOAN_FLAGS}
          initial={initialLoanFlags}
          allowCustom={false}
          columns={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={deskLabel}>Banks on panel</span>
        <ChecklistField
          name="banksOnPanelJson"
          options={NO_FIXED_OPTIONS}
          initial={initialBanks}
          allowCustom
          customPlaceholder="Add a bank"
        />
      </div>

    </>
  );
}
