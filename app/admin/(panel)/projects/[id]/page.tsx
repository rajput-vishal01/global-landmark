import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { STATUS_TONE } from "@/lib/admin/status-tone";
import type { ListingStatus } from "@/lib/taxonomy/status";
import { formatArea, headlineArea } from "@/lib/attributes";
import { formatDate } from "@/lib/dates";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  Card,
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskButtonPrimary,
  deskLinkButton,
  deskRowLink,
} from "@/components/admin/desk";
import { deleteTower } from "../actions";
import { TowerForm } from "./TowerForm";
import { duplicateProperty } from "../../properties/actions";

export const metadata = { title: "Project" };

const fieldLabel = "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted";

async function loadProject(id: number) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      towers: true,
      properties: { with: { tower: { columns: { name: true } } } },
    },
  });
}

/**
 * A project at a glance (Sep 2026 redesign): its facts, what every unit in
 * it shares, the units themselves, and its towers. "Add a unit" opens the
 * property form already filed under this project, with its shared details
 * filled in.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const project = await loadProject(numericId);
  if (!project) notFound();

  const units = [...project.properties].sort((a, b) => a.title.localeCompare(b.title));
  const liveCount = units.filter(
    (u) => u.publicationState === "published" && u.listingStatus === "Available"
  ).length;
  const subline = [project.builderName, project.city, project.possessionStatus]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title={project.name}
        sub={subline || "A society or township, and every unit filed under it."}
        actions={
          <>
            <Link href={`/admin/projects/${project.id}/edit`} className={deskButton}>
              Edit project
            </Link>
            <Link href={`/admin/properties/new?project=${project.id}`} className={deskButtonPrimary}>
              Add a unit
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row">
              {project.coverImage && (
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-raise sm:w-56">
                  <Image
                    src={project.coverImage}
                    alt={project.name}
                    fill
                    sizes="(min-width: 640px) 14rem, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                {project.description && (
                  <p className="max-w-2xl text-[13px] leading-relaxed text-soft">
                    {project.description}
                  </p>
                )}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <Fact label="Builder" value={project.builderName} />
                  <Fact label="Possession" value={project.possessionStatus} />
                  <Fact label="RERA" value={project.reraNumber} />
                  <Fact label="Launched" value={project.launchDate ? formatDate(new Date(project.launchDate)) : null} />
                  <Fact
                    label="Possession date"
                    value={project.possessionDate ? formatDate(new Date(project.possessionDate)) : null}
                  />
                  <Fact
                    label="Green area"
                    value={
                      project.greenAreaValue
                        ? formatArea(project.greenAreaValue, project.greenAreaUnit ?? "sqft")
                        : null
                    }
                  />
                  <Fact label="Towers" value={project.totalTowers?.toString() ?? null} />
                  <Fact label="Total units" value={project.totalUnits?.toString() ?? null} />
                  <Fact label="Floors" value={project.numberOfFloors?.toString() ?? null} />
                </dl>
              </div>
            </div>
          </Card>

          <Card>
            <p className="desk-eyebrow">Shared with every unit</p>
            <p className="-mt-1 mb-4 text-[12px] text-muted">
              A unit filed under this project starts with all of this filled in.
            </p>
            <div className="flex flex-col gap-4">
              <Shared label="Address">
                {project.address ? (
                  <span className="text-[13px] text-ink">
                    {project.address}
                    {project.mapsUrl && (
                      <>
                        {" · "}
                        <a
                          href={project.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={deskRowLink}
                        >
                          Open map
                        </a>
                      </>
                    )}
                  </span>
                ) : null}
              </Shared>
              <Shared label="Amenities">
                <Chips items={project.amenities} />
              </Shared>
              <Shared label="Legal">
                <Chips items={project.legalFlags} />
              </Shared>
              <Shared label="Loan & banks">
                <Chips items={[...(project.loanFlags ?? []), ...(project.banksOnPanel ?? [])]} />
              </Shared>
            </div>
          </Card>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-ink">
                Units <span className="text-[13px] font-normal text-muted">{units.length} filed · {liveCount} live</span>
              </h2>
              <Link href={`/admin/properties/new?project=${project.id}`} className={deskLinkButton}>
                + Add a unit
              </Link>
            </div>
            {units.length === 0 ? (
              <EmptyState
                title="No units yet"
                note="Add a unit and it starts with this project's address, map, amenities and legal details already filled in."
                action={
                  <Link href={`/admin/properties/new?project=${project.id}`} className={deskButton}>
                    Add the first unit
                  </Link>
                }
              />
            ) : (
              <TableWrap>
                <Table className="min-w-[640px]">
                  <thead>
                    <tr>
                      <th scope="col">Unit</th>
                      <th scope="col">Type</th>
                      <th scope="col">Size</th>
                      <th scope="col">Tower</th>
                      <th scope="col">Status</th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => {
                      const area = headlineArea(u);
                      return (
                        <tr key={u.id}>
                          <td>
                            <Link href={`/admin/properties/${u.id}/edit`} className={deskRowLink}>
                              {u.title}
                            </Link>
                            {u.publicationState !== "published" && (
                              <span className="ml-2 text-[11px] text-muted">
                                {u.publicationState === "draft" ? "Draft" : "Archived"}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-soft">{u.propertyType ?? "—"}</td>
                          <td className="whitespace-nowrap text-soft">
                            {area ? formatArea(area.value, area.unit) : "—"}
                          </td>
                          <td className="whitespace-nowrap text-soft">{u.tower?.name ?? "—"}</td>
                          <td className="whitespace-nowrap">
                            <Chip tone={STATUS_TONE[u.listingStatus as ListingStatus] ?? "neutral"}>
                              {u.listingStatus}
                            </Chip>
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <form action={duplicateProperty}>
                              <input type="hidden" name="id" value={u.id} />
                              <button type="submit" className={deskLinkButton}>
                                Duplicate
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Card>
            <p className="desk-eyebrow">Towers</p>
            {project.towers.length === 0 ? (
              <p className="text-[12.5px] text-muted">
                None yet. Add them if you want to track the project tower by tower.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line-soft">
                {project.towers.map((tower) => (
                  <li key={tower.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{tower.name}</p>
                      <p className="text-[11.5px] text-muted">
                        {[
                          tower.totalFloors && `${tower.totalFloors} floors`,
                          tower.unitsPerFloor && `${tower.unitsPerFloor}/floor`,
                          tower.totalUnits && `${tower.totalUnits} units`,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No details"}
                      </p>
                    </div>
                    <DeleteButton
                      action={deleteTower}
                      id={tower.id}
                      label="Delete"
                      confirmText={`Delete tower "${tower.name}"? Units must be reassigned first.`}
                    />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-line-soft pt-4">
              <p className={`${fieldLabel} mb-3`}>Add a tower</p>
              <TowerForm projectId={project.id} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className={fieldLabel}>{label}</dt>
      <dd className="mt-0.5 text-[13px] text-ink">{value || "—"}</dd>
    </div>
  );
}

function Shared({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <span className={fieldLabel}>{label}</span>
      {children ?? <span className="text-[13px] text-muted">Not filled in</span>}
    </div>
  );
}

function Chips({ items }: { items: string[] | null }) {
  if (!items?.length) return <span className="text-[13px] text-muted">Not filled in</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-raise px-2.5 py-0.5 text-[12px] text-soft">
          {item}
        </span>
      ))}
    </div>
  );
}
