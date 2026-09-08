import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskButtonPrimary,
  deskRowLink,
  numericCell,
} from "@/components/admin/desk";
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
    <div className="flex flex-col gap-4">
      <PageHead
        title="Projects & societies"
        sub="Named developments a listing can sit inside — a whole society, or the parent of a single unit."
        actions={
          <Link href="/admin/projects/new" className={deskButtonPrimary}>
            Add project
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No projects yet"
          note="A project is the society or development a unit belongs to. Add one and its towers, units and RERA number hang off it."
          action={
            <Link href="/admin/projects/new" className={deskButton}>
              Add the first project
            </Link>
          }
        />
      ) : (
        <TableWrap>
          <Table className="min-w-[720px]">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Builder</th>
                <th scope="col">RERA</th>
                <th scope="col" className={numericCell}>
                  Units
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/projects/${p.id}`} className={deskRowLink}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="text-soft">{p.builderName || "No builder linked"}</td>
                  <td className="whitespace-nowrap text-soft">{p.reraNumber || "—"}</td>
                  <td className={`${numericCell} whitespace-nowrap text-soft`}>
                    {p.propertyCount}
                    {p.totalUnits ? ` of ${p.totalUnits}` : ""}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/projects/${p.id}/edit`} className={deskRowLink}>
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteProject}
                        id={p.id}
                        confirmText={`Delete project "${p.name}"?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
