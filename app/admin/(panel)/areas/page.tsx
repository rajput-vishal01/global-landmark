import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddRecordDialog } from "@/components/admin/AddRecordDialog";
import { AreaForm } from "@/components/admin/AreaForm";
import {
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskRowLink,
  numericCell,
} from "@/components/admin/desk";
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
    <div className="flex flex-col gap-4">
      <PageHead
        title="Areas"
        sub="The locality landing pages buyers browse by. Each claims listings from their own address, so the counts stay live on their own."
        actions={
          <AddRecordDialog
            label="Add area"
            title="Add an area"
            description="A locality landing page. It claims listings by their own address."
          >
            <AreaForm action={createArea} />
          </AddRecordDialog>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No areas yet"
          note="Without an area page there is nothing for buyers to browse by locality. Add one and it picks up every listing at that address."
        />
      ) : (
        <TableWrap>
          <Table className="min-w-[640px]">
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Claims</th>
                <th scope="col">State</th>
                <th scope="col" className={numericCell}>
                  Listings
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/areas/${a.id}/edit`} className={deskRowLink}>
                      {a.name}
                    </Link>
                  </td>
                  <td className="text-soft">{scopeLine(a)}</td>
                  <td>
                    <Chip tone={a.isPublished ? "live" : "neutral"}>
                      {a.isPublished ? "Published" : "Draft"}
                    </Chip>
                  </td>
                  <td className={`${numericCell} text-soft`}>{a.propertyCount}</td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/areas/${a.id}/edit`} className={deskRowLink}>
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteArea}
                        id={a.id}
                        confirmText={`Delete area "${a.name}"? The listings it claims are not affected.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
