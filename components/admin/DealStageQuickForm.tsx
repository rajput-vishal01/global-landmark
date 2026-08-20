"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/Select";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import { updateDealStage, type DealFormState } from "@/app/admin/(panel)/crm/deal-actions";

const STAGE_OPTIONS = DEAL_STAGES.map((s) => ({ value: s, label: s }));
const initialState: DealFormState = {};

/** Per-card stage change on the pipeline board (R-30) — one Select, one Save, no drag-and-drop. */
export function DealStageQuickForm({ id, stage }: { id: number; stage: string }) {
  const [state, formAction, isPending] = useActionState(updateDealStage, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-2">
        <Select name="stage" options={STAGE_OPTIONS} defaultValue={stage} className="min-w-0" />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 cursor-pointer whitespace-nowrap border border-ink/25 px-3 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold disabled:cursor-wait disabled:opacity-50"
        >
          {isPending ? "..." : "Move"}
        </button>
      </div>
      {state.error && (
        <span role="alert" className="text-meta font-sans text-error">
          {state.error}
        </span>
      )}
    </form>
  );
}
