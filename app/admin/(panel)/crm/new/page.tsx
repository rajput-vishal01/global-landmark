import { PageHead } from "@/components/admin/desk";
import { ClientForm } from "@/components/admin/ClientForm";
import { createClient } from "../client-actions";

export const metadata = { title: "Add client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Add client"
        sub="Once saved, their calls, notes and deals collect against this record."
      />
      <ClientForm action={createClient} />
    </div>
  );
}
