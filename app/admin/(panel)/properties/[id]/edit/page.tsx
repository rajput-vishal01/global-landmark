import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { IMAGE_ORDER, listProjects } from "@/lib/db/queries";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
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
    db.query.properties.findFirst({
      where: eq(properties.id, numericId),
      with: {
        // The uploader re-serializes list order as the new sortOrder
        // (index 0 = cover image), so this must be the canonical order.
        images: { orderBy: IMAGE_ORDER },
        project: true,
      },
    }),
    listProjects(),
  ]);
  if (!property) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Edit property</h1>
      <PropertyForm
        action={updateProperty}
        projects={projects}
        cloudinaryEnabled={isCloudinaryConfigured()}
        property={property}
      />
    </div>
  );
}
