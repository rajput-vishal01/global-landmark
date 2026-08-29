import { AreaForm } from "@/components/admin/AreaForm";
import { createArea } from "../actions";

export const metadata = { title: "Add area" };

export default function NewAreaPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add area</h1>
      <AreaForm action={createArea} />
    </div>
  );
}
