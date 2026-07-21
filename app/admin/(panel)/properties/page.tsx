import Link from "next/link";
import { listProperties } from "@/lib/db/queries";
import { categoryLabel } from "@/lib/categories";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteProperty } from "./actions";

export const metadata = { title: "Properties" };

export default async function AdminPropertiesPage() {
  const rows = await listProperties();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-h2 text-ink">Properties</h1>
        <Link
          href="/admin/properties/new"
          className="bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Add property
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          No properties yet. Add the first one.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border">
                {["Title", "Type", "Category", "Project", "Images", ""].map((h, i) => (
                  <th key={i} className="text-eyebrow px-4 py-3 font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-sans text-body font-medium text-ink">{p.title}</p>
                    <p className="text-meta font-sans text-ink-muted">{p.location}</p>
                  </td>
                  <td className="px-4 py-3 text-meta font-sans capitalize text-ink">{p.kind}</td>
                  <td className="px-4 py-3 text-meta font-sans text-ink">{categoryLabel(p.category)}</td>
                  <td className="px-4 py-3 text-meta font-sans text-ink-muted">{p.project?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-meta font-sans text-ink-muted">{p.images.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-5">
                      <Link
                        href={`/admin/properties/${p.id}/edit`}
                        className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteProperty}
                        id={p.id}
                        confirmText={`Delete "${p.title}" and all of its images? This cannot be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
