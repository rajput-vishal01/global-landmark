"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { deskFieldFull, deskLabel } from "./FormSection";
import { Chip } from "@/components/admin/desk";
import { STATUS_TONE } from "@/lib/admin/status-tone";
import { ADDED_BY, PUBLICATION_STATES, type ListingStatus } from "@/lib/attributes";
import { formatDate } from "@/lib/dates";

/** One line of the "to go live" list; `done: null` means it cannot be checked live. */
export type Requirement = { label: string; done: boolean | null };

const PUBLICATION_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

/**
 * The property form's side panel: whether the listing is live, what it
 * still needs to go live, its reference, and the save button (`children`).
 *
 * Publication used to sit in a "Basic details" card beside "Added by", which
 * mixed a publishing decision with a fact about where the listing came from.
 * It lives here now, next to the button that acts on it.
 *
 * Status (Available / Sold / …) is no longer asked (Sep 2026). A listing
 * keeps whatever status it already has; a new one is Available.
 */
export function PublishPanel({
  refCode,
  listedAt,
  updatedAt,
  publicationState: initialPublicationState,
  listingStatus,
  requirements,
  children,
}: {
  refCode?: string | null;
  listedAt?: Date | null;
  updatedAt?: Date | null;
  publicationState?: string | null;
  listingStatus?: string | null;
  requirements: Requirement[];
  children?: React.ReactNode;
}) {
  const [publicationState, setPublicationState] = useState(
    initialPublicationState ?? "draft"
  );
  const status = listingStatus ?? "Available";
  // Mirrors isPubliclyVisible() in lib/taxonomy/status.ts.
  const isLive = publicationState === "published" && status === "Available";
  const message = isLive
    ? "Will be live on the website once saved."
    : publicationState === "published"
      ? `Marked ${status}, so it stays off the website. Only Available listings appear.`
      : publicationState === "archived"
        ? "Archived — kept in the admin, off the website."
        : "Draft — saved in the admin only, not on the website.";

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Publication" className="grid grid-cols-3 gap-1 rounded-lg bg-raise p-1">
        {PUBLICATION_STATES.map((state) => {
          const checked = publicationState === state;
          return (
            <label
              key={state}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-center text-[12.5px] font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                checked
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgb(20_20_20/0.08)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name="publicationState"
                value={state}
                checked={checked}
                onChange={() => setPublicationState(state)}
                className="sr-only"
              />
              {PUBLICATION_LABEL[state] ?? state}
            </label>
          );
        })}
      </div>

      <p
        className={`flex items-start gap-2 text-[12px] leading-snug ${
          isLive ? "text-gold-deep" : "text-muted"
        }`}
      >
        <span
          aria-hidden
          className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${isLive ? "bg-gold" : "bg-line"}`}
        />
        {message}
      </p>

      <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
        <span className={deskLabel}>To go live</span>
        <ul className="flex flex-col gap-1.5">
          {requirements.map((r) => (
            <li key={r.label} className="flex items-center gap-2 text-[12.5px]">
              <span
                aria-hidden
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  r.done ? "border-gold bg-gold text-surface" : "border-line text-transparent"
                }`}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <span className={r.done ? "text-muted line-through decoration-line" : "text-ink"}>
                {r.label}
              </span>
              <span className="sr-only">{r.done ? "(done)" : "(to do)"}</span>
            </li>
          ))}
        </ul>
      </div>

      {refCode && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line-soft pt-4">
          <Fact label="Reference" value={refCode} wide />
          <Fact label="Listed" value={formatDate(listedAt)} />
          <Fact label="Updated" value={formatDate(updatedAt)} />
        </dl>
      )}

      {children}
    </div>
  );
}

/**
 * Where the listing came from — ours, a dealer's, or an owner's. Sits with
 * the owner contacts, the other half of the same question.
 */
export function SourceFields({
  addedBy: initialAddedBy,
  sourceName: initialSourceName,
}: {
  addedBy?: string | null;
  sourceName?: string | null;
}) {
  const [addedBy, setAddedBy] = useState(initialAddedBy ?? "Global Landmark");
  const [sourceName, setSourceName] = useState(initialSourceName ?? "");
  const needsSource = addedBy !== "Global Landmark";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label htmlFor="addedBy" className={deskLabel}>
          Listing comes from
        </label>
        <Select
          id="addedBy"
          name="addedBy"
          defaultValue={addedBy}
          onValueChange={setAddedBy}
          options={ADDED_BY.map((s) => ({ value: s, label: s }))}
        />
      </div>

      {needsSource ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="sourceName" className={deskLabel}>
            {addedBy} name
          </label>
          <input
            id="sourceName"
            name="sourceName"
            type="text"
            maxLength={200}
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder={addedBy === "Dealer" ? "Dealer or firm name" : "Owner name"}
            className={deskFieldFull}
          />
        </div>
      ) : (
        // Carries an empty value while the field is hidden, so switching back
        // to Global Landmark clears the stale name instead of orphaning it.
        <input type="hidden" name="sourceName" value="" />
      )}
    </div>
  );
}

function Fact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className={`text-[12.5px] text-ink ${wide ? "font-semibold tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Listing status, as the desk draws a state. An unknown status still
 * renders: the column is data from the database, and a row whose status
 * predates the taxonomy should show what it holds, not vanish.
 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <Chip tone={STATUS_TONE[status as ListingStatus] ?? "neutral"}>{status}</Chip>
  );
}
