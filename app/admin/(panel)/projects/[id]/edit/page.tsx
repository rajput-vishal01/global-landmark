import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { updateProject, listBuildersForSelect } from "../../actions";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [[project], builders] = await Promise.all([
    db.select().from(projects).where(eq(projects.id, numericId)),
    listBuildersForSelect(),
  ]);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Edit project</h1>
      <ProjectForm action={updateProject} builders={builders} project={project} />
    </div>
  );
}
