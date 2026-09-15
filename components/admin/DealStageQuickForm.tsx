"use client";

import { useActionForm } from "@/lib/use-action-form";
import { Select } from "@/components/ui/Select";
import { deskButtonSmall } from "@/components/admin/desk";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import { updateDealStage, type DealFormState } from "@/app/admin/(panel)/crm/deal-actions";

const STAGE_OPTIONS = DEAL_STAGES.map((s) => ({ value: s, label: s }));
const initialState: DealFormState = {};

/**
 * Per-card stage change (R-30) — one Select, one Move, on both the board card
 * and the list row.
 *
 * The board also drags, but drag-and-drop is mouse-only and always will be, so
 * this is the keyboard and screen-reader path to the same `updateDealStage`
 * action rather than a duplicate of the drag. Do not drop it from the card to
 * make the board look cleaner.
 */
export function DealStageQuickForm({ id, stage }: { id: number; stage: string }) {
  const { state, isPending, formProps } = useActionForm(updateDealStage, initialState);

  return (
    <form {...formProps} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-2">
        <Select name="stage" options={STAGE_OPTIONS} defaultValue={stage} className="min-w-0" />
        <button
          type="submit"
          disabled={isPending}
          className={`${deskButtonSmall} shrink-0 whitespace-nowrap disabled:cursor-wait disabled:opacity-50`}
        >
          {isPending ? "..." : "Move"}
        </button>
      </div>
      {state.error && (
        <span role="alert" className="text-[12px] text-error">
          {state.error}
        </span>
      )}
    </form>
  );
}
