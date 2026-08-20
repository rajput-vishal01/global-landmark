"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { AdminProperty, PropertyImage } from "@/lib/db/schema";
import type { PublicProject } from "@/lib/db/public-columns";
import {
  saveDraft,
  type PropertyFormState,
} from "@/app/admin/(panel)/properties/actions";
import { CATEGORIES } from "@/lib/categories";
import { sectionsFor } from "@/lib/taxonomy/sections";
import { FIELD, LABEL } from "@/components/form-classes";
import { Select } from "@/components/ui/Select";
import { FormSection } from "./FormSection";
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
 * read back or parsed. Excludes `id`, which autosave itself writes after
 * the first insert; including it would make the very act of saving look
 * like a change and trigger a needless follow-up tick.
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
  const [autosave, setAutosave] = useState<AutosaveStatus>({ kind: "idle" });

  const visible = useMemo(() => new Set(sectionsFor(propertyType)), [propertyType]);

  const formRef = useRef<HTMLFormElement>(null);
  const idFieldRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
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
        const result = await saveDraft(fd);
        if (result.ok) {
          // Written directly to the DOM node, not through React state: the
          // hidden id field is uncontrolled (defaultValue), so this survives
          // re-renders and the next tick's FormData read picks it up,
          // turning every subsequent autosave into an update of the same
          // row instead of a new insert.
          if (idFieldRef.current && !idFieldRef.current.value) {
            idFieldRef.current.value = String(result.id);
          }
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
      }
    }
    // Refs are stable across renders and intentionally omitted; isPending
    // and isUploading are the only reactive values the closure reads, and
    // listing them means the interval restarts with a fresh closure the
    // moment either changes, rather than holding a stale reference.
  }, [isPending, isUploading]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-3xl flex-col gap-5">
      {/* Uncontrolled (defaultValue, not value): autosave writes the id of a
          newly-created draft straight to this DOM node via idFieldRef, and
          a React-controlled value would overwrite that on the next render. */}
      <input
        ref={idFieldRef}
        type="hidden"
        name="id"
        defaultValue={property?.id ?? ""}
      />

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
        sector={property?.sector}
        block={property?.block}
        society={property?.society}
        tower={property?.tower?.name}
        floorNumber={property?.floorNumber}
        totalFloors={property?.totalFloors}
        unitNumber={property?.unitNumber}
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

      <SaveBar
        isPending={isPending}
        isUploading={isUploading}
        isEditing={Boolean(property)}
        autosave={autosave}
      />
    </form>
  );
}
