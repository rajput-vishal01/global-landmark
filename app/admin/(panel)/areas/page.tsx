import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddRecordDialog } from "@/components/admin/AddRecordDialog";
import { AreaForm } from "@/components/admin/AreaForm";
import { listAllAreasWithCounts } from "@/lib/db/areas";
import { createArea, deleteArea } from "./actions";

export const metadata = { title: "Areas" };

/**
 * Where the area sits and what it claims, deduplicated — the two are
 * usually the same value, and "Zirakpur · Zirakpur" reads as a bug.
 */
function scopeLine(area: {
  city: string | null;
  matchCity: string | null;
  matchLocality: string | null;
}): string {
  const parts = [area.city, area.matchLocality ?? area.matchCity].filter(
    (p): p is string => Boolean(p)
  );
  return [...new Set(parts)].join(" · ") || "No match set";
}

export default async function AdminAreasPage() {
  const rows = await listAllAreasWithCounts();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">Areas</h1>
          <p className="mt-2 text-body font-sans text-ink-muted">
            The locality landing pages buyers browse by. Each claims listings
            from their own address, so the counts below are live — adding a
            property never means re-saving an area.
          </p>
        </div>
        <AddRecordDialog
          label="Add area"
          title="Add an area"
          description="A locality landing page. It claims listings by their own address."
        >
          <AreaForm action={createArea} />
        </AddRecordDialog>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">No areas yet.</p>
      ) : (
        <ul className="border border-border bg-white">
          {rows.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-sans text-body font-medium text-ink">
                  {a.name}
                  {!a.isPublished && (
                    <span className="ml-3 border border-border px-2 py-0.5 text-meta font-normal uppercase tracking-[0.14em] text-ink-muted">
                      Draft
                    </span>
                  )}
                </p>
                <p className="text-meta font-sans text-ink-muted">{scopeLine(a)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <span className="text-meta font-sans text-ink-muted">
                  {a.propertyCount} propert{a.propertyCount === 1 ? "y" : "ies"}
                </span>
                <Link
                  href={`/admin/areas/${a.id}/edit`}
                  className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteArea}
                  id={a.id}
                  confirmText={`Delete area "${a.name}"? The listings it claims are not affected.`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
