"use client";

import { useState } from "react";
import { useActionForm } from "@/lib/use-action-form";
import { Select } from "@/components/ui/Select";
import { Req } from "@/components/ui/RequiredMark";
import { cardChrome, deskButtonPrimary } from "@/components/admin/desk";
import { ChecklistField } from "./ChecklistField";
import { CoverImageInput } from "./CoverImageInput";
import { FormSection, deskFieldFull, deskHint, deskLabel } from "./FormSection";
import { LegalLoanSection } from "./LegalLoanSection";
import { AMENITIES, AREA_UNITS, POSSESSION_STATUSES, withEmptyOption } from "@/lib/attributes";
import { placeFromAddress } from "@/lib/locations";
import { RERA_FLAG } from "@/lib/admin/project-prefill";
import type { ProjectFormState } from "@/app/admin/(panel)/projects/actions";

const UNIT_OPTIONS = AREA_UNITS.map((u) => ({ value: u.value, label: u.label }));

type Action = (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;

export type ProjectWithFields = {
  id: number;
  name: string;
  description: string | null;
  builderName: string | null;
  reraNumber: string | null;
  possessionStatus: string | null;
  launchDate: string | null;
  possessionDate: string | null;
  totalTowers: number | null;
  totalUnits: number | null;
  numberOfFloors: number | null;
  greenAreaValue: number | null;
  greenAreaUnit: string | null;
  amenities: string[] | null;
  city: string | null;
  coverImage: string | null;
  address: string | null;
  mapsUrl: string | null;
  legalFlags: string[] | null;
  loanFlags: string[] | null;
  banksOnPanel: string[] | null;
};

/** What a unit filed under this project picks up — shown in the side panel. */
const INHERITED = [
  "Address and map link",
  "Amenities",
  "Legal approvals and RERA number",
  "Loan details and banks on panel",
];

/**
 * The project form (Sep 2026 redesign). Same shape as the property form —
 * numbered sections, a side panel with the save button — because a project
 * is filled in once and then feeds every unit in it: pick the project on a
 * property and sections 2, 4 and 5 here fill that property in.
 *
 * Builder is plain text now that the Builders screen is gone. Price
 * appreciation, country, city/locality selects and sector are no longer
 * asked; the server leaves any stored values alone. City comes from the
 * address, the same way it does for a property.
 */
export function ProjectForm({
  action,
  project,
}: {
  action: Action;
  project?: ProjectWithFields;
}) {
  const { state, isPending, formProps } = useActionForm(action, {});
  const [address, setAddress] = useState(project?.address ?? "");
  const place = placeFromAddress(address);

  // A RERA number stored before legal flags existed on projects still
  // shows as ticked, so saving does not quietly clear it.
  const legalFlags = [
    ...new Set([...(project?.legalFlags ?? []), ...(project?.reraNumber ? [RERA_FLAG] : [])]),
  ];

  const save = (
    <div className="flex flex-col gap-2.5">
      {state.error && (
        <p role="alert" className="rounded-lg border-l-[3px] border-l-error bg-error/5 px-3 py-2 text-[12px] leading-snug text-error">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className={`${deskButtonPrimary} w-full justify-center py-2.5 disabled:cursor-wait disabled:opacity-60`}
      >
        {isPending ? "Saving..." : project ? "Save changes" : "Create project"}
      </button>
    </div>
  );

  return (
    <form
      {...formProps}
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem]"
    >
      {project && <input type="hidden" name="id" value={project.id} />}

      <div className="flex min-w-0 flex-col gap-4">
        <FormSection
          index={1}
          title="The project"
          hint="Its name, who built it, and what it is like."
          visibility="public"
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className={deskLabel}>
                Project name
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
              <label htmlFor="builderName" className={deskLabel}>
                Builder / developer
              </label>
              <input
                id="builderName"
                name="builderName"
                type="text"
                maxLength={200}
                defaultValue={project?.builderName ?? ""}
                placeholder="Green Lotus Group"
                className={deskFieldFull}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className={deskLabel}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              maxLength={2000}
              defaultValue={project?.description ?? ""}
              placeholder="The society in a few lines — size, setting, what sets it apart."
              className={deskFieldFull}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={deskLabel}>Cover photo</span>
            <CoverImageInput name="coverImage" initial={project?.coverImage ?? null} />
          </div>
        </FormSection>

        <FormSection
          index={2}
          title="Location"
          hint="Every unit in the project starts with this address and map."
          visibility="public"
          defaultOpen
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="address" className={deskLabel}>
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              maxLength={300}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Green Lotus Saksham, PR-7 Road, Zirakpur"
              className={deskFieldFull}
            />
            <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
              <span>End it with the city.</span>
              {address.trim() &&
                (place ? (
                  <span className="rounded-full bg-gold/12 px-2 py-[2px] font-semibold text-gold-deep">
                    City: {place.city}
                    {place.locality ? ` · ${place.locality}` : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-raise px-2 py-[2px] font-semibold text-soft">
                    No city recognised{project?.city ? ` — stays ${project.city}` : ""}
                  </span>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="mapsUrl" className={deskLabel}>
              Google Maps link
            </label>
            <input
              id="mapsUrl"
              name="mapsUrl"
              type="url"
              inputMode="url"
              maxLength={1000}
              defaultValue={project?.mapsUrl ?? ""}
              placeholder="https://maps.app.goo.gl/…"
              className={deskFieldFull}
            />
            <p className={deskHint}>In Google Maps, open the spot, press Share, then Copy link.</p>
          </div>
        </FormSection>

        <FormSection
          index={3}
          title="Status & size"
          hint="Where construction stands and how big the development is."
          visibility="public"
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="possessionStatus" className={deskLabel}>
                Possession
              </label>
              <Select
                id="possessionStatus"
                name="possessionStatus"
                defaultValue={project?.possessionStatus ?? ""}
                options={withEmptyOption("— Select —", POSSESSION_STATUSES)}
              />
            </div>
            <DateField id="launchDate" label="Launched" value={project?.launchDate} />
            <DateField id="possessionDate" label="Possession date" value={project?.possessionDate} />
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-line-soft pt-5 sm:grid-cols-3">
            <NumberField id="totalTowers" label="Towers" value={project?.totalTowers} />
            <NumberField id="totalUnits" label="Total units" value={project?.totalUnits} />
            <NumberField id="numberOfFloors" label="Floors" value={project?.numberOfFloors} />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-3">
            <NumberField id="greenAreaValue" label="Green area" value={project?.greenAreaValue} />
            <div className="flex flex-col gap-2">
              <label htmlFor="greenAreaUnit" className={deskLabel}>
                Unit
              </label>
              <Select
                id="greenAreaUnit"
                name="greenAreaUnit"
                defaultValue={project?.greenAreaUnit ?? "acre"}
                options={UNIT_OPTIONS}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          index={4}
          title="Amenities"
          hint="Society-wide. A unit filed under the project starts with these ticked."
          visibility="public"
        >
          <ChecklistField
            name="amenitiesJson"
            options={AMENITIES}
            initial={project?.amenities ?? []}
            allowCustom
            columns={3}
          />
        </FormSection>

        <FormSection
          index={5}
          title="Legal & loan"
          hint="Approvals, RERA and the bank panel — the same for every unit in the project."
          visibility="public"
        >
          <LegalLoanSection
            legalFlags={legalFlags}
            reraNumber={project?.reraNumber}
            loanFlags={project?.loanFlags ?? []}
            banksOnPanel={project?.banksOnPanel ?? []}
          />
        </FormSection>

        <div className="sticky bottom-0 -mx-1 border-t border-line bg-paper/95 px-1 py-4 backdrop-blur-sm lg:hidden">
          {save}
        </div>
      </div>

      <aside className="flex flex-col gap-4 max-lg:order-first lg:sticky lg:top-6">
        <div className={`${cardChrome} flex flex-col gap-4 p-5`}>
          <h2 className="text-[14.5px] font-semibold text-ink">Shared with every unit</h2>
          <p className="text-[12px] leading-snug text-muted">
            Pick this project on a property and these fill in for you. Anything
            already typed on the property is kept.
          </p>
          <ul className="flex flex-col gap-1.5">
            {INHERITED.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[12.5px] text-ink">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
          <div className="max-lg:hidden border-t border-line-soft pt-4">{save}</div>
        </div>
      </aside>
    </form>
  );
}

function NumberField({ id, label, value }: { id: string; label: string; value?: number | null }) {
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
        inputMode="numeric"
        defaultValue={value ?? ""}
        className={deskFieldFull}
      />
    </div>
  );
}

function DateField({ id, label, value }: { id: string; label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={deskLabel}>
        {label}
      </label>
      <input id={id} name={id} type="date" defaultValue={value ?? ""} className={deskFieldFull} />
    </div>
  );
}
