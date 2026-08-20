import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { builders } from "@/lib/db/schema";
import { BuilderForm } from "@/components/admin/BuilderForm";
import { updateBuilder } from "../../actions";

export const metadata = { title: "Edit builder" };

export default async function EditBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const builder = await db.query.builders.findFirst({
    where: eq(builders.id, numericId),
  });
  if (!builder) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Edit builder</h1>
      <BuilderForm action={updateBuilder} builder={builder} />
    </div>
  );
}
