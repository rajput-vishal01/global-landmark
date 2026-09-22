"use client";

import { deskButtonPrimary } from "@/components/admin/desk";

/**
 * The property form's submit, with the autosave line and any save error
 * directly above it — where the eye already is after pressing the button.
 *
 * Two placements of the same thing: `panel` sits in the desktop side panel;
 * `bar` sticks to the bottom of the form on a phone, where the side panel
 * has stacked out of reach.
 *
 * `aria-live` matters more for the FAILURE message than the success one: a
 * broker on hotel wifi needs to know the last save did not land — and that
 * the work is still in this tab.
 */

export type AutosaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

export function SaveBar({
  isPending,
  isUploading,
  isEditing,
  autosave,
  error,
  variant = "bar",
  className = "",
}: {
  isPending: boolean;
  isUploading: boolean;
  isEditing: boolean;
  autosave: AutosaveStatus;
  error?: string;
  variant?: "bar" | "panel";
  className?: string;
}) {
  const isBar = variant === "bar";
  return (
    <div
      className={`flex flex-col gap-2.5 ${
        isBar ? "sticky bottom-0 -mx-1 border-t border-line bg-paper/95 px-1 py-4 backdrop-blur-sm" : "border-t border-line-soft pt-4"
      } ${className}`}
    >
      {error && (
        <p role="alert" className="rounded-lg border-l-[3px] border-l-error bg-error/5 px-3 py-2 text-[12px] leading-snug text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || isUploading}
        className={`${deskButtonPrimary} w-full justify-center py-2.5 disabled:cursor-wait disabled:opacity-60`}
      >
        {isUploading
          ? "Uploading images..."
          : isPending
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create property"}
      </button>
      <p aria-live="polite" className="min-h-[1.25em] text-center text-[11.5px] text-muted">
        {autosaveMessage(autosave, isEditing)}
      </p>
    </div>
  );
}

function autosaveMessage(status: AutosaveStatus, isEditing: boolean): string {
  switch (status.kind) {
    case "saving":
      return "Saving draft...";
    case "saved":
      return `Draft saved ${formatTime(status.at)}`;
    case "error":
      // Reassuring, not just an error code: the fear is "did I just lose
      // twenty minutes", and the honest answer is no.
      return `${status.message} Your work is still in this tab.`;
    case "idle":
      return isEditing ? "Changes autosave every 20 seconds." : "Nothing is saved until you press Create.";
  }
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}
