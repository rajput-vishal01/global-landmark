"use client";

import { useActionState } from "react";
import { FIELD, LABEL } from "@/components/form-classes";
import {
  saveContactSettings,
  saveCredibilitySettings,
  type SettingsFormState,
} from "./actions";
import type { ContactOverride, CredibilityOverride } from "@/lib/site-settings";

const initialState: SettingsFormState = {};

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-fit cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {isPending ? "Saving..." : "Save"}
    </button>
  );
}

export function ContactSettingsForm({ initial }: { initial: ContactOverride | null }) {
  const [state, formAction, isPending] = useActionState(saveContactSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6 border border-border bg-white p-6">
      <h2 className="font-serif text-h4 text-ink">Contact details</h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="addressLines" className={LABEL}>
          Office address (one line each)
        </label>
        <textarea
          id="addressLines"
          name="addressLines"
          rows={3}
          defaultValue={initial?.addressLines?.join("\n") ?? ""}
          className={FIELD}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className={LABEL}>
            Primary phone (display)
          </label>
          <input id="phone" name="phone" type="text" defaultValue={initial?.phone ?? ""} className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="phoneHref" className={LABEL}>
            Primary phone (tel: link)
          </label>
          <input
            id="phoneHref"
            name="phoneHref"
            type="text"
            placeholder="tel:+91..."
            defaultValue={initial?.phoneHref ?? ""}
            className={FIELD}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="phoneAlt" className={LABEL}>
            Alternate phone (display)
          </label>
          <input id="phoneAlt" name="phoneAlt" type="text" defaultValue={initial?.phoneAlt ?? ""} className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="phoneAltHref" className={LABEL}>
            Alternate phone (tel: link)
          </label>
          <input
            id="phoneAltHref"
            name="phoneAltHref"
            type="text"
            placeholder="tel:+91..."
            defaultValue={initial?.phoneAltHref ?? ""}
            className={FIELD}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={LABEL}>
            Enquiry inbox
          </label>
          <input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="officeHours" className={LABEL}>
            Office hours
          </label>
          <input
            id="officeHours"
            name="officeHours"
            type="text"
            placeholder="Mon–Sat, 10am–7pm"
            defaultValue={initial?.officeHours ?? ""}
            className={FIELD}
          />
        </div>
      </div>
      <p className={LABEL}>Social links (leave blank to keep hidden)</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
            <div key={name} className="flex flex-col gap-2">
              <label htmlFor={name} className={LABEL}>
                {label}
              </label>
              <input
                id={name}
                name={name}
                type="text"
                defaultValue={existing === "#" ? "" : existing}
                className={FIELD}
              />
            </div>
          );
        })}
      </div>
      {state.error && (
        <p role="alert" className="font-sans text-meta text-error">
          {state.error}
        </p>
      )}
      <SaveButton isPending={isPending} />
    </form>
  );
}

export function CredibilitySettingsForm({ initial }: { initial: CredibilityOverride | null }) {
  const [state, formAction, isPending] = useActionState(saveCredibilitySettings, initialState);
  const stats = initial?.stats ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-6 border border-border bg-white p-6">
      <h2 className="font-serif text-h4 text-ink">Credibility stats</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="headingPre" className={LABEL}>
            Heading — before
          </label>
          <input id="headingPre" name="headingPre" type="text" defaultValue={initial?.headingPre ?? ""} className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="headingHighlight" className={LABEL}>
            Heading — highlight
          </label>
          <input
            id="headingHighlight"
            name="headingHighlight"
            type="text"
            defaultValue={initial?.headingHighlight ?? ""}
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="headingPost" className={LABEL}>
            Heading — after
          </label>
          <input id="headingPost" name="headingPost" type="text" defaultValue={initial?.headingPost ?? ""} className={FIELD} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="sub" className={LABEL}>
          Subheading
        </label>
        <textarea id="sub" name="sub" rows={2} defaultValue={initial?.sub ?? ""} className={FIELD} />
      </div>
      {[1, 2, 3].map((i) => {
        const s = stats[i - 1];
        return (
          <div key={i} className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={`stat${i}Value`} className={LABEL}>
                Stat {i} — value
              </label>
              <input
                id={`stat${i}Value`}
                name={`stat${i}Value`}
                type="number"
                defaultValue={s?.value ?? ""}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`stat${i}Prefix`} className={LABEL}>
                Prefix
              </label>
              <input
                id={`stat${i}Prefix`}
                name={`stat${i}Prefix`}
                type="text"
                defaultValue={s?.prefix ?? ""}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`stat${i}Suffix`} className={LABEL}>
                Suffix
              </label>
              <input
                id={`stat${i}Suffix`}
                name={`stat${i}Suffix`}
                type="text"
                defaultValue={s?.suffix ?? ""}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`stat${i}Label`} className={LABEL}>
                Label
              </label>
              <input
                id={`stat${i}Label`}
                name={`stat${i}Label`}
                type="text"
                defaultValue={s?.label ?? ""}
                className={FIELD}
              />
            </div>
          </div>
        );
      })}
      {state.error && (
        <p role="alert" className="font-sans text-meta text-error">
          {state.error}
        </p>
      )}
      <SaveButton isPending={isPending} />
    </form>
  );
}
