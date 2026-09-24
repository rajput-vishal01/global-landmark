import { listAllPropertyTypes, listProjectsForAdmin } from "@/lib/db/queries";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty } from "../actions";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add property" };

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; unlisted?: string }>;
}) {
  // "Add a unit" on a project page lands here with ?project=<id>, and the
  // form starts filed under that project with its details filled in.
  const params = await searchParams;
  // "Add a deal-only property" on the Deal of the Week page lands here with
  // ?unlisted=1, so the listing is live for the strip without joining the
  // listings page.
  const startsUnlisted = params.unlisted === "1";
  const projectParam = Number(params.project);
  const initialProjectId = Number.isInteger(projectParam) ? projectParam : undefined;
  // Render per request, stated here rather than inherited from the panel
  // layout: the submission key below must be new on every load. A cached page
  // would hand every broker the same key, and the second listing created with
  // it would be taken for a double click and silently not saved.
  await connection();
  const [projects, types] = await Promise.all([
    listProjectsForAdmin(),
    listAllPropertyTypes(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHead
        title="Add property"
        sub="Title and address are all it takes to save. Sections 5 to 9 are optional and can be filled in later."
        actions={
          <Link href="/admin/properties" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <PropertyForm
        action={createProperty}
        projects={projects}
        types={types}
        startsUnlisted={startsUnlisted}
        // New per page load: one form, at most one listing.
        submissionKey={randomUUID()}
        initialProjectId={initialProjectId}
      />
    </div>
  );
}
