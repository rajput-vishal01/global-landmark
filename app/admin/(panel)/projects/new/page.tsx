import { ProjectForm } from "@/components/admin/ProjectForm";
import { createProject } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHead
        title="Add project"
        sub="A society or township. Fill it in once — every unit you file under it starts with its address, map, amenities and legal details."
        actions={
          <Link href="/admin/projects" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <ProjectForm action={createProject} />
    </div>
  );
}
