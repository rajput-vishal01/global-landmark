import { ClientForm } from "@/components/admin/ClientForm";
import { createClient } from "../client-actions";

export const metadata = { title: "Add client" };

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add client</h1>
      <ClientForm action={createClient} />
    </div>
  );
}
