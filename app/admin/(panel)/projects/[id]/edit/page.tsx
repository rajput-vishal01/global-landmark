import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { updateProject, listBuildersForSelect } from "../../actions";
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

  const [[project], builders] = await Promise.all([
    db.select().from(projects).where(eq(projects.id, numericId)),
    listBuildersForSelect(),
  ]);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Edit project"
        sub="A society or township. Listings link to it by name and inherit its amenities instead of re-entering them."
        actions={
          <Link href="/admin/projects" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <ProjectForm action={updateProject} builders={builders} project={project} />
    </div>
  );
}
