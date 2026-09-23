"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionForm } from "@/lib/use-action-form";
import type { AdminProperty, PropertyImage } from "@/lib/db/schema";
import {
  applyProject,
  type ProjectPrefill,
  type SharedFields,
} from "@/lib/admin/project-prefill";
import {
  saveDraft,
  type PropertyFormState,
} from "@/app/admin/(panel)/properties/actions";
import { DOCUMENTATION_FLAGS, PROPERTY_TYPES, withEmptyOption } from "@/lib/attributes";
import { requiredFieldsFor, sectionsFor } from "@/lib/taxonomy/sections";
import { placeFromAddress } from "@/lib/locations";
import { FormSection, deskFieldFull, deskHint, deskLabel } from "./FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { cardChrome } from "@/components/admin/desk";

import { SaveBar, type AutosaveStatus } from "./SaveBar";
import { PublishPanel, SourceFields, type Requirement } from "./BasicDetailsSection";
import { ChecklistField } from "./ChecklistField";
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
 * Nine numbered sections in the order a broker describes a property —
 * what it is, where, how big, what it looks like, then the details — each
 * tagged "On the website" or "Admin only", so public and internal data never
 * share a box. Publishing lives in the side panel beside the save button,
 * with a live "to go live" checklist, instead of as a field among the data.
 *
 * The two required fields (title, address) are in sections that open by
 * default: a required field inside a closed <details> cannot be focused, and
 * the browser then refuses the submit without saying why.
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
  initialProjectId,
  startsUnlisted = false,
}: {
  action: Action;
  /** Every project, with the details a unit filed under it inherits. */
  projects: ProjectPrefill[];
  /** Add page opened from a project ("Add a unit"): start filed under it. */
  initialProjectId?: number;
  /** A new listing opened from the Deal of the Week page: live, but not listed. */
  startsUnlisted?: boolean;
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
  const [title, setTitle] = useState(property?.title ?? "");
  // What a project can fill in. Held here (not in the sections) so picking a
  // project can write into it; see lib/admin/project-prefill.ts.
  const startProject = property
    ? undefined
    : projects.find((p) => p.id === initialProjectId);
  const [shared, setShared] = useState<SharedFields>(() => {
    const own: SharedFields = {
      address: property?.location ?? "",
      mapsUrl: property?.mapsUrl ?? "",
      amenities: property?.amenities ?? [],
      legalFlags: property?.legalFlags ?? [],
      reraNumber: property?.reraNumber ?? "",
      loanFlags: property?.loanFlags ?? [],
      banksOnPanel: property?.banksOnPanel ?? [],
    };
    return startProject ? applyProject(own, startProject).fields : own;
  });
  const [featureSeed, setFeatureSeed] = useState({
    furnishing: property?.furnishing ?? null,
    furnishingInventory: property?.furnishingInventory ?? [],
    parkingTypes: property?.parkingTypes ?? [],
    parkingSlots: property?.parkingSlots ?? null,
  });
  // Bumped when a project fills fields, remounting the checklist sections so
  // they pick the new values up (they keep their own state otherwise).
  const [seedVersion, setSeedVersion] = useState(0);
  const [filledFrom, setFilledFrom] = useState<{ project: string; filled: string[] } | null>(
    () =>
      startProject
        ? { project: startProject.name, filled: ["the project’s shared details"] }
        : null
  );
  const appliedProjectRef = useRef<number | null>(
    startProject?.id ?? property?.projectId ?? null
  );
  const address = shared.address;
  const setAddress = (value: string) => setShared((prev) => ({ ...prev, address: value }));

  function pickProject(name: string) {
    const project = projects.find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (!project || project.id === appliedProjectRef.current || !formRef.current) return;
    appliedProjectRef.current = project.id;

    // The sections own their checklists, so read what is ticked right now
    // from the form itself — nothing the broker did is lost in the refill.
    const fd = new FormData(formRef.current);
    const json = (key: string): string[] => {
      try {
        const value: unknown = JSON.parse(String(fd.get(key) ?? "[]"));
        return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
      } catch {
        return [];
      }
    };
    const { fields, filled } = applyProject(
      {
        ...shared,
        amenities: json("amenitiesJson"),
        legalFlags: json("legalFlagsJson"),
        reraNumber: String(fd.get("reraNumber") ?? ""),
        loanFlags: json("loanFlagsJson"),
        banksOnPanel: json("banksOnPanelJson"),
      },
      project
    );
    const slots = String(fd.get("parkingSlots") ?? "").trim();
    setFeatureSeed({
      furnishing: String(fd.get("furnishing") ?? "") || null,
      furnishingInventory: json("furnishingInventoryJson"),
      parkingTypes: json("parkingTypesJson"),
      parkingSlots: slots && Number.isInteger(Number(slots)) ? Number(slots) : null,
    });
    setShared(fields);
    setSeedVersion((v) => v + 1);
    setFilledFrom({ project: project.name, filled });
  }
  const [photoCount, setPhotoCount] = useState(property?.images.length ?? 0);
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

  const isPlot = requiredToPublish.has("plotArea");
  const requirements: Requirement[] = [
    { label: "A title", done: title.trim() !== "" },
    { label: "An address", done: address.trim() !== "" },
    { label: "At least one photo", done: photoCount > 0 },
    ...(isPlot ? [{ label: "The plot size (section 3)", done: null }] : []),
  ];

  const saveProps = {
    isPending,
    isUploading,
    isEditing,
    autosave,
    error: state.error,
  };

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
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem]"
    >
      {property && <input type="hidden" name="id" value={property.id} />}
      {/* One-time key for a new listing: the server creates at most one row
          per key, so a double click or a retry cannot insert twice. */}
      {submissionKey && <input type="hidden" name="submissionKey" value={submissionKey} />}

      <div className="flex min-w-0 flex-col gap-4">
        <FormSection
          id="section-listing"
          index={1}
          title="The listing"
          hint="What it is and what it is called — the first thing a buyer reads."
          visibility="public"
          defaultOpen
        >
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="3 BHK corner flat in Green Lotus Saksham"
              className={deskFieldFull}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            <div className="flex flex-col gap-2">
              <label htmlFor="kind" className={deskLabel}>
                Single unit or whole project
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
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="projectName" className={deskLabel}>
              Project / society <span className="normal-case tracking-normal text-muted">(optional)</span>
            </label>
            <ProjectSuggestInput
              id="projectName"
              suggestions={projects.map((p) => p.name)}
              defaultValue={property?.project?.name ?? startProject?.name ?? ""}
              onValueChange={pickProject}
            />
            {filledFrom ? (
              <p
                aria-live="polite"
                className="rounded-md border-l-[3px] border-l-gold bg-gold/8 px-3 py-2 text-[12px] leading-snug text-soft"
              >
                {filledFrom.filled.length > 0 ? (
                  <>
                    Filled from <span className="font-semibold text-ink">{filledFrom.project}</span>:{" "}
                    {filledFrom.filled.join(", ")}. Anything you had already entered was kept.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-ink">{filledFrom.project}</span> has nothing
                    new to add — its details are already here.
                  </>
                )}
              </p>
            ) : (
              <p className={deskHint}>
                Pick an existing project and its address, map, amenities and legal
                details fill in for you.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className={deskLabel}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={property?.description}
              placeholder="What makes it worth a visit — layout, light, the view, what is nearby."
              className={deskFieldFull}
            />
          </div>
        </FormSection>

        <FormSection
          id="section-location"
          index={2}
          title="Location"
          hint="The address sets the city filter; the map link puts a map on the property page."
          visibility="public"
          defaultOpen
        >
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
            <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
              <span>Shown exactly as written. End it with the city.</span>
              {address.trim() &&
                (place ? (
                  <span className="rounded-full bg-gold/12 px-2 py-[2px] font-semibold text-gold-deep">
                    City: {place.city}
                    {place.locality ? ` · ${place.locality}` : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-raise px-2 py-[2px] font-semibold text-soft">
                    No city recognised{property?.city ? ` — stays ${property.city}` : ""}
                  </span>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="mapsUrl" className={deskLabel}>
              Google Maps link <span className="normal-case tracking-normal text-muted">(optional)</span>
            </label>
            <input
              id="mapsUrl"
              name="mapsUrl"
              type="url"
              inputMode="url"
              maxLength={1000}
              value={shared.mapsUrl}
              onChange={(e) => setShared((prev) => ({ ...prev, mapsUrl: e.target.value }))}
              placeholder="https://maps.app.goo.gl/…"
              className={deskFieldFull}
            />
            <p className={deskHint}>
              In Google Maps, open the spot, press Share, then Copy link. Leave
              empty for no map.
            </p>
          </div>
        </FormSection>

        {visible.has("area") && (
          <FormSection
            id="section-size"
            index={3}
            title="Size"
            hint={
              isPlot
                ? "A plot needs its plot size to go live. Each measure keeps its own unit."
                : "Each measure keeps its own unit — the plot in marla, the flat in sq.ft."
            }
            visibility="public"
            defaultOpen
          >
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
          </FormSection>
        )}

        <FormSection
          id="section-photos"
          index={4}
          title="Photos & video"
          hint="At least one photo to go live — the first is the cover. Video and tour links below."
          visibility="public"
          required
          defaultOpen
        >
          <ImageUploader
            onBusyChange={setIsUploading}
            onCountChange={setPhotoCount}
            initial={
              property?.images.map((img) => ({
                url: img.url,
                storageKey: img.storageKey,
                alt: img.alt,
              })) ?? []
            }
          />
          <div className="flex flex-col gap-4 border-t border-line-soft pt-5">
            <span className={deskLabel}>Video, drone and tour links</span>
            <MediaLinksSection initial={property?.media ?? []} />
          </div>
        </FormSection>

        <FormSection
          id="section-features"
          index={5}
          title="Features"
          hint="Furnishing, amenities and parking."
          visibility="public"
        >
          <FeaturesSection
            key={`features-${seedVersion}`}
            furnishing={featureSeed.furnishing}
            furnishingInventory={featureSeed.furnishingInventory}
            amenities={shared.amenities}
            parkingTypes={featureSeed.parkingTypes}
            parkingSlots={featureSeed.parkingSlots}
            showFurnishing={visible.has("furnishing")}
            showAmenities={visible.has("amenities")}
            showParking={visible.has("parking")}
          />
        </FormSection>

        <FormSection
          id="section-legal"
          index={6}
          title="Legal & loan"
          hint="Approvals, RERA and which banks lend on it — shown to buyers as trust signals."
          visibility="public"
        >
          <LegalLoanSection
            key={`legal-${seedVersion}`}
            legalFlags={shared.legalFlags}
            reraNumber={shared.reraNumber}
            loanFlags={shared.loanFlags}
            banksOnPanel={shared.banksOnPanel}
          />
        </FormSection>

        <FormSection
          id="section-owner"
          index={7}
          title="Owner & source"
          hint="Who the listing came from and how to reach the owner."
          visibility="internal"
        >
          <SourceFields addedBy={property?.addedBy} sourceName={property?.sourceName} />
          <div className="flex flex-col gap-5 border-t border-line-soft pt-5">
            <OwnersEditor initial={property?.owners ?? []} />
          </div>
        </FormSection>

        <FormSection
          id="section-paperwork"
          index={8}
          title="Paperwork"
          hint="Pick what each document is and upload its files. Private unless you put a file on the website."
          visibility="internal"
        >
          <div className="flex flex-col gap-2">
            <span className={deskLabel}>Documents the owner has</span>
            <p className={deskHint}>
              Tick what exists even before it is uploaded. Uploading a file below ticks its type for you.
            </p>
            <ChecklistField
              name="documentationFlagsJson"
              options={DOCUMENTATION_FLAGS}
              initial={property?.documentationFlags ?? []}
              allowCustom={false}
            />
          </div>
          <div className="flex flex-col gap-4 border-t border-line-soft pt-5">
            <span className={deskLabel}>Uploaded documents</span>
            <DocumentVault initial={property?.documents ?? []} />
          </div>
        </FormSection>

        <FormSection
          id="section-extra"
          index={9}
          title="Anything else"
          hint="Your own title and text, for anything the sections above do not cover."
          visibility="public"
        >
          <ExtrasEditor initial={property?.extras ?? []} />
        </FormSection>

        <SaveBar {...saveProps} className="lg:hidden" />
      </div>

      <aside className="flex flex-col gap-4 max-lg:order-first lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        <div className={`${cardChrome} flex flex-col gap-4 p-5`}>
          <h2 className="text-[14.5px] font-semibold text-ink">Publish</h2>
          <PublishPanel
            refCode={property?.refCode}
            listedAt={property?.listedAt}
            updatedAt={property?.updatedAt}
            publicationState={property?.publicationState}
            listingStatus={property?.listingStatus}
            hideFromListings={property?.hideFromListings ?? startsUnlisted}
            requirements={requirements}
          >
            <SaveBar {...saveProps} variant="panel" className="max-lg:hidden" />
          </PublishPanel>
        </div>

        <nav aria-label="Form sections" className={`${cardChrome} hidden p-3 lg:block`}>
          <ol className="flex flex-col">
            {SECTION_LINKS.filter((s) => s.id !== "section-size" || visible.has("area")).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px] text-soft transition-colors hover:bg-raise hover:text-ink"
                >
                  <span className="w-4 text-right text-[11px] tabular-nums text-muted">{s.n}</span>
                  {s.label}
                  {s.internal && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                      Admin
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    </form>
  );
}

const SECTION_LINKS = [
  { n: 1, id: "section-listing", label: "The listing" },
  { n: 2, id: "section-location", label: "Location" },
  { n: 3, id: "section-size", label: "Size" },
  { n: 4, id: "section-photos", label: "Photos & video" },
  { n: 5, id: "section-features", label: "Features" },
  { n: 6, id: "section-legal", label: "Legal & loan" },
  { n: 7, id: "section-owner", label: "Owner & source", internal: true },
  { n: 8, id: "section-paperwork", label: "Paperwork", internal: true },
  { n: 9, id: "section-extra", label: "Anything else" },
];

/** Opens a folded section (its `toggle` syncs FormSection's state) and scrolls to it. */
function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDetailsElement)) return;
  el.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
