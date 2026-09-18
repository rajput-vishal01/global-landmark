import { listProjectsForAdmin } from "@/lib/db/queries";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty } from "../actions";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add property" };

export default async function NewPropertyPage() {
  // Render per request, stated here rather than inherited from the panel
  // layout: the submission key below must be new on every load. A cached page
  // would hand every broker the same key, and the second listing created with
  // it would be taken for a double click and silently not saved.
  await connection();
  const projects = await listProjectsForAdmin();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Add property"
        sub="Fill in the essentials and press Create. Everything under More details is optional and can be added later."
        actions={
          <Link href="/admin/properties" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <PropertyForm
        action={createProperty}
        projects={projects}
        // New per page load: one form, at most one listing.
        submissionKey={randomUUID()}
      />
    </div>
  );
}
