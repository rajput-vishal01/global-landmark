import { listProjects } from "@/lib/db/queries";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty } from "../actions";

export const metadata = { title: "Add property" };

export default async function NewPropertyPage() {
  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add property</h1>
      <PropertyForm
        action={createProperty}
        projects={projects}
        cloudinaryEnabled={isCloudinaryConfigured()}
      />
    </div>
  );
}
