import { getContactOverride, getCredibilityOverride } from "@/lib/site-settings";
import { ContactSettingsForm, CredibilitySettingsForm } from "./SettingsForms";
import { PageHead } from "@/components/admin/desk";

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
    <div className="flex flex-col gap-4">
      <PageHead
        title="Settings"
        sub="The phone numbers, address and headline figures the public site shows, changed without a deploy."
      />

      <p className="max-w-2xl text-[13px] text-soft">
        A blank field keeps the current default from{" "}
        <code className="text-[12px] text-muted">lib/data.ts</code> — fill in only
        what should override it.
      </p>

      <ContactSettingsForm initial={contact} />
      <CredibilitySettingsForm initial={credibility} />
    </div>
  );
}
