"use client";

import { FIELD_LABELS, requiredFieldsFor } from "@/lib/taxonomy/sections";
import { cardChrome } from "@/components/admin/desk";

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
    // A card with a gold spine rather than the gold wash it used to be: gold
    // marks, it does not fill (docs/ADMIN_DESK.md §2).
    <aside className={`${cardChrome} border-l-[3px] border-l-gold px-4 py-3.5`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-deep">
        What you actually have to fill in
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-[13px] text-ink">
        <li>
          <span className="font-semibold">To save a draft:</span> a title and an
          address line. Those are the only two fields the form refuses to save
          without.
        </li>
        <li>
          <span className="font-semibold">To put it on the website:</span>{" "}
          {propertyType ? (
            toPublish.length > 0 ? (
              <>
                at least one photo, and a {propertyType.toLowerCase()} also needs{" "}
                {toPublish.map((f) => FIELD_LABELS[f]).join(" and ")}, then
                set Publication to “Published” in Basic details.
              </>
            ) : (
              <>
                at least one photo; nothing more is required for a{" "}
                {propertyType.toLowerCase()} —
                set Publication to “Published” in Basic details.
              </>
            )
          ) : (
            <>choose a property type above and this line will tell you.</>
          )}
        </li>
        <li className="text-muted">
          Fields marked <span className="text-error">*</span> are required.
          Everything under “More details” at the bottom is optional and can be
          added any time later.
        </li>
      </ul>
    </aside>
  );
}
