"use client";

import { useActionForm } from "@/lib/use-action-form";
import { LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { requestTour, type TourState } from "@/app/(site)/tours/actions";
import { TOUR_TIMES, TOUR_TYPES } from "@/lib/taxonomy/tours";

const FIELD_CLASSES =
  "w-full appearance-none rounded-none border-b border-border bg-transparent py-3 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none";

const initialState: TourState = { status: "idle" };

/**
 * "Schedule a Tour" (Phase E).
 *
 * A native `<input type="date">` rather than a picker component: the browser
 * already owns a date picker that works with a keyboard, a screen reader and
 * a thumb, and `min` keeps a visitor from asking for yesterday. The time is
 * a slot from a fixed list, because a broker's diary runs in blocks and
 * "after 4ish" is not something an inbox can sort.
 */
export function TourRequestForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: number;
  propertyTitle: string;
}) {
  const { state, isPending, formProps } = useActionForm(requestTour, initialState);

  if (state.status === "sent") {
    return (
      <div className="flex max-w-xl flex-col gap-5 border border-border bg-white p-8">
        <span aria-hidden className="block h-px w-12 bg-gold" />
        <h3 className="font-serif text-h3 text-ink">Your visit request is in</h3>
        <p className="text-pretty text-body font-sans text-ink-muted">
          We will call to confirm the slot for {propertyTitle}. Requests are
          answered within one business day.
        </p>
      </div>
    );
  }

  // `toISOString` is UTC; the site's audience is IST, so an evening visitor
  // would otherwise be offered a `min` of tomorrow. Format the local date.
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <form {...formProps} className="flex max-w-xl flex-col gap-8">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <input type="hidden" name="propertyId" value={propertyId} />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="tourType" className={LABEL}>
            Tour type
          </label>
          <Select
            id="tourType"
            name="tourType"
            defaultValue={TOUR_TYPES[0]}
            options={TOUR_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="preferredDate" className={LABEL}>
            Preferred date
          </label>
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            min={minDate}
            className={FIELD_CLASSES}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="preferredTime" className={LABEL}>
          Preferred time
        </label>
        <Select
          id="preferredTime"
          name="preferredTime"
          defaultValue={TOUR_TIMES[2]}
          options={TOUR_TIMES.map((t) => ({ value: t, label: t }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="tourName" className={LABEL}>
            Name
            <Req />
          </label>
          <input
            id="tourName"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={FIELD_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="tourPhone" className={LABEL}>
            Phone
            <Req />
          </label>
          <input
            id="tourPhone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            className={FIELD_CLASSES}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tourEmail" className={LABEL}>
          Email <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input
          id="tourEmail"
          name="email"
          type="email"
          autoComplete="email"
          className={FIELD_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tourMessage" className={LABEL}>
          Anything we should know{" "}
          <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <textarea id="tourMessage" name="message" rows={3} className={FIELD_CLASSES} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-meta font-sans text-error">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="text-eyebrow w-fit cursor-pointer bg-ink px-10 py-4 font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Request this tour"}
      </button>
    </form>
  );
}
