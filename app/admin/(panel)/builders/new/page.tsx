import { BuilderForm } from "@/components/admin/BuilderForm";
import { createBuilder } from "../actions";

export const metadata = { title: "Add builder" };

export default function NewBuilderPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add builder</h1>
      <BuilderForm action={createBuilder} />
    </div>
  );
}
