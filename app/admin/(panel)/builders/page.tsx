import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { builders, projects } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Button } from "@/components/ui/Button";
import { deleteBuilder } from "./actions";

export const metadata = { title: "Builders" };

async function listWithCounts() {
  try {
    const rows = await db
      .select({
        id: builders.id,
        name: builders.name,
        belongsTo: builders.belongsTo,
        projectCount: count(projects.id),
      })
      .from(builders)
      .leftJoin(projects, eq(projects.builderId, builders.id))
      .groupBy(builders.id)
      .orderBy(builders.name);
    return rows;
  } catch (err) {
    console.error("listWithCounts failed:", err);
    return [];
  }
}

export default async function AdminBuildersPage() {
  const rows = await listWithCounts();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">Builders</h1>
          <p className="mt-2 text-body font-sans text-ink-muted">
            Developers a project can belong to, plus the internal CRM contact
            used when pitching.
          </p>
        </div>
        <Button href="/admin/builders/new" variant="outline">
          Add builder
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">No builders yet.</p>
      ) : (
        <ul className="border border-border bg-white">
          {rows.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="font-sans text-body font-medium text-ink">{b.name}</p>
                {b.belongsTo && (
                  <p className="text-meta font-sans text-ink-muted">{b.belongsTo}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <span className="text-meta font-sans text-ink-muted">
                  {b.projectCount} project{b.projectCount === 1 ? "" : "s"}
                </span>
                <Link
                  href={`/admin/builders/${b.id}/edit`}
                  className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteBuilder}
                  id={b.id}
                  confirmText={`Delete builder "${b.name}"?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
