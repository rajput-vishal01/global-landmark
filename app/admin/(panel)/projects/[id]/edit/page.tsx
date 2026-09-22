import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { updateProject } from "../../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.id, numericId));
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHead
        title="Edit project"
        sub="Changes here fill in for units you file under this project from now on."
        actions={
          <Link href={`/admin/projects/${project.id}`} className={deskButton}>
            Cancel
          </Link>
        }
      />
      <ProjectForm action={updateProject} project={project} />
    </div>
  );
}
