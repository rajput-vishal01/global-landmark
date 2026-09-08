"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { deskButton, deskButtonSmall } from "@/components/admin/desk";
import { FormSection, countFilled, deskFieldFull, deskLabel } from "./FormSection";

import { SELLER_CATEGORIES, OWNER_TYPES, withEmptyOption } from "@/lib/attributes";

/**
 * CFF group 8 — Ownership. The most sensitive field group on the entire
 * site: names, personal mobile numbers and home addresses of people who are
 * not our customers and never agreed to appear anywhere.
 *
 * The protection is structural, not a flag. Owner rows live on the separate
 * `property_owners` table (lib/db/schema.ts) which lib/db/queries.ts never
 * imports, so there is no public query that can reach them even by mistake —
 * no `isPublic` boolean to forget, no column to accidentally add to
 * PUBLIC_PROPERTY_COLUMNS. Separation is by table. Keep it that way: if
 * something here ever needs to be public, copy the value onto `properties`
 * rather than opening a read path to this table.
 *
 * MULTIPLE owners per property, not one fixed block. Joint ownership is the
 * norm in this market — husband and wife on the deed, three brothers on
 * inherited land, a builder plus the original landowner — and a form that
 * asks for one name forces the broker to cram the rest into a notes field
 * where nothing can be searched or dialled.
 */

type OwnerInput = {
  name?: string | null;
  sellerCategory?: string | null;
  ownerType?: string | null;
  ownerCount?: number | string | null;
  mobile?: string | null;
  altMobile?: string | null;
  address?: string | null;
  notes?: string | null;
};

/**
 * `id` is client-side only and never emitted. It exists because each row
 * contains two <Select>s, and Select is uncontrolled — it owns its value in
 * internal state seeded from `defaultValue`. Keyed by array index, deleting
 * row 1 would leave row 2's Select instance mounted and still showing row
 * 1's category. A stable per-row id makes React unmount the right instance.
 */
type OwnerRow = {
  id: number;
  name: string;
  sellerCategory: string;
  ownerType: string;
  ownerCount: string;
  mobile: string;
  altMobile: string;
  address: string;
  notes: string;
};

/** parseOwners() in lib/admin/property-parse.ts rejects a longer list. */
const MAX_OWNERS = 10;

function toRow(input: OwnerInput, id: number): OwnerRow {
  return {
    id,
    name: input.name ?? "",
    sellerCategory: input.sellerCategory ?? "",
    ownerType: input.ownerType ?? "",
    ownerCount: input.ownerCount === null || input.ownerCount === undefined
      ? ""
      : String(input.ownerCount),
    mobile: input.mobile ?? "",
    altMobile: input.altMobile ?? "",
    address: input.address ?? "",
    notes: input.notes ?? "",
  };
}

/**
 * Only digits survive to the wire. `ownerCount` goes as a real number so the
 * server does not have to guess whether "" means zero owners or unanswered.
 */
function toPayload(row: OwnerRow) {
  const count = Number.parseInt(row.ownerCount, 10);
  return {
    name: row.name,
    sellerCategory: row.sellerCategory,
    ownerType: row.ownerType,
    ownerCount: Number.isFinite(count) ? count : null,
    mobile: row.mobile,
    altMobile: row.altMobile,
    address: row.address,
    notes: row.notes,
  };
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Preserves a leading + so an NRI seller's number still dials correctly;
 * everything else a broker types (spaces, dashes, brackets) is dropped
 * because a dialler chokes on them.
 */
function telHref(mobile: string): string {
  const trimmed = mobile.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `tel:${prefix}${onlyDigits(trimmed)}`;
}

/**
 * wa.me needs a country code and no punctuation. A bare 10-digit number is
 * what everyone here types, so assume India rather than producing a link
 * that silently opens WhatsApp on an unknown contact.
 */
function whatsappHref(mobile: string): string {
  const d = onlyDigits(mobile);
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
}

/** Below 10 digits the number is half-typed; a dead link is worse than none. */
function isDialable(mobile: string): boolean {
  return onlyDigits(mobile).length >= 10;
}

export function OwnersEditor({ initial }: { initial: OwnerInput[] }) {
  const [rows, setRows] = useState<OwnerRow[]>(() =>
    (initial.length ? initial : [{}]).map(toRow)
  );
  const nextId = useRef(rows.length);

  function update(id: number, patch: Partial<OwnerRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function remove(id: number) {
    setRows((prev) =>
      prev.length === 1
        ? [toRow({}, nextId.current++)]
        : prev.filter((row) => row.id !== id)
    );
  }

  // A row is "filled" once it has a name — that is also the row the server
  // keeps, so the count matches what actually saves.
  const filled = countFilled(rows.map((row) => row.name));

  return (
    <FormSection
      title="Ownership"
      hint="Internal only — owner contacts never appear on the public site"
      filled={filled}
      total={rows.length}
    >
      {/* Deliberately loud. This is the one section where a mistaken
          assumption about visibility would publish a private person's phone
          number, so the warning is not a muted hint like the other groups. */}
      <p className="flex items-start gap-3 rounded-lg border border-error bg-error/5 px-4 py-3 text-[12px] text-error">
        <span aria-hidden className="shrink-0">
          ▲
        </span>
        <span>
          <strong className="font-medium">Internal only — never published.</strong>{" "}
          Owner names, phone numbers, addresses and notes are stored apart from
          the listing and are not shown on the website, in search results, or in
          any enquiry sent to a buyer. They are visible only inside this admin
          panel.
        </span>
      </p>

      <input
        type="hidden"
        name="ownersJson"
        value={JSON.stringify(
          rows.filter((row) => row.name.trim()).map(toPayload)
        )}
      />

      {rows.map((row, i) => (
        <div
          key={row.id}
          className="flex flex-col gap-4 rounded-lg border border-line-soft bg-raise p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              Owner {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(row.id)}
              aria-label={`Remove owner ${i + 1}`}
              className="cursor-pointer px-1.5 py-1 text-error hover:opacity-70"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`owner-${row.id}-name`} className={deskLabel}>
              Name
            </label>
            <input
              id={`owner-${row.id}-name`}
              type="text"
              maxLength={200}
              value={row.name}
              onChange={(e) => update(row.id, { name: e.target.value })}
              placeholder="Full name as on the deed"
              className={deskFieldFull}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`owner-${row.id}-seller`} className={deskLabel}>
                Seller category
              </label>
              {/* The Select's own hidden input is namespaced per row so it
                  cannot collide with a real form field — the value that gets
                  saved travels in ownersJson above, not through this name. */}
              <Select
                id={`owner-${row.id}-seller`}
                name={`owners.${row.id}.sellerCategory`}
                defaultValue={row.sellerCategory}
                onValueChange={(value) =>
                  update(row.id, { sellerCategory: value })
                }
                options={withEmptyOption("Not set", SELLER_CATEGORIES)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`owner-${row.id}-type`} className={deskLabel}>
                Owner type
              </label>
              <Select
                id={`owner-${row.id}-type`}
                name={`owners.${row.id}.ownerType`}
                defaultValue={row.ownerType}
                onValueChange={(value) => update(row.id, { ownerType: value })}
                options={withEmptyOption("Not set", OWNER_TYPES)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor={`owner-${row.id}-count`} className={deskLabel}>
                Owners on deed
              </label>
              <input
                id={`owner-${row.id}-count`}
                type="number"
                min={1}
                max={50}
                inputMode="numeric"
                value={row.ownerCount}
                onChange={(e) => update(row.id, { ownerCount: e.target.value })}
                placeholder="e.g. 3"
                className={deskFieldFull}
              />
            </div>

            {/* type="tel" + inputMode="numeric" so a phone opens the number
                pad, not the alphabet. Brokers fill this one-handed standing
                at a site visit; every extra keyboard switch is a typo. */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`owner-${row.id}-mobile`} className={deskLabel}>
                Mobile
              </label>
              <input
                id={`owner-${row.id}-mobile`}
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength={40}
                value={row.mobile}
                onChange={(e) => update(row.id, { mobile: e.target.value })}
                placeholder="98765 43210"
                className={deskFieldFull}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`owner-${row.id}-alt`} className={deskLabel}>
                Alternate mobile
              </label>
              <input
                id={`owner-${row.id}-alt`}
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength={40}
                value={row.altMobile}
                onChange={(e) => update(row.id, { altMobile: e.target.value })}
                placeholder="Optional"
                className={deskFieldFull}
              />
            </div>
          </div>

          {/* Dialling from the row beats copying a number into the phone app
              — that copy step is where digits get dropped. */}
          {isDialable(row.mobile) && (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={telHref(row.mobile)}
                className={deskButtonSmall}
              >
                Call
              </a>
              <a
                href={whatsappHref(row.mobile)}
                target="_blank"
                rel="noopener noreferrer"
                className={deskButtonSmall}
              >
                WhatsApp
              </a>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor={`owner-${row.id}-address`} className={deskLabel}>
              Address
            </label>
            <input
              id={`owner-${row.id}-address`}
              type="text"
              maxLength={500}
              value={row.address}
              onChange={(e) => update(row.id, { address: e.target.value })}
              placeholder="Correspondence address"
              className={deskFieldFull}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={`owner-${row.id}-notes`} className={deskLabel}>
              Notes
            </label>
            <textarea
              id={`owner-${row.id}-notes`}
              rows={2}
              maxLength={1000}
              value={row.notes}
              onChange={(e) => update(row.id, { notes: e.target.value })}
              placeholder="Availability, who to call first, negotiating position"
              className={deskFieldFull}
            />
          </div>
        </div>
      ))}

      {rows.length < MAX_OWNERS && (
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [...prev, toRow({}, nextId.current++)])
          }
          className={`${deskButton} w-fit`}
        >
          + Add another owner
        </button>
      )}

      <p className="text-[11.5px] text-muted">
        Rows without a name are discarded on save.
      </p>
    </FormSection>
  );
}
