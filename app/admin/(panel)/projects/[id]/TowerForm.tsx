"use client";

import { useActionForm } from "@/lib/use-action-form";
import { deskButton, deskField } from "@/components/admin/desk";
import { Req } from "@/components/ui/RequiredMark";
import { createTower } from "../actions";

const fieldLabel = "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted";

/**
 * "Add a tower" on a project page. A client component only so it can show a
 * failed save and keep what was typed; it clears once the tower is added.
 */
export function TowerForm({ projectId }: { projectId: number }) {
  const { state, isPending, formProps } = useActionForm(createTower, {}, {
    resetOnSuccess: true,
  });

  return (
    <form {...formProps} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor="towerName" className={fieldLabel}>
          Tower name
          <Req />
        </label>
        <input
          id="towerName"
          name="name"
          type="text"
          required
          maxLength={200}
          placeholder="Tower B"
          className={deskField}
        />
      </div>
      <div className="flex w-28 flex-col gap-1.5">
        <label htmlFor="totalFloors" className={fieldLabel}>
          Floors
        </label>
        <input
          id="totalFloors"
          name="totalFloors"
          type="number"
          min={0}
          inputMode="numeric"
          className={deskField}
        />
      </div>
      <div className="flex w-28 flex-col gap-1.5">
        <label htmlFor="unitsPerFloor" className={fieldLabel}>
          Units/floor
        </label>
        <input
          id="unitsPerFloor"
          name="unitsPerFloor"
          type="number"
          min={0}
          inputMode="numeric"
          className={deskField}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className={`${deskButton} disabled:cursor-wait disabled:opacity-50`}
      >
        {isPending ? "Adding..." : "Add tower"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-[12px] text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
