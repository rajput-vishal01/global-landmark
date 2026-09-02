"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";
import {
  ADDED_BY,
  LISTING_STATUSES,
  PUBLICATION_STATES,
  STATUS_BADGE,
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
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-border pb-5 sm:grid-cols-3">
          <Fact label="Reference" value={refCode} mono />
          <Fact label="Listed" value={formatDate(listedAt)} />
          <Fact label="Last updated" value={formatDate(updatedAt)} />
        </dl>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="publicationState" className={LABEL}>
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
          <label htmlFor="listingStatus" className={LABEL}>
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
        className={`flex items-center gap-2.5 border px-4 py-3 font-sans text-meta ${
          isLive
            ? "border-gold bg-gold/10 text-gold-deep"
            : "border-border bg-ink/[0.03] text-ink-muted"
        }`}
      >
        <span aria-hidden>{isLive ? "●" : "○"}</span>
        {isLive
          ? "Live on the public site."
          : "Not on the public site. Only a published listing marked Available appears publicly."}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="addedBy" className={LABEL}>
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
            <label htmlFor="sourceName" className={LABEL}>
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
              className={FIELD}
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
      <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </dt>
      <dd className={`font-sans text-meta text-ink ${mono ? "tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}


/** Status pill for the admin list. Colours come from the taxonomy. */
export function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_BADGE[status as ListingStatus] ??
    "border-border bg-ink/5 text-ink-muted";
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] ${style}`}
    >
      {status}
    </span>
  );
}
