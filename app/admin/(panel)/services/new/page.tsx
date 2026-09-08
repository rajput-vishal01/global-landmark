import { ServiceForm } from "@/components/admin/ServiceForm";
import { createService } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add service" };

export default function NewServicePage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Add service"
        sub="One card in the Our Services row on the landing page."
        actions={
          <Link href="/admin/services" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <ServiceForm action={createService} />
    </div>
  );
}
