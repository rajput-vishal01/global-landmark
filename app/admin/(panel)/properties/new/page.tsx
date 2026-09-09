import { listProjectsForAdmin } from "@/lib/db/queries";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add property" };

export default async function NewPropertyPage() {
  const projects = await listProjectsForAdmin();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Add property"
        sub="The full listing form. Only a title is needed to save a draft; the rest can be finished later."
        actions={
          <Link href="/admin/properties" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <PropertyForm
        action={createProperty}
        projects={projects}
      />
    </div>
  );
}
