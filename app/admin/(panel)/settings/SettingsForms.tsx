"use client";

import { useActionState } from "react";
import { Card, deskButtonPrimary } from "@/components/admin/desk";
import { deskErrorText, deskFieldFull, deskLabel } from "@/components/admin/FormSection";
import {
  saveContactSettings,
  saveCredibilitySettings,
  type SettingsFormState,
} from "./actions";
import type { ContactOverride, CredibilityOverride } from "@/lib/site-settings";

const initialState: SettingsFormState = {};

/** Label above field, the pair kept tight so the two read as one control. */
const FIELD_ROW = "flex flex-col gap-1.5";

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className={`${deskButtonPrimary} w-fit disabled:cursor-wait disabled:opacity-60`}
    >
      {isPending ? "Saving..." : "Save"}
    </button>
  );
}

export function ContactSettingsForm({ initial }: { initial: ContactOverride | null }) {
  const [state, formAction, isPending] = useActionState(saveContactSettings, initialState);

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        <h2 className="desk-eyebrow">Contact details</h2>
        <div className={FIELD_ROW}>
          <label htmlFor="addressLines" className={deskLabel}>
            Office address (one line each)
          </label>
          <textarea
            id="addressLines"
            name="addressLines"
            rows={3}
            defaultValue={initial?.addressLines?.join("\n") ?? ""}
            className={deskFieldFull}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={FIELD_ROW}>
            <label htmlFor="phone" className={deskLabel}>
              Primary phone (display)
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              defaultValue={initial?.phone ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className={FIELD_ROW}>
            <label htmlFor="phoneHref" className={deskLabel}>
              Primary phone (tel: link)
            </label>
            <input
              id="phoneHref"
              name="phoneHref"
              type="text"
              placeholder="tel:+91..."
              defaultValue={initial?.phoneHref ?? ""}
              className={deskFieldFull}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={FIELD_ROW}>
            <label htmlFor="phoneAlt" className={deskLabel}>
              Alternate phone (display)
            </label>
            <input
              id="phoneAlt"
              name="phoneAlt"
              type="text"
              defaultValue={initial?.phoneAlt ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className={FIELD_ROW}>
            <label htmlFor="phoneAltHref" className={deskLabel}>
              Alternate phone (tel: link)
            </label>
            <input
              id="phoneAltHref"
              name="phoneAltHref"
              type="text"
              placeholder="tel:+91..."
              defaultValue={initial?.phoneAltHref ?? ""}
              className={deskFieldFull}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={FIELD_ROW}>
            <label htmlFor="email" className={deskLabel}>
              Enquiry inbox
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className={FIELD_ROW}>
            <label htmlFor="officeHours" className={deskLabel}>
              Office hours
            </label>
            <input
              id="officeHours"
              name="officeHours"
              type="text"
              placeholder="Mon–Sat, 10am–7pm"
              defaultValue={initial?.officeHours ?? ""}
              className={deskFieldFull}
            />
          </div>
        </div>
        <p className={`${deskLabel} -mb-2`}>Social links (leave blank to keep hidden)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              ["socialInstagram", "Instagram"],
              ["socialX", "X"],
              ["socialLinkedin", "LinkedIn"],
              ["socialYoutube", "YouTube"],
              ["socialFacebook", "Facebook"],
            ] as const
          ).map(([name, label]) => {
            const existing = initial?.socials?.find((s) => s.label === label)?.href ?? "";
            return (
              <div key={name} className={FIELD_ROW}>
                <label htmlFor={name} className={deskLabel}>
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="text"
                  defaultValue={existing === "#" ? "" : existing}
                  className={deskFieldFull}
                />
              </div>
            );
          })}
        </div>
        {state.error && (
          <p role="alert" className={deskErrorText}>
            {state.error}
          </p>
        )}
        <SaveButton isPending={isPending} />
      </form>
    </Card>
  );
}

export function CredibilitySettingsForm({ initial }: { initial: CredibilityOverride | null }) {
  const [state, formAction, isPending] = useActionState(saveCredibilitySettings, initialState);

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        <h2 className="desk-eyebrow">Landing page claim</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={FIELD_ROW}>
            <label htmlFor="headingPre" className={deskLabel}>
              Heading — before
            </label>
            <input
              id="headingPre"
              name="headingPre"
              type="text"
              defaultValue={initial?.headingPre ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className={FIELD_ROW}>
            <label htmlFor="headingHighlight" className={deskLabel}>
              Heading — highlight
            </label>
            <input
              id="headingHighlight"
              name="headingHighlight"
              type="text"
              defaultValue={initial?.headingHighlight ?? ""}
              className={deskFieldFull}
            />
          </div>
          <div className={FIELD_ROW}>
            <label htmlFor="headingPost" className={deskLabel}>
              Heading — after
            </label>
            <input
              id="headingPost"
              name="headingPost"
              type="text"
              defaultValue={initial?.headingPost ?? ""}
              className={deskFieldFull}
            />
          </div>
        </div>
        <div className={FIELD_ROW}>
          <label htmlFor="sub" className={deskLabel}>
            Subheading
          </label>
          <textarea
            id="sub"
            name="sub"
            rows={2}
            defaultValue={initial?.sub ?? ""}
            className={deskFieldFull}
          />
        </div>
        {state.error && (
          <p role="alert" className={deskErrorText}>
            {state.error}
          </p>
        )}
        <SaveButton isPending={isPending} />
      </form>
    </Card>
  );
}
