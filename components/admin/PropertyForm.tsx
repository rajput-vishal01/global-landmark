"use client";

import { useActionState, useMemo, useState } from "react";
import type { AdminProperty, PropertyImage } from "@/lib/db/schema";
import type { PublicProject } from "@/lib/db/public-columns";
import type { PropertyFormState } from "@/app/admin/(panel)/properties/actions";
import { CATEGORIES } from "@/lib/categories";
import { sectionsFor } from "@/lib/taxonomy/sections";
import { FIELD, LABEL } from "@/components/form-classes";
import { Select } from "@/components/ui/Select";
import { FormSection } from "./FormSection";
import { BasicDetailsSection } from "./BasicDetailsSection";
import { LocationSection } from "./LocationSection";
import { ClassificationSection } from "./ClassificationSection";
import { ConfigurationSection } from "./ConfigurationSection";
import { AreaSection } from "./AreaSection";
import { PriceSection } from "./PriceSection";
import { FeaturesSection } from "./FeaturesSection";
import { LegalLoanSection } from "./LegalLoanSection";
import { SpecificationsSection } from "./SpecificationsSection";
import { OwnersEditor } from "./OwnersEditor";
import { MediaLinksSection } from "./MediaLinksSection";
import { ExtrasEditor } from "./ExtrasEditor";
import { ImageUploader } from "./ImageUploader";
import { ProjectSuggestInput } from "./ProjectSuggestInput";

type Action = (
  prev: PropertyFormState,
  formData: FormData
) => Promise<PropertyFormState>;

/** Child rows, shaped by the edit page's query. */
type PropertyWithChildren = AdminProperty & {
  images: PropertyImage[];
  project: { name: string } | null;
  owners?: {
    name: string;
    sellerCategory: string | null;
    ownerType: string | null;
    ownerCount: number | null;
    mobile: string | null;
    altMobile: string | null;
    address: string | null;
    notes: string | null;
  }[];
  charges?: {
    chargeType: string;
    amount: number;
    basis: string;
    isIncludedInDemand: boolean;
  }[];
  media?: { kind: string; url: string; label: string }[];
  internal?: { circleRate: number | null } | null;
};

/**
 * The CFF property form, sectioned into the client's own twenty groups.
 *
 * Two things drive the shape of this file:
 *
 * 1. **No single page carries ~150 fields.** Each group is a collapsible
 *    `FormSection`. Only the identity fields sit outside one — you cannot
 *    collapse the thing you use to find the listing again.
 *
 * 2. **Which sections appear is one lookup, not scattered conditionals.**
 *    `sectionsFor(propertyType)` owns it (R-12), and the selected type is
 *    state here so sections appear and disappear as the broker changes it:
 *    a Residential Plot stops asking for balconies the moment it is picked.
 *    An unrecognised or unset type shows everything, because hiding a field
 *    loses data while showing a spare one is only an annoyance.
 */
export function PropertyForm({
  action,
  projects,
  property,
}: {
  action: Action;
  projects: PublicProject[];
  /**
   * The admin form is the one place that legitimately sees the full row —
   * the public types deliberately cannot express it.
   */
  property?: PropertyWithChildren;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [isUploading, setIsUploading] = useState(false);
  const [propertyType, setPropertyType] = useState(property?.propertyType ?? "");
  const [kind, setKind] = useState<string>(property?.kind ?? "unit");

  const visible = useMemo(() => new Set(sectionsFor(propertyType)), [propertyType]);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      {property && <input type="hidden" name="id" value={property.id} />}

      {/* Identity: never collapsed, because this is what the listing IS. */}
      <div className="flex flex-col gap-5 border border-border bg-white px-5 py-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={LABEL}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={property?.title}
            className={FIELD}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="kind" className={LABEL}>
              Listing type
            </label>
            <Select
              id="kind"
              name="kind"
              defaultValue={kind}
              onValueChange={setKind}
              options={[
                { value: "unit", label: "Unit (flat / villa / room)" },
                { value: "project", label: "Project (whole society)" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className={LABEL}>
              Category
            </label>
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
              <span className="normal-case text-ink-muted">(optional)</span>
            </label>
            <ProjectSuggestInput
              id="projectName"
              suggestions={projects.map((p) => p.name)}
              defaultValue={property?.project?.name ?? ""}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={property?.description}
            className={FIELD}
          />
        </div>
      </div>

      <BasicDetailsSection
        refCode={property?.refCode}
        listedAt={property?.listedAt}
        updatedAt={property?.updatedAt}
        publicationState={property?.publicationState}
        listingStatus={property?.listingStatus}
        addedBy={property?.addedBy}
        sourceName={property?.sourceName}
      />

      <ClassificationSection
        propertyType={property?.propertyType}
        dealAttributes={property?.dealAttributes ?? []}
        facing={property?.facing}
        possessionStatus={property?.possessionStatus}
        propertyAge={property?.propertyAge}
        onTypeChange={setPropertyType}
      />

      <LocationSection
        location={property?.location}
        city={property?.city}
        locality={property?.locality}
      />

      {visible.has("area") && (
        <AreaSection
          plotArea={property?.plotArea}
          plotAreaUnit={property?.plotAreaUnit}
          builtUpArea={property?.builtUpArea}
          builtUpAreaUnit={property?.builtUpAreaUnit}
          superArea={property?.superArea}
          superAreaUnit={property?.superAreaUnit}
          carpetArea={property?.carpetArea}
          carpetAreaUnit={property?.carpetAreaUnit}
          frontFeet={property?.frontFeet}
          depthFeet={property?.depthFeet}
          plcAttributes={property?.plcAttributes ?? []}
        />
      )}

      {visible.has("configuration") && (
        <ConfigurationSection
          kind={kind === "project" ? "project" : "unit"}
          configuration={property?.configuration}
          configurations={property?.configurations ?? []}
          beds={property?.beds}
          baths={property?.baths}
          balconies={property?.balconies}
          roomFlags={property?.roomFlags ?? []}
        />
      )}

      <PriceSection
        demandPrice={property?.demandPrice}
        perSqftRate={property?.perSqftRate}
        isNegotiable={property?.isNegotiable ?? false}
        showPricePublicly={property?.showPricePublicly ?? false}
        charges={property?.charges ?? []}
        areaSqft={property?.areaSqft}
        circleRate={property?.internal?.circleRate}
      />

      <OwnersEditor initial={property?.owners ?? []} />

      <FeaturesSection
        furnishing={property?.furnishing}
        furnishingInventory={property?.furnishingInventory ?? []}
        amenities={property?.amenities ?? []}
        parkingTypes={property?.parkingTypes ?? []}
        parkingSlots={property?.parkingSlots}
        showFurnishing={visible.has("furnishing")}
        showAmenities={visible.has("amenities")}
        showParking={visible.has("parking")}
      />

      <LegalLoanSection
        legalFlags={property?.legalFlags ?? []}
        reraNumber={property?.reraNumber}
        loanFlags={property?.loanFlags ?? []}
        banksOnPanel={property?.banksOnPanel ?? []}
        documentationFlags={property?.documentationFlags ?? []}
      />

      <SpecificationsSection
        roadWidth={property?.roadWidth}
        entranceWidth={property?.entranceWidth}
        ceilingHeight={property?.ceilingHeight}
        isCorner={property?.isCorner ?? false}
        isParkFacing={property?.isParkFacing ?? false}
      />

      <FormSection title="Photos" hint="The first image is the cover" defaultOpen>
        <ImageUploader
          onBusyChange={setIsUploading}
          initial={
            property?.images.map((img) => ({
              url: img.url,
              storageKey: img.storageKey,
              alt: img.alt,
            })) ?? []
          }
        />
      </FormSection>

      <MediaLinksSection initial={property?.media ?? []} />

      <FormSection
        title="Additional details"
        hint="Anything the fields above do not cover"
      >
        <ExtrasEditor initial={property?.extras ?? []} />
      </FormSection>

      {state.error && (
        <p
          role="alert"
          className="border border-error bg-error/5 px-4 py-3 text-meta font-sans text-error"
        >
          {state.error}
        </p>
      )}

      {/* Sticky: the form is long enough that a button at the bottom would be
          a long scroll away from most of it. */}
      <div className="sticky bottom-0 border-t border-border bg-cream/95 py-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="w-full cursor-pointer bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 sm:w-fit"
        >
          {isUploading
            ? "Uploading images..."
            : isPending
              ? "Saving..."
              : property
                ? "Save changes"
                : "Create property"}
        </button>
      </div>
    </form>
  );
}
