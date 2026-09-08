"use client";

import { useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { FormSection, countFilled, deskFieldFull, deskLabel } from "./FormSection";

import { ChecklistField } from "./ChecklistField";
import {
  CONFIGURATIONS,
  CONFIGURATION_TEMPLATES,
  ROOM_FLAGS,
  isConfiguration,
  withEmptyOption,
} from "@/lib/attributes";

/**
 * CFF group 7 — Configuration. Public.
 *
 * Three things here are not the obvious thing, and each is deliberate:
 *
 * 1. A project advertises a RANGE and a unit carries one value. A society
 *    genuinely offers "2 to 4 BHK", which no single entry in CONFIGURATIONS
 *    can express — so project-kind listings get a checklist writing the
 *    `configurations` array, and unit-kind listings get a single Select
 *    writing the `configuration` column. Never both: only one of the two
 *    columns is meaningful for a given kind, and rendering both would let a
 *    broker set a range and a single value that disagree.
 *
 * 2. Legacy rows carry free text the taxonomy never had — "3+1 BHK",
 *    "2–4 BHK", "5 BHK Duplex". The server validates against CONFIGURATIONS
 *    and drops what is not on the list, so a listing like that would be
 *    silently blanked the next time anyone saved it, without anyone touching
 *    the field. The incoming value is therefore folded back into the option
 *    list so it round-trips untouched.
 *
 * 3. Picking a configuration pre-fills the room counts (R-09) but must never
 *    overwrite a hand-entered one. A broker who types 4 bedrooms and then
 *    picks "3 BHK" still has 4 bedrooms. That is why beds/baths/balconies are
 *    controlled state and not uncontrolled defaultValue inputs — we have to be
 *    able to read what is currently in them before deciding to write.
 */
export function ConfigurationSection({
  kind = "unit",
  configuration: initialConfiguration,
  configurations: initialConfigurations,
  beds: initialBeds,
  baths: initialBaths,
  balconies: initialBalconies,
  roomFlags: initialRoomFlags,
}: {
  kind?: "project" | "unit";
  configuration?: string | null;
  configurations?: string[] | null;
  beds?: number | null;
  baths?: number | null;
  balconies?: number | null;
  roomFlags?: string[] | null;
}) {
  const configured = (initialConfiguration ?? "").trim();

  const [configuration, setConfiguration] = useState(configured);
  // Held as strings, not numbers: "" is the only honest way to say "not
  // answered", and 0 balconies is a real answer that must not read as blank.
  const [beds, setBeds] = useState(numberToField(initialBeds));
  const [baths, setBaths] = useState(numberToField(initialBaths));
  const [balconies, setBalconies] = useState(numberToField(initialBalconies));

  const [roomFlags, setRoomFlags] = useState<string[]>(initialRoomFlags ?? []);
  // Bumped only when a template adds a room the broker had not ticked — see
  // mergeRooms() for why a remount is the mechanism.
  const [roomsKey, setRoomsKey] = useState(0);
  const roomsRef = useRef<HTMLDivElement>(null);

  const isProject = kind === "project";

  /**
   * Point 2 above. A stored value outside the taxonomy is prepended as its own
   * option so the Select can show it and submit it back unchanged — without
   * this it would render as "Select", and the first save of an unrelated field
   * would write an empty configuration over a value nobody touched.
   */
  const legacyValue = configured && !isConfiguration(configured) ? [configured] : [];
  const configurationOptions = withEmptyOption("— Select a configuration —", [
    ...legacyValue,
    ...CONFIGURATIONS,
  ]);

  /**
   * A project row created before the range field existed carries its value in
   * the singular column, so fall back to it rather than starting the checklist
   * empty and dropping what was there. ChecklistField already surfaces values
   * outside the taxonomy as removable chips, which covers point 2 on this side.
   */
  const configurationsInitial =
    initialConfigurations && initialConfigurations.length > 0
      ? initialConfigurations
      : configured
        ? [configured]
        : [];

  /**
   * R-09. Fill beds / baths / balconies from the template ONLY where the field
   * is still blank, and union the template's rooms into what is already ticked
   * instead of replacing it. The template is a starting point, never a
   * constraint — everything it writes stays hand-editable afterwards.
   *
   * Only the unit Select runs this. A project advertises a range, and there is
   * no single bedroom count a range implies.
   */
  function applyConfiguration(value: string) {
    setConfiguration(value);

    const template = isConfiguration(value)
      ? CONFIGURATION_TEMPLATES[value]
      : undefined;
    if (!template) return; // cleared, or a legacy value with no template

    setBeds((prev) => keepOrFill(prev, template.beds));
    setBaths((prev) => keepOrFill(prev, template.baths));
    setBalconies((prev) => keepOrFill(prev, template.balconies));
    mergeRooms(template.rooms);
  }

  /**
   * ChecklistField owns its own checked state and exposes no change callback,
   * so the only live reading of what the broker has ticked is the hidden input
   * it submits. Read that first, union the template's rooms onto it, then
   * remount the widget with the merged list as its new `initial` — the same
   * key-remount trick LocationSection uses when the city changes.
   *
   * Reading before writing is the whole point: handing the widget the template
   * list alone would wipe a Pooja Room the broker ticked a moment earlier.
   */
  function mergeRooms(rooms: readonly string[]) {
    if (rooms.length === 0) return;

    const live = readCheckedRooms(roomsRef.current) ?? roomFlags;
    const added = rooms.filter((room) => !live.includes(room));
    if (added.length === 0) return; // nothing new — leave the widget alone

    setRoomFlags([...live, ...added]);
    setRoomsKey((key) => key + 1);
  }

  /**
   * Room flags are excluded from the count on purpose: most listings
   * legitimately have none (a plot has no servant room), so counting them
   * would leave every such section stuck one short of complete and train
   * brokers to ignore the number entirely.
   *
   * On the project side this reflects the saved value rather than live ticks,
   * because the checklist owns that state — it catches up on the next save.
   */
  const filled = countFilled([
    isProject ? configurationsInitial : configuration,
    beds,
    baths,
    balconies,
  ]);

  return (
    <FormSection
      title="Configuration"
      hint={
        isProject
          ? "Projects advertise a range — tick every layout on offer"
          : "Picking a layout fills the counts below; typed values are kept"
      }
      filled={filled}
      total={4}
    >
      <div className="flex flex-col gap-2">
        <span className={deskLabel}>
          {isProject ? "Configurations on offer" : "Configuration"}
        </span>

        {isProject ? (
          /* allowCustom stays off (its default): the server drops values
             outside the taxonomy, so a free-typed range would vanish on save
             and the admin would be left wondering where it went. */
          <ChecklistField
            name="configurationsJson"
            options={CONFIGURATIONS}
            initial={configurationsInitial}
          />
        ) : (
          <Select
            id="configuration"
            name="configuration"
            defaultValue={configuration}
            onValueChange={applyConfiguration}
            options={configurationOptions}
          />
        )}

        <p className="text-[11.5px] text-muted">
          &ldquo;+1&rdquo; is a servant room on top of the bedroom count, not an
          extra bedroom — a 3+1 is a 3-bedroom with servant quarters.
        </p>
      </div>

      {/* One column on a phone. Brokers enter listings on site from 360px
          screens, where three number fields in a row clip their own labels. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <CountField id="beds" label="Bedrooms" value={beds} onChange={setBeds} />
        <CountField id="baths" label="Bathrooms" value={baths} onChange={setBaths} />
        <CountField
          id="balconies"
          label="Balconies"
          value={balconies}
          onChange={setBalconies}
        />
      </div>

      <div ref={roomsRef} className="flex flex-col gap-3 border-t border-line-soft pt-5">
        <span className={deskLabel}>Rooms</span>
        <ChecklistField
          // Remounting is what lets a picked configuration add to this list;
          // the key changes only when mergeRooms() found something new, so a
          // broker's ticks are never thrown away by an unrelated re-render.
          key={`rooms-${roomsKey}`}
          name="roomFlagsJson"
          options={ROOM_FLAGS}
          initial={roomFlags}
          allowCustom={false}
        />
      </div>
    </FormSection>
  );
}

/**
 * One count input. inputMode="numeric" is what raises the number pad on a
 * phone — type="number" alone does not on every Android keyboard, and this
 * form is filled in from one.
 */
function CountField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={deskLabel}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={deskFieldFull}
      />
    </div>
  );
}

/** null/undefined becomes "not answered"; 0 stays a real answer. */
function numberToField(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * R-09 in one line: a value already in the field always wins. A template entry
 * of null means "this layout implies nothing here", so it writes nothing.
 */
function keepOrFill(current: string, fromTemplate: number | null): string {
  if (current.trim() !== "") return current;
  return fromTemplate === null ? current : String(fromTemplate);
}

/**
 * Reads ChecklistField's own hidden input for the rooms currently ticked.
 * Returns null when the widget is not mounted yet or the value is not the
 * array we expect, so the caller falls back to state rather than reading a
 * parse failure as "nothing selected" and quietly dropping ticks.
 */
function readCheckedRooms(root: HTMLElement | null): string[] | null {
  const input = root?.querySelector<HTMLInputElement>(
    'input[name="roomFlagsJson"]'
  );
  if (!input) return null;
  try {
    const parsed: unknown = JSON.parse(input.value);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}
