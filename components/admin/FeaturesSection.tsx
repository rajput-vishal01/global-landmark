"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { deskFieldFull, deskLabel } from "./FormSection";

import { ChecklistField } from "./ChecklistField";
import {
  AMENITIES,
  FURNISHINGS,
  FURNISHING_ITEMS,
  PARKING_TYPES,
  withEmptyOption,
} from "@/lib/attributes";

/**
 * The one furnishing level that makes the inventory list meaningless. Named
 * rather than inlined because it is the hinge the whole section turns on.
 */
const UNFURNISHED = "Unfurnished";

/**
 * CFF groups 9, 15 and 16 — furnishing, amenities and parking. All public.
 *
 * These three sit together because they answer the same buyer question —
 * what do I actually get with this — and because they are all checklists
 * over a fixed taxonomy, so a broker fills the section in one pass of
 * tapping rather than typing.
 *
 * Amenities is the one list that takes free text. Every project markets some
 * facility no fixed list anticipates, and the server keeps free-typed
 * amenities rather than dropping them; the rest are validated against their
 * taxonomy, so free entry there would silently vanish on save.
 */
export function FeaturesSection({
  furnishing: initialFurnishing,
  furnishingInventory,
  amenities,
  parkingTypes,
  parkingSlots: initialParkingSlots,
  showFurnishing = true,
  showAmenities = true,
  showParking = true,
}: {
  furnishing?: string | null;
  furnishingInventory?: string[] | null;
  amenities?: string[] | null;
  parkingTypes?: string[] | null;
  parkingSlots?: number | null;
  /**
   * This component bundles three CFF groups (9 furnishing, 15 amenities,
   * 16 parking) and the conditional map is per-group, not per-component: a
   * plot has no furnishing and no allotted parking bay, but a plot in a
   * gated township very much has amenities, and an industrial shed has
   * none of the three. Without these the map would be silently overridden
   * for every group but the one the caller happened to gate.
   */
  showFurnishing?: boolean;
  showAmenities?: boolean;
  showParking?: boolean;
}) {
  const [furnishing, setFurnishing] = useState(initialFurnishing ?? "");
  const [parkingSlots, setParkingSlots] = useState(
    initialParkingSlots === null || initialParkingSlots === undefined
      ? ""
      : String(initialParkingSlots)
  );

  // The checklists own their own state behind hidden JSON inputs, so the
  // header count reads the initial values only. It is a progress hint, not a
  // validation gate, so lifting that state here would buy nothing.
  const initialInventory = furnishingInventory ?? [];
  const initialAmenities = amenities ?? [];
  const initialParkingTypes = parkingTypes ?? [];

  /**
   * Listing a fridge and a wardrobe against an unfurnished flat is noise at
   * best and a dispute at handover at worst, so the inventory is only asked
   * for once furnishing says there is something to inventory. Driven off
   * live state rather than the initial prop: a broker who corrects the level
   * mid-entry sees the list appear or disappear immediately, instead of
   * after a save round-trip.
   */
  const showInventory = furnishing !== "" && furnishing !== UNFURNISHED;


  return (
    <>
      {showFurnishing && (
      <div className="flex flex-col gap-2">
        <label htmlFor="furnishing" className={deskLabel}>
          Furnishing
        </label>
        {/* Clearable. A broker who picked a level on a guess must be able to
            take it back to unknown — without an empty option the only way out
            of a wrong guess is to leave it wrong on a public listing. */}
        <Select
          id="furnishing"
          name="furnishing"
          defaultValue={furnishing}
          onValueChange={setFurnishing}
          options={withEmptyOption("— None —", FURNISHINGS)}
        />
      </div>
      )}

      {showFurnishing && showInventory ? (
        <div className="flex flex-col gap-2">
          <span className={deskLabel}>What is included</span>
          {/* Free text is on here: every flat has some item the fixed list
              never anticipated ("piano", "modular kitchen"), and furnishing
              inventory is one of the lists the server keeps free-typed values
              for rather than dropping them. */}
          <ChecklistField
            name="furnishingInventoryJson"
            options={FURNISHING_ITEMS}
            initial={initialInventory}
            allowCustom
            customPlaceholder="Add an item not listed above"
          />
        </div>
      ) : (
        // Carries an empty value while the list is not rendered, so switching
        // a listing back to Unfurnished clears the inventory instead of
        // leaving a fridge orphaned on the row with nothing on screen to
        // explain where it came from.
        <input type="hidden" name="furnishingInventoryJson" value="[]" />
      )}

      {showAmenities ? (
        <div className="flex flex-col gap-2">
          <span className={deskLabel}>Amenities</span>
          <ChecklistField
            name="amenitiesJson"
            options={AMENITIES}
            initial={initialAmenities}
            allowCustom
            customPlaceholder="Add an amenity not listed above"
          />
        </div>
      ) : (
        // A warehouse has no society amenities to list — clear rather than
        // carry a stale selection forward if the type is changed away from
        // one that had them.
        <input type="hidden" name="amenitiesJson" value="[]" />
      )}

      {showParking && (
        <>
          <div className="flex flex-col gap-2">
            <span className={deskLabel}>Parking</span>
            {/* Fixed taxonomy, so no free text — the public filters read the same
                list, and a free-typed "covered car parking" would create a
                listing no parking filter could find. */}
            <ChecklistField
              name="parkingTypesJson"
              options={PARKING_TYPES}
              initial={initialParkingTypes}
              allowCustom={false}
              columns={2}
            />
          </div>

          <div className="flex flex-col gap-2 sm:max-w-xs">
            <label htmlFor="parkingSlots" className={deskLabel}>
              Parking slots
            </label>
            {/* Kind and count are separate questions: "Covered Parking" says what
                it is, and two covered slots is a materially different listing
                from one. Held as a string so an empty box stays empty rather than
                becoming a zero the header count would read as answered. */}
            <input
              id="parkingSlots"
              name="parkingSlots"
              type="number"
              min={0}
              inputMode="numeric"
              value={parkingSlots}
              onChange={(e) => setParkingSlots(e.target.value)}
              className={deskFieldFull}
            />
          </div>
        </>
      )}
    </>
  );
}