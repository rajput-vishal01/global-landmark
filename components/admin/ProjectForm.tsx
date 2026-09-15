"use client";

import { useActionForm } from "@/lib/use-action-form";
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { deskButtonPrimary } from "@/components/admin/desk";
import { ChecklistField } from "./ChecklistField";
import { FormSection, deskFieldFull, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";

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
 * collapsible sections; the pattern (deskFieldFull/deskLabel, FormSection, Select,
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
  const { state, isPending, formProps } = useActionForm(action, {});
  const [city, setCity] = useState(project?.city ?? "");
  const [locality, setLocality] = useState(project?.locality ?? "");
  const localities = localitiesIn(city);

  const builderOptions = [
    { value: "", label: "— No builder linked —" },
    ...builders.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  return (
    <form {...formProps} className="flex flex-col gap-6">
      {project && <input type="hidden" name="id" value={project.id} />}

      <FormSection title="Basics" defaultOpen>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={deskLabel}>
            Name
            <Req />
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={200}
            defaultValue={project?.name ?? ""}
            placeholder="Green Lotus Saksham"
            className={deskFieldFull}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={deskLabel}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={project?.description ?? ""}
            className={deskFieldFull}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="builderId" className={deskLabel}>
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
          <label htmlFor="reraNumber" className={deskLabel}>
            RERA number
          </label>
          <input
            id="reraNumber"
            name="reraNumber"
            type="text"
            maxLength={60}
            defaultValue={project?.reraNumber ?? ""}
            className={deskFieldFull}
          />
        </div>
      </FormSection>

      <FormSection title="Possession &amp; dates">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="possessionStatus" className={deskLabel}>
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
            <label htmlFor="launchDate" className={deskLabel}>
              Launch date
            </label>
            <input
              id="launchDate"
              name="launchDate"
              type="date"
              defaultValue={project?.launchDate ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="possessionDate" className={deskLabel}>
              Possession date
            </label>
            <input
              id="possessionDate"
              name="possessionDate"
              type="date"
              defaultValue={project?.possessionDate ?? ""}
              className={deskFieldFull}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="priceAppreciation" className={deskLabel}>
            Price appreciation notes{" "}
            <span className="normal-case text-muted">(internal — a projection, not published)</span>
          </label>
          <textarea
            id="priceAppreciation"
            name="priceAppreciation"
            rows={3}
            maxLength={2000}
            defaultValue={project?.priceAppreciation ?? ""}
            className={deskFieldFull}
          />
        </div>
      </FormSection>

      <FormSection title="Scale &amp; green area">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="totalTowers" className={deskLabel}>
              Number of towers
            </label>
            <input
              id="totalTowers"
              name="totalTowers"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.totalTowers ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="totalUnits" className={deskLabel}>
              Total units
            </label>
            <input
              id="totalUnits"
              name="totalUnits"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.totalUnits ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="numberOfFloors" className={deskLabel}>
              Number of floors
            </label>
            <input
              id="numberOfFloors"
              name="numberOfFloors"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.numberOfFloors ?? ""}
              className={deskFieldFull}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="greenAreaValue" className={deskLabel}>
              Green area
            </label>
            <input
              id="greenAreaValue"
              name="greenAreaValue"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={project?.greenAreaValue ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="greenAreaUnit" className={deskLabel}>
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
          <label htmlFor="country" className={deskLabel}>
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            maxLength={60}
            defaultValue={project?.country ?? "India"}
            className={deskFieldFull}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className={deskLabel}>
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
            <label htmlFor="locality" className={deskLabel}>
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
                  className={`${deskFieldFull} cursor-not-allowed opacity-50`}
                />
                <input type="hidden" name="locality" value="" />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="sector" className={deskLabel}>
            Sector
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            maxLength={120}
            defaultValue={project?.sector ?? ""}
            className={deskFieldFull}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="coverImage" className={deskLabel}>
            Cover image URL
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="text"
            maxLength={2000}
            defaultValue={project?.coverImage ?? ""}
            placeholder="https://…"
            className={deskFieldFull}
          />
        </div>
      </FormSection>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-paper/95 py-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={isPending}
          className={`${deskButtonPrimary} w-full justify-center disabled:cursor-wait disabled:opacity-60 sm:w-fit`}
        >
          {isPending ? "Saving..." : project ? "Save changes" : "Add project"}
        </button>
        {state.error && (
          <p role="alert" className="text-[12px] text-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
