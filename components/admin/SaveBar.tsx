"use client";

import { deskButtonPrimary } from "@/components/admin/desk";

/**
 * Sticky submit bar. With twenty CFF sections the real submit button is
 * otherwise thousands of pixels below the fold — on a phone at a site
 * visit that is not a hypothetical, it is the normal case.
 *
 * `aria-live="polite"` on the status line matters more for the FAILURE
 * message than the success one: a broker on hotel wifi needs to know the
 * last twenty seconds did not persist, and — just as important — that the
 * work is still sitting in this tab and has not been lost.
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
}: {
  isPending: boolean;
  isUploading: boolean;
  isEditing: boolean;
  autosave: AutosaveStatus;
}) {
  return (
    <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-paper/95 py-4 backdrop-blur-sm">
      <p aria-live="polite" className="min-h-[1.25em] text-[11.5px] text-muted">
        {autosaveMessage(autosave)}
      </p>
      <button
        type="submit"
        disabled={isPending || isUploading}
        className={`${deskButtonPrimary} w-full justify-center disabled:cursor-wait disabled:opacity-60 sm:w-fit`}
      >
        {isUploading
          ? "Uploading images..."
          : isPending
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create property"}
      </button>
    </div>
  );
}

function autosaveMessage(status: AutosaveStatus): string {
  switch (status.kind) {
    case "saving":
      return "Saving draft...";
    case "saved":
      return `Draft saved ${formatTime(status.at)}`;
    case "error":
      // Deliberately reassuring, not just an error code: the anxiety this
      // message exists to prevent is "did I just lose the last 20 minutes",
      // and the honest answer is no — it is still right here in the form.
      return `${status.message} Your work is still in this tab — keep going, or use "Save changes" below.`;
    case "idle":
      return "";
  }
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}
