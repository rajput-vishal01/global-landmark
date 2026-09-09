import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { builders } from "@/lib/db/schema";
import { BuilderForm } from "@/components/admin/BuilderForm";
import { updateBuilder } from "../../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Edit builder"
        sub="A developer profile. The contact and track-record fields are internal and never reach the public site."
        actions={
          <Link href="/admin/builders" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <BuilderForm action={updateBuilder} builder={builder} />
    </div>
  );
}
