"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionForm } from "@/lib/use-action-form";
import type { AdminProperty, PropertyImage } from "@/lib/db/schema";
import type { PublicProject } from "@/lib/db/public-columns";
import {
  saveDraft,
  type PropertyFormState,
} from "@/app/admin/(panel)/properties/actions";
import { CATEGORIES } from "@/lib/categories";
import { PROPERTY_TYPES, withEmptyOption } from "@/lib/attributes";
import { requiredFieldsFor, sectionsFor } from "@/lib/taxonomy/sections";
import { FormSection, deskFieldFull, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { cardChrome } from "@/components/admin/desk";

import { RequiredFieldsPanel } from "./RequiredFieldsPanel";
import { SaveBar, type AutosaveStatus } from "./SaveBar";
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
import { UnitSizesEditor } from "./UnitSizesEditor";
import { MediaLinksSection } from "./MediaLinksSection";
import { DocumentVault } from "./DocumentVault";
import { ExtrasEditor } from "./ExtrasEditor";
import { ImageUploader } from "./ImageUploader";
import { ProjectSuggestInput } from "./ProjectSuggestInput";

type Action = (
  prev: PropertyFormState,
  formData: FormData
) => Promise<PropertyFormState>;

/**
 * Cheap change-detection for autosave, not a data serialisation format —
 * good enough to answer "has anything changed since the last save", never
 * read back or parsed. Excludes `id`, which never changes while editing and
 * would only add noise to the comparison.
 */
function snapshotFormData(fd: FormData): string {
  const parts: string[] = [];
  for (const [key, value] of fd.entries()) {
    if (key === "id") continue;
    parts.push(`${key}=${typeof value === "string" ? value : value.name}`);
  }
  return parts.join("&");
}

/** Child rows, shaped by the edit page's query. */
type PropertyWithChildren = AdminProperty & {
  images: PropertyImage[];
  project: { name: string } | null;
  tower: { name: string } | null;
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
  documents?: {
    docType: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    note: string | null;
    uploadedBy: string | null;
    isPublic: boolean;
  }[];
  unitSizes?: {
    unitLabel: string;
    areaValue: number | null;
    areaUnit: string | null;
    price: number | null;
  }[];
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
  submissionKey,
}: {
  action: Action;
  projects: PublicProject[];
  /**
   * The admin form is the one place that legitimately sees the full row —
   * the public types deliberately cannot express it.
   */
  property?: PropertyWithChildren;
  /** Issued by the Add page; absent when editing. See the hidden input below. */
  submissionKey?: string;
}) {
  // The autosave request currently on the wire, if any (edit mode only). Save
  // waits for it, so the explicit save always lands after — and wins over — a
  // tick that read the form a moment earlier.
  const inFlightRef = useRef<Promise<unknown> | null>(null);
  const { state, isPending, formRef, formProps } = useActionForm(action, {}, {
    beforeSubmit: () => inFlightRef.current,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [propertyType, setPropertyType] = useState(property?.propertyType ?? "");
  const [kind, setKind] = useState<string>(property?.kind ?? "unit");
  const [autosave, setAutosave] = useState<AutosaveStatus>({ kind: "idle" });

  const visible = useMemo(() => new Set(sectionsFor(propertyType)), [propertyType]);
  // The same rule the server enforces on publish, so a * can only appear on a
  // field that publishing will actually refuse without.
  const requiredToPublish = useMemo(
    () => new Set<string>(requiredFieldsFor(propertyType)),
    [propertyType]
  );

  // Last successfully-autosaved snapshot of the form's data, so a tick with
  // nothing new to say is a no-op rather than an identical round trip.
  //
  // The plan for this task describes dirty-tracking via the form's native
  // onInput/onChange. That works for plain <input>/<textarea> elements, but
  // most of this form's controls (Select, ChecklistField) are custom
  // components that update through React state, not a native DOM event —
  // an event-based flag would silently miss every property-type, facing,
  // amenity or configuration change. Comparing a serialised snapshot of the
  // FormData instead catches every field uniformly, with no risk of a
  // widget going unwatched, at the cost of one string comparison per tick.
  const lastSavedRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  const isEditing = Boolean(property);

  useEffect(() => {
    // Autosave runs only while EDITING a listing that already exists. On a
    // new listing it used to create the row itself, making it a second writer
    // racing the Create button — the source of "already exists" errors and of
    // duplicate drafts left behind by a failed create. A new listing now exists
    // only once Create is pressed; until then, leaving the page asks first.
    if (!isEditing) return;

    // ponytail: 20s fixed interval, per §4.5. No debounce-on-idle, no
    // beforeunload flush — add either if brokers report losing the last
    // few seconds of typing before a tab close.
    const interval = setInterval(() => {
      void tick();
    }, 20_000);
    return () => clearInterval(interval);

    async function tick() {
      const form = formRef.current;
      if (!form || savingRef.current || isPending || isUploading) return;

      const fd = new FormData(form);
      const title = String(fd.get("title") ?? "").trim();
      if (!title) return; // mirrors the server's own gate — nothing to save yet

      const snapshot = snapshotFormData(fd);
      if (snapshot === lastSavedRef.current) return; // nothing changed since last save

      savingRef.current = true;
      setAutosave({ kind: "saving" });
      try {
        const request = saveDraft(fd);
        inFlightRef.current = request;
        const result = await request;
        if (result.ok) {
          lastSavedRef.current = snapshot;
          setAutosave({ kind: "saved", at: new Date(result.savedAt) });
        } else {
          // Snapshot is deliberately NOT updated on failure — the next tick
          // retries the same (still-unsaved) content instead of treating it
          // as already handled.
          setAutosave({ kind: "error", message: result.error });
        }
      } catch (err) {
        console.error("autosave failed:", err);
        setAutosave({ kind: "error", message: "Autosave failed." });
      } finally {
        savingRef.current = false;
        inFlightRef.current = null;
      }
    }
    // isPending and isUploading are the reactive values the closure reads;
    // listing them restarts the interval with a fresh closure when either
    // changes. formRef comes from useActionForm, so the linter cannot see it
    // is a ref — it is, and its identity never changes, so listing it never
    // restarts anything. The locally declared refs are omitted as usual.
  }, [isEditing, isPending, isUploading, formRef]);

  // A new listing is not saved until Create is pressed, so leaving with typed
  // work asks first. Typing marks the form dirty; submitting clears it so the
  // redirect after a successful create is not blocked.
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (isEditing) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isEditing]);

  return (
    // Submits through useActionForm, never <form action={...}>: React would
    // reset the form on a validation error, wiping the broker's input and the
    // autosaved row id, which is what created duplicate listings. See
    // lib/use-action-form.ts.
    <form
      {...formProps}
      onInput={() => {
        dirtyRef.current = true;
      }}
      onSubmit={(event) => {
        dirtyRef.current = false;
        formProps.onSubmit(event);
      }}
      className="flex flex-col gap-5"
    >
      {property && <input type="hidden" name="id" value={property.id} />}
      {/* One-time key for a new listing: the server creates at most one row
          per key, so a double click or a retry cannot insert twice. Issued by
          the page on each load so it matches between server and browser. */}
      {submissionKey && <input type="hidden" name="submissionKey" value={submissionKey} />}

      <RequiredFieldsPanel propertyType={propertyType} />

      {/* Identity: never collapsed, because this is what the listing IS. */}
      <div className={`${cardChrome} flex flex-col gap-5 px-4 py-5`}>
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className={deskLabel}>
            Title
            <Req />
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={property?.title}
            className={deskFieldFull}
          />
        </div>

        {/* The two "what is this" questions sit together, both spelled out.
            "Listing type" used to live here alone with only Unit/Project in
            it, while the actual 23-option type list was a collapsed section
            further down called Classification — so a broker opening the only
            field that reads like a type picker saw two options and concluded
            the rest were missing. Kind is now named for the question it
            actually asks, and Property type is answered in the same breath. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="kind" className={deskLabel}>
              Unit or project
            </label>
            <Select
              id="kind"
              name="kind"
              defaultValue={kind}
              onValueChange={setKind}
              options={[
                { value: "unit", label: "One unit (flat / villa / kothi)" },
                { value: "project", label: "Whole project (society / township)" },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="propertyType" className={deskLabel}>
              Property type
            </label>
            <Select
              id="propertyType"
              name="propertyType"
              defaultValue={propertyType}
              onValueChange={setPropertyType}
              options={withEmptyOption("— Select a type —", PROPERTY_TYPES)}
            />
            <p className="text-[11.5px] text-muted">
              A plot is not asked for rooms or furnishing; a warehouse is not
              asked for amenities. Choosing the type here changes the rest of
              the form.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className={deskLabel}>
              Category
              <Req />
            </label>
            <Select
              id="category"
              name="category"
              defaultValue={property?.category ?? "sale"}
              options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="projectName" className={deskLabel}>
              Project / society{" "}
              <span className="normal-case text-muted">(optional)</span>
            </label>
            <ProjectSuggestInput
              id="projectName"
              suggestions={projects.map((p) => p.name)}
              defaultValue={property?.project?.name ?? ""}
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
            defaultValue={property?.description}
            className={deskFieldFull}
          />
        </div>
      </div>

      {/* The essentials, in the order a broker thinks about a listing:
          what it is (above), then where, how big, how much, and photos. */}
      <BasicDetailsSection
        refCode={property?.refCode}
        listedAt={property?.listedAt}
        updatedAt={property?.updatedAt}
        publicationState={property?.publicationState}
        listingStatus={property?.listingStatus}
        addedBy={property?.addedBy}
        sourceName={property?.sourceName}
      />

      <LocationSection
        location={property?.location}
        city={property?.city}
        locality={property?.locality}
        sector={property?.sector}
        block={property?.block}
        society={property?.society}
        tower={property?.tower?.name}
        floorNumber={property?.floorNumber}
        totalFloors={property?.totalFloors}
        unitNumber={property?.unitNumber}
        latitude={property?.latitude}
        longitude={property?.longitude}
        showMapPublicly={property?.showMapPublicly ?? false}
        requiredToPublish={requiredToPublish}
      />

      {visible.has("area") && (
        <AreaSection
          requiredToPublish={requiredToPublish}
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

      <FormSection
        title="Photos"
        hint="At least one to publish · the first image is the cover"
        required
        defaultOpen
      >
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

      {/* Everything else, folded into one switch so a new listing reads as
          a short form rather than fifteen sections. Nothing here is needed
          to save or publish. The sections stay mounted inside <details>, so
          whatever is filled in still submits while it is folded away. */}
      <FormSection
        title="More details"
        hint="Optional · classification, owners, amenities, legal and loan, documents, specifications, media links"
      >
        <div className="flex flex-col gap-5">
          {/* Property type moved up into the identity block — see the comment there. */}
          <ClassificationSection
            dealAttributes={property?.dealAttributes ?? []}
            facing={property?.facing}
            possessionStatus={property?.possessionStatus}
            propertyAge={property?.propertyAge}
          />

          {/* Sits between configuration and price because it is both: the
              public Unit / Area / Price table that a project advertises, as
              opposed to the single negotiated demand price below. */}
          <UnitSizesEditor initial={property?.unitSizes ?? []} />

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

          {/* CFF 17's file-carrying half — the checklist above records WHICH
              paperwork exists, this uploads the actual PDF/scan for each. */}
          <DocumentVault initial={property?.documents ?? []} />

          <SpecificationsSection
            roadWidth={property?.roadWidth}
            entranceWidth={property?.entranceWidth}
            ceilingHeight={property?.ceilingHeight}
            isCorner={property?.isCorner ?? false}
            isParkFacing={property?.isParkFacing ?? false}
          />

          <MediaLinksSection initial={property?.media ?? []} />

          <FormSection
            title="Additional details"
            hint="Anything the fields above do not cover"
          >
            <ExtrasEditor initial={property?.extras ?? []} />
          </FormSection>
        </div>
      </FormSection>

      {state.error && (
        <p
          role="alert"
          className={`${cardChrome} border-l-[3px] border-l-error px-4 py-3 text-[12px] text-error`}
        >
          {state.error}
        </p>
      )}

      <SaveBar
        isPending={isPending}
        isUploading={isUploading}
        isEditing={Boolean(property)}
        autosave={autosave}
      />
    </form>
  );
}
