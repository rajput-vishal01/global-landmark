import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { IMAGE_ORDER, listProjectsForAdmin } from "@/lib/db/queries";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { updateProperty } from "../../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Edit property" };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [property, projects] = await Promise.all([
    // The full row plus its child tables — the admin is the one surface
    // allowed to see owners. None of this may
    // ever be handed to a component under app/(site)/**.
    db.query.properties.findFirst({
      where: eq(properties.id, numericId),
      with: {
        // The uploader re-serializes list order as the new sortOrder
        // (index 0 = cover image), so this must be the canonical order.
        images: { orderBy: IMAGE_ORDER },
        project: true,
        owners: true,
        media: true,
        documents: true,
      },
    }),
    listProjectsForAdmin(),
  ]);
  if (!property) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Edit property"
        sub="The full listing form. Changes autosave as a draft every twenty seconds."
        actions={
          <Link href="/admin/properties" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <PropertyForm
        action={updateProperty}
        projects={projects}
        property={property}
      />
    </div>
  );
}
