"use client";

import { useActionForm } from "@/lib/use-action-form";
import { cardChrome, deskButton, deskField } from "@/components/admin/desk";
import { LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { ACTIVITY_KINDS } from "@/lib/taxonomy/activities";
import { addActivity } from "../client-actions";

const ACTIVITY_KIND_OPTIONS = ACTIVITY_KINDS.map((k) => ({ value: k, label: k }));

/** Desk field chrome plus the full width the inline activity fields want. */
const FIELD = `${deskField} w-full`;

/**
 * The "log activity" row on a client page. A client component only so it can
 * show a failed save and keep what was typed; it clears itself once the entry
 * is saved, ready for the next one.
 */
export function ActivityForm({ clientId }: { clientId: number }) {
  const { state, isPending, formProps } = useActionForm(
    addActivity,
    {},
    { resetOnSuccess: true }
  );

  return (
    <form
      {...formProps}
      className={`${cardChrome} flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end`}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <div className="flex w-40 flex-col gap-1.5">
        <label htmlFor="kind" className={LABEL}>
          Kind
          <Req />
        </label>
        {/* The custom listbox, not a native <select>: the OS draws that
            popup and no desk styling can reach inside it. */}
        <Select id="kind" name="kind" options={ACTIVITY_KIND_OPTIONS} />
      </div>
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <label htmlFor="note" className={LABEL}>
          Note
        </label>
        <textarea id="note" name="note" rows={1} maxLength={4000} className={FIELD} />
      </div>
      <div className="flex w-40 flex-col gap-1.5">
        <label htmlFor="author" className={LABEL}>
          Author
        </label>
        <input id="author" name="author" type="text" maxLength={200} className={FIELD} />
      </div>
      {/* Blank = right now, so logging a call as it ends stays one click.
          Set it to record a call that already happened on an earlier day. */}
      <div className="flex w-52 flex-col gap-1.5">
        <label htmlFor="occurredAt" className={LABEL}>
          Happened on
        </label>
        <input
          id="occurredAt"
          name="occurredAt"
          type="datetime-local"
          className={FIELD}
        />
      </div>
      <div className="flex w-44 flex-col gap-1.5">
        <label htmlFor="followUpAt" className={LABEL}>
          Follow up on
        </label>
        <input id="followUpAt" name="followUpAt" type="date" className={FIELD} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={`${deskButton} disabled:cursor-wait disabled:opacity-50`}
      >
        {isPending ? "Saving..." : "Log activity"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-[12px] text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
