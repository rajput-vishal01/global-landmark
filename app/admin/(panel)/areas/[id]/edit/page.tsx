import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import { AreaForm } from "@/components/admin/AreaForm";
import { updateArea } from "../../actions";

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
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Edit area</h1>
      <AreaForm action={updateArea} area={area} />
    </div>
  );
}
