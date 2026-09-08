"use client";

import { useActionState, useState } from "react";
import type { Area } from "@/lib/db/schema";
import { cardChrome, deskButtonPrimary } from "@/components/admin/desk";
import { deskFieldFull, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { CoverImageInput } from "@/components/admin/CoverImageInput";
import { CITY_NAMES, localitiesIn } from "@/lib/locations";
import { withEmptyOption } from "@/lib/attributes";
import type { AreaFormState } from "@/app/admin/(panel)/areas/actions";

type Action = (prev: AreaFormState, formData: FormData) => Promise<AreaFormState>;

const initialState: AreaFormState = {};

const HINT = "text-[11.5px] text-muted";

/** The checkbox shape ChecklistField already uses across the admin. */
const CHECKBOX =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-line bg-surface transition-colors checked:border-gold checked:bg-gold";

/**
 * Create + edit area form (R-46).
 *
 * The two "matches" fields come from the same taxonomy the property form
 * writes with, not free text: an area matches listings by comparing these
 * against `properties.city` / `properties.locality`, so a hand-typed
 * "Mohali " with a trailing space would produce a landing page that is
 * permanently empty for a reason nobody can see.
 */
export function AreaForm({ area, action }: { area?: Area; action: Action }) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [matchCity, setMatchCity] = useState(area?.matchCity ?? "");
  const localities = localitiesIn(matchCity);

  return (
    <form action={formAction} className={`${cardChrome} flex flex-col gap-6 p-5`}>
      {area && <input type="hidden" name="id" value={area.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={deskLabel}>
          Name
          <Req />
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          defaultValue={area?.name}
          placeholder="e.g. Sector 66, Mohali"
          className={deskFieldFull}
        />
        <p className={HINT}>
          The page address is built from this. Renaming an area changes its
          link, so old links to it stop working.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className={deskLabel}>
          City
        </label>
        <Select
          id="city"
          name="city"
          options={withEmptyOption("— No city —", CITY_NAMES)}
          defaultValue={area?.city ?? ""}
        />
        <p className={HINT}>Groups the area on the public index.</p>
      </div>

      <fieldset className="flex flex-col gap-6 rounded-lg border border-line-soft p-4">
        <legend className={`px-2 ${deskLabel}`}>Which listings it claims</legend>
        <p className={HINT}>
          A listing belongs to this area when its city or its locality matches
          below. Counts are worked out live, so nothing needs re-saving when a
          property is added.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="matchCity" className={deskLabel}>
              Matches city
            </label>
            <Select
              id="matchCity"
              name="matchCity"
              options={withEmptyOption("— Any —", CITY_NAMES)}
              defaultValue={area?.matchCity ?? ""}
              onValueChange={(next) => setMatchCity(next)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="matchLocality" className={deskLabel}>
              Matches locality
            </label>
            <Select
              id="matchLocality"
              // Remounts when the city changes so the list — and the value
              // held in the hidden input — cannot be left over from the
              // previous city's localities.
              key={matchCity}
              name="matchLocality"
              options={withEmptyOption(
                localities.length ? "— Any —" : "— Pick a city first —",
                localities.map((l) => l.name)
              )}
              defaultValue={area?.matchLocality ?? ""}
            />
          </div>
        </div>

        <p className={HINT}>
          Leave both empty and the area claims nothing — a page with a
          photograph and no listings.
        </p>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <span className={deskLabel}>Cover image</span>
        <CoverImageInput name="coverImage" initial={area?.coverImage ?? null} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="blurb" className={deskLabel}>
          Blurb <span className="normal-case text-muted">(optional)</span>
        </label>
        <textarea
          id="blurb"
          name="blurb"
          rows={4}
          maxLength={1000}
          defaultValue={area?.blurb ?? ""}
          placeholder="What makes this area worth buying into."
          className={deskFieldFull}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sortOrder" className={deskLabel}>
            Sort order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            defaultValue={area?.sortOrder ?? 0}
            className={deskFieldFull}
          />
          <p className={HINT}>Lowest first; ties fall back to the name.</p>
        </div>

        <div className="flex flex-col justify-end gap-2">
          {/* An unticked checkbox submits NOTHING, so the hidden false below
              guarantees the field is present; the server reads the LAST
              value for the name. Same shape as every other admin boolean. */}
          <input type="hidden" name="isPublished" value="false" />
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={area?.isPublished ?? false}
              className={CHECKBOX}
            />
            Published
          </label>
          <p className={HINT}>Unpublished areas are invisible on the site.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className={`${deskButtonPrimary} disabled:cursor-wait disabled:opacity-60`}
        >
          {isPending ? "Saving..." : area ? "Save area" : "Add area"}
        </button>
        {state.error && (
          <p role="alert" className="text-[12px] text-error">{state.error}</p>
        )}
      </div>
    </form>
  );
}
