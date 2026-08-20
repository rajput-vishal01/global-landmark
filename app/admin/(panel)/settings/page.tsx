import { getContactOverride, getCredibilityOverride } from "@/lib/site-settings";
import { ContactSettingsForm, CredibilitySettingsForm } from "./SettingsForms";

export const metadata = { title: "Settings" };

/**
 * R-36: contact details and headline stats, editable here instead of a
 * code deploy. A blank field here means "use lib/data.ts's default" —
 * these forms save overrides, they don't require every field to be filled.
 */
export default async function AdminSettingsPage() {
  const [contact, credibility] = await Promise.all([
    getContactOverride(),
    getCredibilityOverride(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-h2 text-ink">Settings</h1>
        <p className="mt-2 text-body font-sans text-ink-muted">
          A blank field keeps the current default from{" "}
          <code className="font-sans text-meta">lib/data.ts</code> — fill in only
          what should override it.
        </p>
      </div>
      <ContactSettingsForm initial={contact} />
      <CredibilitySettingsForm initial={credibility} />
    </div>
  );
}
