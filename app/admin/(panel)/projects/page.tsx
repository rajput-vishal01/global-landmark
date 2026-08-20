import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteProject } from "./actions";

export const metadata = { title: "Projects" };

async function listWithCounts() {
  try {
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        builderName: projects.builderName,
        reraNumber: projects.reraNumber,
        totalUnits: projects.totalUnits,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">Projects &amp; societies</h1>
          <p className="mt-2 text-body font-sans text-ink-muted">
            Named developments a listing can belong to — a whole society, or the
            parent of an individual unit.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Add project
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">No projects yet.</p>
      ) : (
        <ul className="border border-border bg-white">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="font-sans text-body font-medium text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {p.name}
                </Link>
                <p className="text-meta font-sans text-ink-muted">
                  {[p.builderName, p.reraNumber && `RERA ${p.reraNumber}`]
                    .filter(Boolean)
                    .join(" · ") || "No builder linked"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <span className="text-meta font-sans tabular-nums text-ink-muted">
                  {p.propertyCount} unit{p.propertyCount === 1 ? "" : "s"}
                  {p.totalUnits ? ` of ${p.totalUnits}` : ""}
                </span>
                <Link
                  href={`/admin/projects/${p.id}/edit`}
                  className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  Edit
                </Link>
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
