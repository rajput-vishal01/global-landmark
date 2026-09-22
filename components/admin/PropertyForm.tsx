"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionForm } from "@/lib/use-action-form";
import type { AdminProperty, PropertyImage } from "@/lib/db/schema";
import type { PublicProject } from "@/lib/db/public-columns";
import {
  saveDraft,
  type PropertyFormState,
} from "@/app/admin/(panel)/properties/actions";
import { PROPERTY_TYPES, withEmptyOption } from "@/lib/attributes";
import { requiredFieldsFor, sectionsFor } from "@/lib/taxonomy/sections";
import { placeFromAddress } from "@/lib/locations";
import { FormSection, deskFieldFull, deskHint, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { cardChrome } from "@/components/admin/desk";

import { RequiredFieldsPanel } from "./RequiredFieldsPanel";
import { SaveBar, type AutosaveStatus } from "./SaveBar";
import { BasicDetailsSection } from "./BasicDetailsSection";
import { AreaSection } from "./AreaSection";
import { FeaturesSection } from "./FeaturesSection";
import { LegalLoanSection } from "./LegalLoanSection";
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
};

/**
 * The property form, cut down to what the client actually uses (Sep 2026).
 *
 * The essentials sit in one card that never collapses — title, type,
 * address, map link, description — because a required field inside a closed
 * <details> cannot be focused, and the browser then refuses the submit
 * without saying why. Everything optional folds away under "More details".
 *
 * Removed at the client's request, and now neither shown nor written:
 * category, status, price and charges, configuration, classification, unit
 * sizes, specifications, and the detailed location (city, locality, sector,
 * block, society, tower, floor, unit, coordinates). The server leaves those
 * columns exactly as they are, so an older listing keeps what it had. City
 * is read from the address instead, because the public filter still needs
 * it; the map is a pasted Google Maps link instead of coordinates.
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
  const [address, setAddress] = useState(property?.location ?? "");
  const [autosave, setAutosave] = useState<AutosaveStatus>({ kind: "idle" });

  const visible = useMemo(() => new Set(sectionsFor(propertyType)), [propertyType]);
  // The same rule the server enforces on publish, so a * can only appear on a
  // field that publishing will actually refuse without.
  const requiredToPublish = useMemo(
    () => new Set<string>(requiredFieldsFor(propertyType)),
    [propertyType]
  );
  // The same read the server makes, shown live so the admin can see which
  // city filter the listing will land under before saving.
  const place = placeFromAddress(address);

  // Last successfully-autosaved snapshot of the form's data, so a tick with
  // nothing new to say is a no-op rather than an identical round trip. A
  // snapshot rather than an onInput flag, because the custom Select and
  // checklist widgets update through React state, not a native input event.
  const lastSavedRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  const isEditing = Boolean(property);

  useEffect(() => {
    // Autosave runs only while EDITING a listing that already exists. A new
    // listing exists only once Create is pressed; until then, leaving the
    // page asks first.
    if (!isEditing) return;

    // ponytail: 20s fixed interval. No debounce-on-idle, no beforeunload
    // flush — add either if brokers report losing the last few seconds of
    // typing before a tab close.
    const interval = setInterval(() => {
      void tick();
    }, 20_000);
    return () => clearInterval(interval);

    async function tick() {
      const form = formRef.current;
      if (!form || savingRef.current || isPending || isUploading) return;

      const fd = new FormData(form);
      // Mirrors the server's own gate — nothing to save yet.
      if (!String(fd.get("title") ?? "").trim() || !String(fd.get("location") ?? "").trim()) {
        return;
      }

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
          // retries the same (still-unsaved) content.
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
    // formRef comes from useActionForm, so the linter cannot see it is a
    // ref — it is, and its identity never changes.
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
    // reset the form on a validation error, wiping the broker's input. See
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
          per key, so a double click or a retry cannot insert twice. */}
      {submissionKey && <input type="hidden" name="submissionKey" value={submissionKey} />}

      <RequiredFieldsPanel propertyType={propertyType} />

      {/* The essentials. Never collapsed — see the note on the component. */}
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="kind" className={deskLabel}>
              Unit or project
            </label>
            <Select
              id="kind"
              name="kind"
              defaultValue={property?.kind ?? "unit"}
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
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="projectName" className={deskLabel}>
            Project / society <span className="normal-case text-muted">(optional)</span>
          </label>
          <ProjectSuggestInput
            id="projectName"
            suggestions={projects.map((p) => p.name)}
            defaultValue={property?.project?.name ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="location" className={deskLabel}>
            Address
            <Req />
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            maxLength={300}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Sector 62, Phase 8, Mohali"
            className={deskFieldFull}
          />
          <p className={deskHint}>
            Shown on the card and the property page, exactly as written. End it
            with the city so the listing shows under the right city filter
            {address.trim() && (
              <>
                {" — "}
                {place ? (
                  <span className="font-semibold text-gold-deep">
                    City: {place.city}
                    {place.locality ? ` · ${place.locality}` : ""}
                  </span>
                ) : (
                  <span className="text-ink">
                    no city recognised{property?.city ? `, stays ${property.city}` : ""}
                  </span>
                )}
              </>
            )}
            .
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="mapsUrl" className={deskLabel}>
            Google Maps link <span className="normal-case text-muted">(optional)</span>
          </label>
          <input
            id="mapsUrl"
            name="mapsUrl"
            type="url"
            inputMode="url"
            maxLength={1000}
            defaultValue={property?.mapsUrl ?? ""}
            placeholder="https://maps.app.goo.gl/…"
            className={deskFieldFull}
          />
          <p className={deskHint}>
            In Google Maps, open the spot, press Share, then Copy link, and paste
            it here. The property page then shows a map that opens this link.
            Leave it empty for no map.
          </p>
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

      <BasicDetailsSection
        refCode={property?.refCode}
        listedAt={property?.listedAt}
        updatedAt={property?.updatedAt}
        publicationState={property?.publicationState}
        listingStatus={property?.listingStatus}
        addedBy={property?.addedBy}
        sourceName={property?.sourceName}
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

      {/* Everything else, folded into one switch. Nothing here is needed to
          save or publish. The sections stay mounted inside <details>, so
          whatever is filled in still submits while it is folded away. */}
      <FormSection
        title="More details"
        hint="Optional · owners, features, legal and loan, documents, media links"
      >
        <div className="flex flex-col gap-5">
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

          {/* Uploads the actual PDF/scan for the paperwork ticked above. */}
          <DocumentVault initial={property?.documents ?? []} />

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
        isEditing={isEditing}
        autosave={autosave}
      />
    </form>
  );
}
