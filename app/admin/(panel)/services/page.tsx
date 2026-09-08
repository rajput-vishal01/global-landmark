import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddRecordDialog } from "@/components/admin/AddRecordDialog";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { SERVICE_ICONS, SERVICE_ICON_FALLBACK } from "@/components/service-icons";
import {
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskRowLink,
  numericCell,
} from "@/components/admin/desk";
import { createService, deleteService } from "./actions";

export const metadata = { title: "Services" };

/**
 * Admin list — reads the table directly rather than lib/db/content.ts,
 * which filters to published rows. A broker must be able to find the
 * unpublished card they are still writing.
 */
async function listAll() {
  try {
    return await db
      .select()
      .from(services)
      .orderBy(asc(services.sortOrder), asc(services.id));
  } catch (err) {
    console.error("admin listAll services failed:", err);
    return [];
  }
}

export default async function AdminServicesPage() {
  const rows = await listAll();

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Services"
        sub="The cards in the “Our Services” grid on the landing page, in the order they appear — lowest number first."
        actions={
          <AddRecordDialog
            label="Add service"
            title="Add a service"
            description="Appears in the “Our Services” grid on the landing page."
          >
            <ServiceForm action={createService} />
          </AddRecordDialog>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No services yet"
          note="The services section stays hidden on the landing page until the first card is added."
        />
      ) : (
        <TableWrap>
          <Table className="min-w-[680px]">
            <thead>
              <tr>
                <th scope="col" className={numericCell}>
                  Order
                </th>
                <th scope="col">Service</th>
                <th scope="col">Description</th>
                <th scope="col">State</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className={`${numericCell} text-soft`}>{s.sortOrder}</td>
                  <td>
                    <span className="flex items-center gap-3">
                      <span aria-hidden className="shrink-0 text-muted">
                        {SERVICE_ICONS[s.icon ?? ""] ?? SERVICE_ICON_FALLBACK}
                      </span>
                      <Link href={`/admin/services/${s.id}/edit`} className={deskRowLink}>
                        {s.title}
                      </Link>
                    </span>
                  </td>
                  <td className="max-w-md truncate text-soft">{s.description || "—"}</td>
                  <td>
                    <Chip tone={s.isPublished ? "live" : "neutral"}>
                      {s.isPublished ? "Published" : "Draft"}
                    </Chip>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/services/${s.id}/edit`} className={deskRowLink}>
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteService}
                        id={s.id}
                        confirmText={`Delete service "${s.title}"?`}
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
