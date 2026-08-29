import { ServiceForm } from "@/components/admin/ServiceForm";
import { createService } from "../actions";

export const metadata = { title: "Add service" };

export default function NewServicePage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add service</h1>
      <ServiceForm action={createService} />
    </div>
  );
}
