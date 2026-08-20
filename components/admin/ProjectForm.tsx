"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/Select";
import { ChecklistField } from "./ChecklistField";
import { FIELD, LABEL } from "@/components/form-classes";
import { FormSection } from "./FormSection";
import { AMENITIES, AREA_UNITS, POSSESSION_STATUSES, withEmptyOption } from "@/lib/attributes";
import { CITY_NAMES, localitiesIn } from "@/lib/locations";
import type { ProjectFormState } from "@/app/admin/(panel)/projects/actions";

const UNIT_OPTIONS = AREA_UNITS.map((u) => ({ value: u.value, label: u.label }));

type Action = (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;

export type ProjectWithFields = {
  id: number;
  name: string;
  description: string | null;
  builderId: number | null;
  reraNumber: string | null;
  possessionStatus: string | null;
  launchDate: string | null;
  possessionDate: string | null;
  priceAppreciation: string | null;
  totalTowers: number | null;
  totalUnits: number | null;
  numberOfFloors: number | null;
  greenAreaValue: number | null;
  greenAreaUnit: string | null;
  amenities: string[] | null;
  country: string | null;
  city: string | null;
  locality: string | null;
  sector: string | null;
  coverImage: string | null;
};

/**
 * The project form — Group C of the CFF (R-26). Far fewer fields than a
 * property, so this stays a handful of open cards rather than twenty
 * collapsible sections; the pattern (FIELD/LABEL, FormSection, Select,
 * ChecklistField) is deliberately the same as `PropertyForm.tsx` so the two
 * screens feel like one product.
 */
export function ProjectForm({
  action,
  builders,
  project,
}: {
  action: Action;
  builders: { id: number; name: string }[];
  project?: ProjectWithFields;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [city, setCity] = useState(project?.city ?? "");
  const [locality, setLocality] = useState(project?.locality ?? "");
  const localities = localitiesIn(city);

  const builderOptions = [
    { value: "", label: "— No builder linked —" },
    ...builders.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {project && <input type="hidden" name="id" value={project.id} />}

      <FormSection title="Basics" defaultOpen>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={LABEL}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={200}
            defaultValue={project?.name ?? ""}
            placeholder="Green Lotus Saksham"
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={project?.description ?? ""}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="builderId" className={LABEL}>
            Builder (&ldquo;Builder Linked With Project&rdquo;)
          </label>
          <Select
            id="builderId"
            name="builderId"
            defaultValue={project?.builderId ? String(project.builderId) : ""}
            options={builderOptions}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reraNumber" className={LABEL}>
            RERA number
          </label>
          <input
            id="reraNumber"
            name="reraNumber"
            type="text"
            maxLength={60}
            defaultValue={project?.reraNumber ?? ""}
            className={FIELD}
          />
        </div>
      </FormSection>

      <FormSection title="Possession &amp; dates">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="possessionStatus" className={LABEL}>
              Possession status
            </label>
            <Select
              id="possessionStatus"
              name="possessionStatus"
              defaultValue={project?.possessionStatus ?? ""}
              options={withEmptyOption("— Select —", POSSESSION_STATUSES)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="launchDate" className={LABEL}>
              Launch date
            </label>
            <input
              id="launchDate"
              name="launchDate"
              type="date"
              defaultValue={project?.launchDate ?? ""}
              className={FIELD}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="possessionDate" className={LABEL}>
              Possession date
            </label>
            <input
              id="possessionDate"
              name="possessionDate"
              type="date"
              defaultValue={project?.possessionDate ?? ""}
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="priceAppreciation" className={LABEL}>
            Price appreciation notes{" "}
            <span className="normal-case text-ink-muted">(internal — a projection, not published)</span>
          </label>
          <textarea
            id="priceAppreciation"
            name="priceAppreciation"
            rows={3}
            maxLength={2000}
            defaultValue={project?.priceAppreciation ?? ""}
            className={FIELD}
          />
        </div>
      </FormSection>

      <FormSection title="Scale &amp; green area">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="totalTowers" className={LABEL}>
              Number of towers
            </label>
            <input
              id="totalTowers"
              name="totalTowers"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.totalTowers ?? ""}
              className={FIELD}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="totalUnits" className={LABEL}>
              Total units
            </label>
            <input
              id="totalUnits"
              name="totalUnits"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.totalUnits ?? ""}
              className={FIELD}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="numberOfFloors" className={LABEL}>
              Number of floors
            </label>
            <input
              id="numberOfFloors"
              name="numberOfFloors"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.numberOfFloors ?? ""}
              className={FIELD}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="greenAreaValue" className={LABEL}>
              Green area
            </label>
            <input
              id="greenAreaValue"
              name="greenAreaValue"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.greenAreaValue ?? ""}
              className={FIELD}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="greenAreaUnit" className={LABEL}>
              Green area unit
            </label>
            <Select
              id="greenAreaUnit"
              name="greenAreaUnit"
              defaultValue={project?.greenAreaUnit ?? "sqft"}
              options={UNIT_OPTIONS}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Amenities"
        hint="Society-wide — a unit inherits these instead of re-entering them"
      >
        <ChecklistField
          name="amenitiesJson"
          options={AMENITIES}
          initial={project?.amenities ?? []}
          allowCustom
          columns={3}
        />
      </FormSection>

      <FormSection title="Location">
        <div className="flex flex-col gap-2">
          <label htmlFor="country" className={LABEL}>
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            maxLength={60}
            defaultValue={project?.country ?? "India"}
            className={FIELD}
          />
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
              onValueChange={(next) => {
                setCity(next);
                setLocality("");
              }}
              options={withEmptyOption("— Select a city —", CITY_NAMES)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="locality" className={LABEL}>
              Locality
            </label>
            {localities.length > 0 ? (
              <Select
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
                  disabled
                  placeholder="Choose a city first"
                  className={`${FIELD} cursor-not-allowed opacity-50`}
                />
                <input type="hidden" name="locality" value="" />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="sector" className={LABEL}>
            Sector
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            maxLength={120}
            defaultValue={project?.sector ?? ""}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="coverImage" className={LABEL}>
            Cover image URL
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="text"
            maxLength={2000}
            defaultValue={project?.coverImage ?? ""}
            placeholder="https://…"
            className={FIELD}
          />
        </div>
      </FormSection>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-cream/95 py-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={isPending}
          className="w-full cursor-pointer bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-fit"
        >
          {isPending ? "Saving..." : project ? "Save changes" : "Add project"}
        </button>
        {state.error && (
          <p role="alert" className="font-sans text-meta text-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
