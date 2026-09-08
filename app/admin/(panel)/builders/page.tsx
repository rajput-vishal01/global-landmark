import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { builders, projects } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddRecordDialog } from "@/components/admin/AddRecordDialog";
import { BuilderForm } from "@/components/admin/BuilderForm";
import {
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskRowLink,
  numericCell,
} from "@/components/admin/desk";
import { createBuilder, deleteBuilder } from "./actions";

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
    <div className="flex flex-col gap-4">
      <PageHead
        title="Builders"
        sub="The developers behind your projects, with the internal contact you pitch through."
        actions={
          <AddRecordDialog
            label="Add builder"
            title="Add a builder"
            description="Developers a project can belong to. Contact details stay internal."
          >
            <BuilderForm action={createBuilder} />
          </AddRecordDialog>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No builders yet"
          note="Add a developer here first, then projects can be linked to it and the pitch view fills in on its own."
        />
      ) : (
        <TableWrap>
          <Table className="min-w-[620px]">
            <thead>
              <tr>
                <th scope="col">Builder</th>
                <th scope="col">Belongs to</th>
                <th scope="col" className={numericCell}>
                  Projects
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/admin/builders/${b.id}/edit`} className={deskRowLink}>
                      {b.name}
                    </Link>
                  </td>
                  <td className="text-soft">{b.belongsTo || "—"}</td>
                  <td className={`${numericCell} text-soft`}>{b.projectCount}</td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/builders/${b.id}/edit`} className={deskRowLink}>
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteBuilder}
                        id={b.id}
                        confirmText={`Delete builder "${b.name}"?`}
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
