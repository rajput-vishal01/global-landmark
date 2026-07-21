"use client";

import { useActionState, useState } from "react";
import type { Project, PropertyWithImages } from "@/lib/db/schema";
import type { PropertyFormState } from "@/app/admin/(panel)/properties/actions";
import { CATEGORIES } from "@/lib/categories";
import {
  AREA_UNITS,
  FACINGS,
  FURNISHINGS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  withEmptyOption,
} from "@/lib/attributes";
import { LABEL } from "@/components/form-classes";
import { Select } from "@/components/ui/Select";
import { AmenitiesField } from "./AmenitiesField";
import { ExtrasEditor } from "./ExtrasEditor";
import { ImageUploader } from "./ImageUploader";
import { ProjectSuggestInput } from "./ProjectSuggestInput";

const withNone = (values: readonly string[]) => withEmptyOption("— None —", values);

const FIELD =
  "w-full appearance-none rounded-none border-b border-border bg-transparent py-2.5 font-sans text-body text-ink focus:border-gold focus:outline-none";
type Action = (
  prev: PropertyFormState,
  formData: FormData
) => Promise<PropertyFormState>;

export function PropertyForm({
  action,
  projects,
  cloudinaryEnabled,
  property,
}: {
  action: Action;
  projects: Project[];
  cloudinaryEnabled: boolean;
  property?: PropertyWithImages;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [isUploading, setIsUploading] = useState(false);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-8">
      {property && <input type="hidden" name="id" value={property.id} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className={LABEL}>Title</label>
        <input id="title" name="title" type="text" required maxLength={200}
          defaultValue={property?.title} className={FIELD} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="kind" className={LABEL}>Listing type</label>
          <Select
            id="kind"
            name="kind"
            defaultValue={property?.kind ?? "unit"}
            options={[
              { value: "unit", label: "Unit (flat / villa / room)" },
              { value: "project", label: "Project (whole society)" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className={LABEL}>Category</label>
          <Select
            id="category"
            name="category"
            defaultValue={property?.category ?? "sale"}
            options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="projectName" className={LABEL}>
            Project / society{" "}
            <span className="normal-case text-ink-muted">(optional — new names are created)</span>
          </label>
          <ProjectSuggestInput
            id="projectName"
            suggestions={projects.map((p) => p.name)}
            defaultValue={property?.project?.name ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="location" className={LABEL}>Location</label>
        <input id="location" name="location" type="text" required maxLength={300}
          defaultValue={property?.location} placeholder="Neighbourhood, City"
          className={FIELD} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className={LABEL}>Description</label>
        <textarea id="description" name="description" rows={6} required
          defaultValue={property?.description} className={FIELD} />
      </div>

      {/* All attribute fields below are optional — empty simply doesn't render */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="propertyType" className={LABEL}>Property type</label>
          <Select id="propertyType" name="propertyType"
            defaultValue={property?.propertyType ?? ""}
            options={withNone(PROPERTY_TYPES)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="configuration" className={LABEL}>
            Configuration <span className="normal-case text-ink-muted">(e.g. 3+1 BHK, Duplex)</span>
          </label>
          <input id="configuration" name="configuration" type="text" maxLength={100}
            defaultValue={property?.configuration ?? ""} className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="facing" className={LABEL}>Facing</label>
          <Select id="facing" name="facing"
            defaultValue={property?.facing ?? ""}
            options={withNone(FACINGS)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="possessionStatus" className={LABEL}>Possession</label>
          <Select id="possessionStatus" name="possessionStatus"
            defaultValue={property?.possessionStatus ?? ""}
            options={withNone(POSSESSION_STATUSES)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="furnishing" className={LABEL}>Furnishing</label>
          <Select id="furnishing" name="furnishing"
            defaultValue={property?.furnishing ?? ""}
            options={withNone(FURNISHINGS)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="areaValue" className={LABEL}>Area</label>
          <div className="flex gap-3">
            <input id="areaValue" name="areaValue" type="number" min={0}
              defaultValue={property?.areaValue ?? ""} className={`${FIELD} min-w-0 flex-1`} />
            <Select name="areaUnit"
              defaultValue={property?.areaUnit ?? "sqft"}
              options={AREA_UNITS.map((u) => ({ value: u.value, label: u.label }))}
              className="w-28 shrink-0" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 sm:max-w-md">
        <div className="flex flex-col gap-2">
          <label htmlFor="beds" className={LABEL}>
            Beds <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input id="beds" name="beds" type="number" min={0}
            defaultValue={property?.beds ?? ""} className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="baths" className={LABEL}>
            Baths <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input id="baths" name="baths" type="number" min={0}
            defaultValue={property?.baths ?? ""} className={FIELD} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>Amenities</span>
        <AmenitiesField initial={property?.amenities ?? []} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>
          Additional details{" "}
          <span className="normal-case text-ink-muted">(anything not covered by the fields above)</span>
        </span>
        <ExtrasEditor initial={property?.extras ?? []} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>Gallery</span>
        <ImageUploader
          cloudinaryEnabled={cloudinaryEnabled}
          onBusyChange={setIsUploading}
          initial={
            property?.images.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              alt: img.alt,
            })) ?? []
          }
        />
      </div>

      {state.error && (
        <p role="alert" className="text-meta font-sans text-error">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || isUploading}
        className="w-fit cursor-pointer bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {isUploading
          ? "Uploading images..."
          : isPending
            ? "Saving..."
            : property
              ? "Save changes"
              : "Create property"}
      </button>
    </form>
  );
}
