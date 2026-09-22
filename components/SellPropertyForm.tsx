"use client";

import type { ReactNode } from "react";
import { useActionForm } from "@/lib/use-action-form";
import { LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SellPhotoUpload } from "@/components/SellPhotoUpload";
import { submitProperty, type ListPropertyState } from "@/app/(site)/sell/actions";
import { AREA_UNITS } from "@/lib/taxonomy/area";
import { CONFIGURATIONS, PROPERTY_TYPES } from "@/lib/taxonomy/property";
import { CITY_NAMES } from "@/lib/locations";

const initialState: ListPropertyState = { status: "idle" };

const OPTIONAL = <span className="font-normal normal-case tracking-normal text-ink-muted">(optional)</span>;

/**
 * Boxed fields for this form. The site's shared FIELD is a bare underline,
 * which on a long form reads as a page of loose lines; a seller filling in
 * ten fields needs to see where each one starts and ends.
 */
const BOX =
  "w-full rounded-none border border-border bg-white px-4 py-3 font-sans text-body text-ink placeholder:text-ink-muted/60 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20";

/** The custom Select, boxed to match: its own trigger underline is dropped. */
const SELECT_BOX =
  "border border-border bg-white px-4 transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 [&>button]:border-b-0 [&>button]:py-3";

const HINT = "text-meta font-sans text-ink-muted";

/** One numbered part of the form: a gold index, a title, a line of help. */
function Part({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-6 border-t border-border pt-8 first-of-type:border-t-0 first-of-type:pt-0">
      {/* Legends sit outside the fieldset's flex flow, so the gap below
          them is a margin, not the fieldset's gap. */}
      <legend className="mb-6 w-full">
        <span className="flex items-baseline gap-4">
          <span aria-hidden className="font-serif text-h3 leading-none text-gold">
            {n}
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-serif text-h4 text-heading">{title}</span>
            <span className={HINT}>{note}</span>
          </span>
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * The seller-facing half of the admin property form.
 *
 * Deliberately NOT the admin PropertyForm itself. That form is twenty
 * sections long and most of it is internal — owner notes, brokerage, circle
 * rate, the document vault, internal legal flags — none of which a seller
 * should see, let alone fill in. What is reused is the part that matters:
 * the same vocabulary (PROPERTY_TYPES, CONFIGURATIONS, AREA_UNITS,
 * CITY_NAMES) and the same field components, so a submission lands in
 * exactly the shape the admin form will open it in.
 *
 * Only three fields are required. Everything else is a conversation the
 * broker will have on the review call, and a long required form is how you
 * lose the seller before they finish it.
 */
export function SellPropertyForm() {
  const { state, isPending, formProps } = useActionForm(submitProperty, initialState);

  if (state.status === "sent") {
    return (
      <div
        role="status"
        // The form it replaces is long; on a phone the seller has scrolled to
        // its bottom, so bring the confirmation to where they are looking.
        ref={(el) => el?.scrollIntoView({ block: "center", behavior: "smooth" })}
        className="flex flex-col items-start gap-5 border border-border border-t-2 border-t-gold bg-white p-8 shadow-[0_30px_60px_-40px_rgba(40,30,15,0.45)] md:p-12"
      >
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold-deep"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="font-serif text-h3 text-heading">Thank you — we have your property</h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          Our executive will call you to confirm the details and
          arrange photographs. Nothing appears on the site until you and we
          have agreed what it says.
        </p>
        <Button href="/properties" variant="outline">
          Browse our listings
        </Button>
      </div>
    );
  }

  return (
    <form
      {...formProps}
      className="flex flex-col gap-10 border border-border bg-white p-6 shadow-[0_30px_60px_-40px_rgba(40,30,15,0.45)] sm:p-8 md:p-10"
    >
      {/* Honeypot — hidden from real users, tempting to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <Part n="01" title="About you" note="So our executive can reach you.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="ownerName" className={LABEL}>
              Your name
              <Req />
            </label>
            <input id="ownerName" name="ownerName" type="text" required autoComplete="name" className={BOX} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="mobile" className={LABEL}>
              Phone
              <Req />
            </label>
            <input id="mobile" name="mobile" type="tel" required autoComplete="tel" className={BOX} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="email" className={LABEL}>
              Email {OPTIONAL}
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className={BOX} />
          </div>
        </div>
      </Part>

      <Part n="02" title="The property" note="Only the title is required. The rest we can fill in together.">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={LABEL}>
            Title
            <Req />
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="3 BHK in Sector 20, Panchkula"
            className={BOX}
          />
          <p className={HINT}>A single line a buyer would recognise. We will polish it with you.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={LABEL}>I want to</span>
            <Select
              name="category"
              aria-label="I want to"
              defaultValue="sale"
              className={SELECT_BOX}
              options={[
                { value: "sale", label: "Sell" },
                { value: "lease", label: "Rent out" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Property type {OPTIONAL}</span>
            <Select
              name="propertyType"
              aria-label="Property type"
              className={SELECT_BOX}
              options={[
                { value: "", label: "— Select —" },
                ...PROPERTY_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className={LABEL}>City {OPTIONAL}</span>
            <Select
              name="city"
              aria-label="City"
              className={SELECT_BOX}
              options={[
                { value: "", label: "— Select —" },
                ...CITY_NAMES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Configuration {OPTIONAL}</span>
            <Select
              name="configuration"
              aria-label="Configuration"
              className={SELECT_BOX}
              options={[
                { value: "", label: "— Select —" },
                ...CONFIGURATIONS.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="locality" className={LABEL}>
              Locality {OPTIONAL}
            </label>
            <input id="locality" name="locality" type="text" className={BOX} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sector" className={LABEL}>
              Sector {OPTIONAL}
            </label>
            <input id="sector" name="sector" type="text" className={BOX} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="address" className={LABEL}>
              Address {OPTIONAL}
            </label>
            <input id="address" name="address" type="text" className={BOX} />
            <p className={HINT}>Kept private. It is never shown on the site.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_0.8fr_1.2fr]">
          <div className="flex flex-col gap-2">
            <label htmlFor="areaValue" className={LABEL}>
              Area {OPTIONAL}
            </label>
            <input id="areaValue" name="areaValue" type="text" inputMode="numeric" className={BOX} />
          </div>
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Unit</span>
            <Select
              name="areaUnit"
              aria-label="Area unit"
              defaultValue="sqft"
              className={SELECT_BOX}
              options={AREA_UNITS.map((u) => ({ value: u.value, label: u.label }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="expectedPrice" className={LABEL}>
              Expected price {OPTIONAL}
            </label>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-sans text-body text-ink-muted"
              >
                ₹
              </span>
              <input
                id="expectedPrice"
                name="expectedPrice"
                type="text"
                inputMode="numeric"
                className={`${BOX} pl-9`}
              />
            </div>
            <p className={HINT}>In rupees. Kept private.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={LABEL}>
            Anything else {OPTIONAL}
          </label>
          <textarea id="description" name="description" rows={5} className={`${BOX} resize-y`} />
        </div>
      </Part>

      {/* Last, and optional. Asking for photographs before the address
          would make the form feel like work; by this point the seller has
          already described the property and is most likely to add them. */}
      <Part n="03" title="Photos" note="Optional, but a listing with photographs gets far more enquiries.">
        <SellPhotoUpload />
      </Part>

      {state.status === "error" && (
        <p role="alert" className="border-l-2 border-error bg-error/5 px-4 py-3 text-meta font-sans text-error">
          {state.message}
        </p>
      )}

      <div className="flex flex-col-reverse items-start gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className={HINT}>
          Fields marked <Req /> are required.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="text-eyebrow w-full cursor-pointer bg-cta px-10 py-4 font-sans font-semibold uppercase tracking-[0.18em] text-cta-ink transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Sending…" : "Submit property"}
        </button>
      </div>
    </form>
  );
}
