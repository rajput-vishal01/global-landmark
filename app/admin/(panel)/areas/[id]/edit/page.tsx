import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import { AreaForm } from "@/components/admin/AreaForm";
import { updateArea } from "../../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Edit area" };

export default async function EditAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const area = await db.query.areas.findFirst({ where: eq(areas.id, numericId) });
  if (!area) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Edit area"
        sub="Rename it, re-point which listings it claims, or take it off the site."
        actions={
          <Link href="/admin/areas" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <AreaForm action={updateArea} area={area} />
    </div>
  );
}
