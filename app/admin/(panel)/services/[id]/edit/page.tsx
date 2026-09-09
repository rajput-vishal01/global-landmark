import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { updateService } from "../../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Edit service"
        sub="One card in the Our Services row on the landing page."
        actions={
          <Link href="/admin/services" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <ServiceForm action={updateService} service={service} />
    </div>
  );
}
