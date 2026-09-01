import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddRecordDialog } from "@/components/admin/AddRecordDialog";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { SERVICE_ICONS, SERVICE_ICON_FALLBACK } from "@/components/service-icons";
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">Services</h1>
          <p className="mt-2 max-w-2xl text-body font-sans text-ink-muted">
            The &ldquo;Our Services&rdquo; grid on the landing page — buying
            and selling, legal advice, investment, vastu, home loan,
            interiors. Lowest sort order appears first.
          </p>
        </div>
        <AddRecordDialog
          label="Add service"
          title="Add a service"
          description="Appears in the “Our Services” grid on the landing page."
        >
          <ServiceForm action={createService} />
        </AddRecordDialog>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          No services yet — the section stays hidden on the landing page
          until the first one is added.
        </p>
      ) : (
        <ul className="border border-border bg-white">
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="shrink-0 text-ink-muted">
                  {SERVICE_ICONS[s.icon ?? ""] ?? SERVICE_ICON_FALLBACK}
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-body font-medium text-ink">{s.title}</p>
                  {s.description && (
                    <p className="truncate text-meta font-sans text-ink-muted">
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <span className="text-meta font-sans tabular-nums text-ink-muted">
                  #{s.sortOrder}
                </span>
                <span className="text-meta font-sans text-ink-muted">
                  {s.isPublished ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/admin/services/${s.id}/edit`}
                  className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteService}
                  id={s.id}
                  confirmText={`Delete service "${s.title}"?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
