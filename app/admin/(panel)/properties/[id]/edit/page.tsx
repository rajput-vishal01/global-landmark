import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { IMAGE_ORDER, listProjectsForAdmin } from "@/lib/db/queries";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { updateProperty } from "../../actions";

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
    // allowed to see owners, charges and the internal 1:1. None of this may
    // ever be handed to a component under app/(site)/**.
    db.query.properties.findFirst({
      where: eq(properties.id, numericId),
      with: {
        // The uploader re-serializes list order as the new sortOrder
        // (index 0 = cover image), so this must be the canonical order.
        images: { orderBy: IMAGE_ORDER },
        project: true,
        tower: true,
        owners: true,
        internal: true,
        charges: true,
        media: true,
        documents: true,
      },
    }),
    listProjectsForAdmin(),
  ]);
  if (!property) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Edit property</h1>
      <PropertyForm
        action={updateProperty}
        projects={projects}
        property={property}
      />
    </div>
  );
}
