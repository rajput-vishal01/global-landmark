import { BuilderForm } from "@/components/admin/BuilderForm";
import { createBuilder } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add builder" };

export default function NewBuilderPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Add builder"
        sub="A developer profile. The contact and track-record fields are internal and never reach the public site."
        actions={
          <Link href="/admin/builders" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <BuilderForm action={createBuilder} />
    </div>
  );
}
