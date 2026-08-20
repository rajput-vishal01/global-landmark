import { ProjectForm } from "@/components/admin/ProjectForm";
import { createProject, listBuildersForSelect } from "../actions";

export const metadata = { title: "Add project" };

export default async function NewProjectPage() {
  const builders = await listBuildersForSelect();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add project</h1>
      <ProjectForm action={createProject} builders={builders} />
    </div>
  );
}
