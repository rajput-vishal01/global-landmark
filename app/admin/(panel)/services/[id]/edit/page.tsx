import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { updateService } from "../../actions";

export const metadata = { title: "Edit service" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, numericId));
  if (!service) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Edit service</h1>
      <ServiceForm action={updateService} service={service} />
    </div>
  );
}
