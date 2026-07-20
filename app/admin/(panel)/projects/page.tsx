import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ProjectCreateForm } from "./ProjectCreateForm";
import { deleteProject } from "./actions";

export const metadata = { title: "Projects" };

async function listWithCounts() {
  try {
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        propertyCount: count(properties.id),
      })
      .from(projects)
      .leftJoin(properties, eq(properties.projectId, projects.id))
      .groupBy(projects.id)
      .orderBy(projects.name);
    return rows;
  } catch (err) {
    console.error("listWithCounts failed:", err);
    return [];
  }
}

export default async function AdminProjectsPage() {
  const rows = await listWithCounts();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-h2 text-ink">Projects &amp; societies</h1>
        <p className="mt-2 text-body font-sans text-ink-muted">
          Named developments a listing can belong to — a whole society, or the
          parent of an individual unit.
        </p>
      </div>

      <ProjectCreateForm />

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">No projects yet.</p>
      ) : (
        <ul className="border border-border bg-white">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="font-sans text-body font-medium text-ink">{p.name}</p>
                {p.description && (
                  <p className="text-meta font-sans text-ink-muted">{p.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <span className="text-meta font-sans text-ink-muted">
                  {p.propertyCount} listing{p.propertyCount === 1 ? "" : "s"}
                </span>
                <DeleteButton
                  action={deleteProject}
                  id={p.id}
                  confirmText={`Delete project "${p.name}"?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
