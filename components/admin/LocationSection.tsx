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
 *
 * The map pin lives here too, behind its own publish toggle — see the
 * comment on that field group below.
 */

/** The checkbox shape ChecklistField already uses across the admin. */
const CHECKBOX =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-white transition-colors checked:border-gold checked:bg-gold";

export function LocationSection({
  location: initialLocation,
  city: initialCity,
  locality: initialLocality,
  sector: initialSector,
  block: initialBlock,
  society: initialSociety,
  tower: initialTower,
  floorNumber: initialFloorNumber,
  totalFloors: initialTotalFloors,
  unitNumber: initialUnitNumber,
  latitude: initialLatitude,
  longitude: initialLongitude,
  showMapPublicly: initialShowMapPublicly,
}: {
  location?: string | null;
  city?: string | null;
  locality?: string | null;
  sector?: string | null;
  block?: string | null;
  society?: string | null;
  /** The linked tower's name, if any — resolved to `towerId` server-side. */
  tower?: string | null;
  floorNumber?: number | null;
  totalFloors?: number | null;
  unitNumber?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  showMapPublicly?: boolean | null;
}) {
  const [city, setCity] = useState(initialCity ?? "");
  const [locality, setLocality] = useState(initialLocality ?? "");
  const [location, setLocation] = useState(initialLocation ?? "");
  const [latitude, setLatitude] = useState(initialLatitude ?? "");
  const [longitude, setLongitude] = useState(initialLongitude ?? "");
  /**
   * Default OFF, and deliberately not `?? true` — the same rule as
   * showPricePublicly, for a sharper reason. A launched project wants to be
   * findable; a private resale kothi whose owner details are internal does
   * not want its front door on a public map, and a pin published by
   * accident cannot be unpublished from whoever already screenshotted it.
   */
  const [showMapPublicly, setShowMapPublicly] = useState(
    initialShowMapPublicly ?? false
  );
  const hasPin = latitude.trim() !== "" && longitude.trim() !== "";

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

      <div className="flex flex-col gap-2">
        <label htmlFor="towerName" className={LABEL}>
          Tower
        </label>
        <input
          id="towerName"
          name="towerName"
          type="text"
          maxLength={200}
          defaultValue={initialTower ?? ""}
          placeholder="Tower A (leave empty for a single listing)"
          className={FIELD}
        />
        <p className="font-sans text-meta text-ink-muted">
          An unknown name creates the tower under the selected project — the
          same way an unknown project name creates the project.
        </p>
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="latitude" className={LABEL}>
            Latitude
          </label>
          <input
            id="latitude"
            name="latitude"
            type="text"
            inputMode="decimal"
            maxLength={40}
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="30.6942"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="longitude" className={LABEL}>
            Longitude
          </label>
          <input
            id="longitude"
            name="longitude"
            type="text"
            inputMode="decimal"
            maxLength={40}
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="76.8606"
            className={FIELD}
          />
        </div>
      </div>
      <p className="font-sans text-meta text-ink-muted">
        Right-click the spot in Google Maps and copy the two numbers it shows.
        Storing them does nothing on its own — the box below is what puts a
        pin on the public page.
      </p>

      {/* Hidden "false" first, then the checkbox carrying "true": an
          unchecked checkbox submits nothing at all, and parseBool() on the
          server reads every value for this name rather than the first. Same
          pairing as showPricePublicly, and it matters for the same reason —
          a stuck true here keeps publishing a location the client asked to
          keep off the map. */}
      <div className="flex flex-col gap-2 border border-border bg-white p-4">
        <input type="hidden" name="showMapPublicly" value="false" />
        <label className="flex cursor-pointer items-start gap-2.5 font-sans text-body text-ink">
          <input
            type="checkbox"
            name="showMapPublicly"
            value="true"
            checked={showMapPublicly}
            onChange={(e) => setShowMapPublicly(e.target.checked)}
            className={`${CHECKBOX} mt-1`}
          />
          Show this property on a map on the public site
        </label>
        <p
          className={`font-sans text-meta ${
            showMapPublicly && hasPin ? "text-gold-deep" : "text-ink-muted"
          }`}
        >
          {showMapPublicly
            ? hasPin
              ? "On — the property page shows a map pin, rounded to roughly a 100 m area rather than the exact doorstep."
              : "On, but there are no coordinates yet — nothing will render until latitude and longitude are filled in."
            : "Off — the coordinates stay in the admin. They are not sent to the browser at all, so there is nothing on the public page to read out of devtools."}
        </p>
      </div>
    </FormSection>
  );
}
