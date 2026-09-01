"use client";

import { requiredFieldsFor } from "@/lib/taxonomy/sections";

/** Plain-English names for the publish-gate fields. */
const FIELD_LABELS: Record<string, string> = {
  floorNumber: "Floor number",
  unitNumber: "Unit number",
  plotArea: "Plot size",
  superArea: "Super area",
  configuration: "Configuration",
};

/**
 * What this form actually demands, said once at the top.
 *
 * The form carries ~200 inputs across fifteen sections and exactly one of
 * them is always mandatory. Without this panel there is no way for a broker
 * to know that: every field looks equally obligatory, so the form reads as
 * an hour of work when it is really "type a title, save, fill the rest in
 * later". The publish rules are the type-dependent ones from
 * lib/taxonomy/sections.ts, read live off the chosen type rather than
 * restated here, so this cannot drift from what the server enforces.
 */
export function RequiredFieldsPanel({ propertyType }: { propertyType: string }) {
  const toPublish = requiredFieldsFor(propertyType);

  return (
    <aside className="border border-gold/40 bg-gold/5 px-5 py-4">
      <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] text-gold-deep">
        What you actually have to fill in
      </p>
      <ul className="mt-3 flex flex-col gap-2 font-sans text-meta text-ink">
        <li>
          <span className="font-semibold">To save a draft:</span> a title. That
          is the only field the form refuses to save without.
        </li>
        <li>
          <span className="font-semibold">To put it on the website:</span>{" "}
          {propertyType ? (
            toPublish.length > 0 ? (
              <>
                a {propertyType.toLowerCase()} also needs{" "}
                {toPublish.map((f) => FIELD_LABELS[f] ?? f).join(" and ")}, then
                set Publication to “Published” in Basic details.
              </>
            ) : (
              <>
                nothing more is required for a {propertyType.toLowerCase()} —
                set Publication to “Published” in Basic details.
              </>
            )
          ) : (
            <>choose a property type above and this line will tell you.</>
          )}
        </li>
        <li className="text-ink-muted">
          Everything else is optional. Fields marked{" "}
          <span className="text-error">*</span> are required; sections show a
          filled/total count so you can come back and finish later.
        </li>
      </ul>
    </aside>
  );
}
