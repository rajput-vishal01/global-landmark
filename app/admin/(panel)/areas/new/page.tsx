import { AreaForm } from "@/components/admin/AreaForm";
import { createArea } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add area" };

export default function NewAreaPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHead
        title="Add area"
        sub="A landing page for one city or locality. It claims listings by matching their city and locality, so nothing needs re-tagging."
        actions={
          <Link href="/admin/areas" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <AreaForm action={createArea} />
    </div>
  );
}
