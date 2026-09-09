import { ProjectForm } from "@/components/admin/ProjectForm";
import { createProject, listBuildersForSelect } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add project" };

export default async function NewProjectPage() {
  const builders = await listBuildersForSelect();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Add project"
        sub="A society or township. Listings link to it by name and inherit its amenities instead of re-entering them."
        actions={
          <Link href="/admin/projects" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <ProjectForm action={createProject} builders={builders} />
    </div>
  );
}
