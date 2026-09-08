"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { FormSection, countFilled, deskFieldFull, deskLabel } from "./FormSection";
import { Chip } from "@/components/admin/desk";
import { STATUS_TONE } from "@/lib/admin/status-tone";

import {
  ADDED_BY,
  LISTING_STATUSES,
  PUBLICATION_STATES,
  type ListingStatus,
} from "@/lib/attributes";
import { formatDate } from "@/lib/dates";

/**
 * CFF group 1 — Basic Details. Every field here is INTERNAL: the client was
 * explicit that reference code, dates, who added a listing and its status
 * are for the admin panel only, and none of them appears in
 * PUBLIC_PROPERTY_COLUMNS.
 *
 * Publication state and listing status together decide whether the listing
 * is on the public site at all, so this section carries a plain-language
 * line saying so — it is the highest-consequence control on the form and
 * "why is my property not showing" is otherwise the first support question.
 */
export function BasicDetailsSection({
  refCode,
  listedAt,
  updatedAt,
  publicationState: initialPublicationState,
  listingStatus: initialListingStatus,
  addedBy: initialAddedBy,
  sourceName: initialSourceName,
}: {
  refCode?: string | null;
  listedAt?: Date | null;
  updatedAt?: Date | null;
  publicationState?: string | null;
  listingStatus?: string | null;
  addedBy?: string | null;
  sourceName?: string | null;
}) {
  const [publicationState, setPublicationState] = useState(
    initialPublicationState ?? "draft"
  );
  const [listingStatus, setListingStatus] = useState(
    initialListingStatus ?? "Available"
  );
  const [addedBy, setAddedBy] = useState(initialAddedBy ?? "Global Landmark");
  const [sourceName, setSourceName] = useState(initialSourceName ?? "");

  // Whether this listing is on the public site right now. Mirrors
  // isPubliclyVisible() in lib/taxonomy/status.ts.
  const isLive = publicationState === "published" && listingStatus === "Available";

  // sourceName only counts toward the total when it is actually required.
  const needsSource = addedBy !== "Global Landmark";
  const filled = countFilled([
    publicationState,
    listingStatus,
    addedBy,
    ...(needsSource ? [sourceName] : []),
  ]);

  return (
    <FormSection
      title="Basic details"
      hint="Internal only — never shown on the public site"
      filled={filled}
      total={needsSource ? 4 : 3}
      defaultOpen
    >
      {/* Read-only provenance. Assigned by the server; shown so a broker can
          quote a reference on a call. */}
      {refCode && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line-soft pb-5 sm:grid-cols-3">
          <Fact label="Reference" value={refCode} mono />
          <Fact label="Listed" value={formatDate(listedAt)} />
          <Fact label="Last updated" value={formatDate(updatedAt)} />
        </dl>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="publicationState" className={deskLabel}>
            Publication
          </label>
          <Select
            id="publicationState"
            name="publicationState"
            defaultValue={publicationState}
            onValueChange={setPublicationState}
            options={PUBLICATION_STATES.map((s) => ({
              value: s,
              label: s === "draft" ? "Draft — not on the site" : s === "published" ? "Published" : "Archived",
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="listingStatus" className={deskLabel}>
            Status
          </label>
          <Select
            id="listingStatus"
            name="listingStatus"
            defaultValue={listingStatus}
            onValueChange={setListingStatus}
            options={LISTING_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </div>

      <p
        // Gold marks the live state with a spine and the text colour, never a
        // fill (docs/ADMIN_DESK.md §2).
        className={`flex items-center gap-2.5 rounded-lg border border-line-soft bg-raise px-4 py-3 text-[12.5px] ${
          isLive ? "border-l-[3px] border-l-gold text-gold-deep" : "text-muted"
        }`}
      >
        <span aria-hidden>{isLive ? "●" : "○"}</span>
        {isLive
          ? "Live on the public site."
          : "Not on the public site. Only a published listing marked Available appears publicly."}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="addedBy" className={deskLabel}>
            Added by
          </label>
          <Select
            id="addedBy"
            name="addedBy"
            defaultValue={addedBy}
            onValueChange={setAddedBy}
            options={ADDED_BY.map((s) => ({ value: s, label: s }))}
          />
        </div>

        {/* Only asked when it means something — "source name" against our own
            listing is a field a broker would rightly skip. */}
        {needsSource && (
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
        )}
      </div>

      {/* Carries the value when the field above is not rendered, so switching
          back to Global Landmark clears the stale name instead of leaving it
          orphaned on the row. */}
      {!needsSource && <input type="hidden" name="sourceName" value="" />}
    </FormSection>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className={`text-[13px] text-ink ${mono ? "tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}


/** Status pill for the admin list. Colours come from the taxonomy. */
/**
 * Listing status, as the desk draws a state.
 *
 * Was a square uppercase badge with its own border/background/text triple per
 * status. It is a Chip now so the properties table and the status legend above
 * it stop disagreeing — they were two different shapes for the same value.
 *
 * An unknown status still renders rather than throwing: the column is data
 * from the database, and a row whose status predates the taxonomy should show
 * what it holds, not vanish.
 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <Chip tone={STATUS_TONE[status as ListingStatus] ?? "neutral"}>{status}</Chip>
  );
}
