"use client";

import { useActionForm } from "@/lib/use-action-form";
import { FIELD, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { SellPhotoUpload } from "@/components/SellPhotoUpload";
import { submitProperty, type ListPropertyState } from "@/app/(site)/sell/actions";
import { AREA_UNITS } from "@/lib/taxonomy/area";
import { CONFIGURATIONS, PROPERTY_TYPES } from "@/lib/taxonomy/property";
import { CITY_NAMES } from "@/lib/locations";

const initialState: ListPropertyState = { status: "idle" };

const OPTIONAL = <span className="normal-case text-ink-muted">(optional)</span>;

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
      <div className="flex flex-col gap-5 border border-border bg-white p-8 md:p-12">
        <span aria-hidden className="block h-px w-12 bg-gold" />
        <h2 className="font-serif text-h3 text-ink">Thank you — we have your property</h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          Our executive will call you to confirm the details and
          arrange photographs. Nothing appears on the site until you and we
          have agreed what it says.
        </p>
      </div>
    );
  }

  return (
    <form {...formProps} className="flex flex-col gap-10">
      {/* Honeypot — hidden from real users, tempting to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <fieldset className="flex flex-col gap-8">
        <legend className="mb-2 font-serif text-h4 text-ink">About you</legend>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="ownerName" className={LABEL}>
              Your name
              <Req />
            </label>
            <input id="ownerName" name="ownerName" type="text" required autoComplete="name" className={FIELD} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="mobile" className={LABEL}>
              Phone
              <Req />
            </label>
            <input id="mobile" name="mobile" type="tel" required autoComplete="tel" className={FIELD} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="email" className={LABEL}>
              Email {OPTIONAL}
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className={FIELD} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-8">
        <legend className="mb-2 font-serif text-h4 text-ink">The property</legend>

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
            className={FIELD}
          />
          <p className="text-meta font-sans text-ink-muted">
            A single line a buyer would recognise. We will polish it with you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={LABEL}>I want to</span>
            <Select
              name="category"
              aria-label="I want to"
              defaultValue="sale"
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
            <input id="locality" name="locality" type="text" className={FIELD} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sector" className={LABEL}>
              Sector {OPTIONAL}
            </label>
            <input id="sector" name="sector" type="text" className={FIELD} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="address" className={LABEL}>
              Address {OPTIONAL}
            </label>
            <input id="address" name="address" type="text" className={FIELD} />
            <p className="text-meta font-sans text-ink-muted">
              Kept private. It is never shown on the site.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="areaValue" className={LABEL}>
              Area {OPTIONAL}
            </label>
            <input id="areaValue" name="areaValue" type="text" inputMode="numeric" className={FIELD} />
          </div>
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Unit</span>
            <Select
              name="areaUnit"
              aria-label="Area unit"
              defaultValue="sqft"
              options={AREA_UNITS.map((u) => ({ value: u.value, label: u.label }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="expectedPrice" className={LABEL}>
              Expected price {OPTIONAL}
            </label>
            <input id="expectedPrice" name="expectedPrice" type="text" inputMode="numeric" className={FIELD} />
            <p className="text-meta font-sans text-ink-muted">In rupees. Kept private.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={LABEL}>
            Anything else {OPTIONAL}
          </label>
          <textarea id="description" name="description" rows={5} className={`${FIELD} resize-y`} />
        </div>

        {/* Last, and optional. Asking for photographs before the address
            would make the form feel like work; by this point the seller has
            already described the property and is most likely to add them. */}
        <div className="flex flex-col gap-2">
          <span className={LABEL}>Photos {OPTIONAL}</span>
          <SellPhotoUpload />
        </div>
      </fieldset>

      {state.status === "error" && (
        <p role="alert" className="text-meta font-sans text-error">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={isPending}
          className="text-eyebrow cursor-pointer bg-cta px-8 py-4 font-sans font-semibold uppercase tracking-[0.18em] text-cta-ink transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Submit property"}
        </button>
        <p className="text-meta font-sans text-ink-muted">
          Fields marked <Req /> are required.
        </p>
      </div>
    </form>
  );
}
