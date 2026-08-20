"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection, countFilled } from "./FormSection";
import { CITY_NAMES, localitiesIn } from "@/lib/locations";
import { withEmptyOption } from "@/lib/attributes";

/**
 * CFF group 3 — Location. Public.
 *
 * City comes from the shared taxonomy in lib/locations.ts rather than free
 * text, because the public filter tabs read the same list: free-typed
 * "Mohali " with a trailing space would silently create a listing no tab can
 * find. Locality narrows to the selected city for the same reason, and the
 * server re-checks the pairing — a locality that belongs to another city is
 * dropped rather than saved.
 *
 * The free-text `location` line stays: it is what renders on the card and on
 * the detail page, and it carries the detail a taxonomy cannot ("Sector 62,
 * Phase 8"). City and locality are for filtering.
 */
export function LocationSection({
  location: initialLocation,
  city: initialCity,
  locality: initialLocality,
  sector: initialSector,
  block: initialBlock,
  society: initialSociety,
  floorNumber: initialFloorNumber,
  totalFloors: initialTotalFloors,
  unitNumber: initialUnitNumber,
}: {
  location?: string | null;
  city?: string | null;
  locality?: string | null;
  sector?: string | null;
  block?: string | null;
  society?: string | null;
  floorNumber?: number | null;
  totalFloors?: number | null;
  unitNumber?: string | null;
}) {
  const [city, setCity] = useState(initialCity ?? "");
  const [locality, setLocality] = useState(initialLocality ?? "");
  const [location, setLocation] = useState(initialLocation ?? "");

  const localities = localitiesIn(city);

  function chooseCity(next: string) {
    setCity(next);
    // A locality from the previous city is meaningless under the new one.
    setLocality("");
  }

  const filled = countFilled([location, city, locality]);

  return (
    <FormSection
      title="Location"
      hint="City drives the public filter tabs and the reference code"
      filled={filled}
      total={3}
      defaultOpen
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="location" className={LABEL}>
          Address line
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          maxLength={300}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Sector 62, Mohali (Phase 8)"
          className={FIELD}
        />
        <p className="font-sans text-meta text-ink-muted">
          Shown on the card and the property page, exactly as written.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="city" className={LABEL}>
            City
          </label>
          <Select
            id="city"
            name="city"
            defaultValue={city}
            onValueChange={chooseCity}
            options={withEmptyOption("— Select a city —", CITY_NAMES)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="locality" className={LABEL}>
            Locality
          </label>
          {localities.length > 0 ? (
            <Select
              // Remounts when the city changes so the list and the selected
              // value cannot disagree.
              key={`locality-${city}`}
              id="locality"
              name="locality"
              defaultValue={locality}
              onValueChange={setLocality}
              options={withEmptyOption(
                "— Select a locality —",
                localities.map((l) => l.name)
              )}
            />
          ) : (
            <>
              <input
                id="locality"
                type="text"
                disabled
                placeholder="Choose a city first"
                className={`${FIELD} cursor-not-allowed opacity-50`}
              />
              {/* Still submit an empty value so clearing the city clears the
                  stored locality instead of leaving a stale one behind. */}
              <input type="hidden" name="locality" value="" />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="sector" className={LABEL}>
            Sector
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            maxLength={120}
            defaultValue={initialSector ?? ""}
            placeholder="Sector 20"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="block" className={LABEL}>
            Block
          </label>
          <input
            id="block"
            name="block"
            type="text"
            maxLength={120}
            defaultValue={initialBlock ?? ""}
            placeholder="Block C"
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="society" className={LABEL}>
          Society / project
        </label>
        <input
          id="society"
          name="society"
          type="text"
          maxLength={200}
          defaultValue={initialSociety ?? ""}
          placeholder="Green Lotus Saksham"
          className={FIELD}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="floorNumber" className={LABEL}>
            Floor number
          </label>
          <input
            id="floorNumber"
            name="floorNumber"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={initialFloorNumber ?? ""}
            placeholder="4"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="totalFloors" className={LABEL}>
            Total floors
          </label>
          <input
            id="totalFloors"
            name="totalFloors"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={initialTotalFloors ?? ""}
            placeholder="12"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="unitNumber" className={LABEL}>
            Unit number
          </label>
          <input
            id="unitNumber"
            name="unitNumber"
            type="text"
            maxLength={60}
            defaultValue={initialUnitNumber ?? ""}
            placeholder="404"
            className={FIELD}
          />
        </div>
      </div>
    </FormSection>
  );
}
