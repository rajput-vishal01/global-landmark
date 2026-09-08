import Link from "next/link";
import { STATUS_TONE } from "@/lib/admin/status-tone";
import type { ListingStatus } from "@/lib/taxonomy/status";
import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Req } from "@/components/ui/RequiredMark";
import { formatIndianShort } from "@/lib/attributes";
import {
  Card,
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskButton,
  deskButtonPrimary,
  deskField,
  deskLinkButton,
  deskRowLink,
  numericCell,
} from "@/components/admin/desk";
import { createTower, deleteTower } from "../actions";
import { duplicateProperty } from "../../properties/actions";

export const metadata = { title: "Project" };

/** The one label style the desk gives a field or a group of them. */
const fieldLabel = "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted";

async function loadProject(id: number) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      builder: true,
      towers: { with: { units: true } },
      properties: true,
    },
  });
}

/**
 * The "pitch view" R-26 names as the payoff: builder profile, RERA, dates,
 * appreciation history and every other project by the same builder, plus
 * the tower/unit inventory (R-12) grouped the way a broker actually walks a
 * buyer through it — tower by tower, then whatever isn't in a tower at all
 * (a standalone plot sold under the same society banner, for instance).
 */
export default async function ProjectPitchViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const project = await loadProject(numericId);
  if (!project) notFound();

  const siblingProjects = project.builderId
    ? await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(and(eq(projects.builderId, project.builderId), ne(projects.id, numericId)))
    : [];

  const ungroupedUnits = project.properties.filter((u) => !u.towerId);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={project.name}
        sub="Everything you need to pitch this development — the builder behind it, its RERA and dates, and the inventory tower by tower."
        actions={
          <Link href={`/admin/projects/${project.id}/edit`} className={deskButtonPrimary}>
            Edit project
          </Link>
        }
      />

      {/* Builder pitch card — the payoff screen. */}
      {project.builder ? (
        <Card>
          <p className="desk-eyebrow">Builder</p>
          <h2 className="text-[17px] font-semibold text-ink">{project.builder.name}</h2>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted">
            {project.builder.belongsTo && <span>{project.builder.belongsTo}</span>}
            {project.builder.website && <span>{project.builder.website}</span>}
          </div>
          {project.builder.about && (
            <p className="mt-3 max-w-2xl text-[13px] text-soft">{project.builder.about}</p>
          )}
          {project.builder.priceAppreciation && (
            <p className="mt-3 text-[13px] text-soft">
              <span className={fieldLabel}>Track record </span>
              {project.builder.priceAppreciation}
            </p>
          )}
          {siblingProjects.length > 0 && (
            <div className="mt-4">
              <p className={fieldLabel}>Other projects by this builder</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {siblingProjects.map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/projects/${s.id}`} className={deskRowLink}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          title="No builder linked"
          note="Link a developer and their track record, website and other projects fill this pitch view in on their own."
          action={
            <Link href={`/admin/projects/${project.id}/edit`} className={deskButton}>
              Link a builder
            </Link>
          }
        />
      )}

      {/* Project facts. */}
      <Card>
        <p className="desk-eyebrow">Project facts</p>
        {project.description && (
          <p className="mb-4 max-w-2xl text-[13px] text-soft">{project.description}</p>
        )}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Fact label="RERA" value={project.reraNumber} />
          <Fact label="Possession" value={project.possessionStatus} />
          <Fact
            label="Launch"
            value={project.launchDate ? String(project.launchDate) : null}
          />
          <Fact
            label="Possession date"
            value={project.possessionDate ? String(project.possessionDate) : null}
          />
          <Fact label="Towers" value={project.totalTowers?.toString() ?? null} />
          <Fact label="Total units" value={project.totalUnits?.toString() ?? null} />
          <Fact label="Floors" value={project.numberOfFloors?.toString() ?? null} />
          <Fact
            label="Green area"
            value={
              project.greenAreaValue
                ? `${project.greenAreaValue} ${project.greenAreaUnit ?? ""}`.trim()
                : null
            }
          />
        </dl>
        {project.amenities && project.amenities.length > 0 && (
          <div className="mt-4">
            <p className={fieldLabel}>Amenities</p>
            <p className="mt-1 text-[13px] text-soft">{project.amenities.join(" · ")}</p>
          </div>
        )}
      </Card>

      {/* Tower inventory (R-12). */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold text-ink">Tower inventory</h2>

        {project.towers.length === 0 && ungroupedUnits.length === 0 && (
          <EmptyState
            title="No towers yet"
            note="Name the towers below and every unit you file against one shows up here, floor by floor."
          />
        )}

        {project.towers.map((tower) => (
          <div key={tower.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-ink">{tower.name}</p>
                <p className="text-[11.5px] text-muted">
                  {[
                    tower.totalFloors && `${tower.totalFloors} floors`,
                    tower.unitsPerFloor && `${tower.unitsPerFloor}/floor`,
                    tower.totalUnits && `${tower.totalUnits} units total`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No details yet"}
                </p>
              </div>
              <DeleteButton
                action={deleteTower}
                id={tower.id}
                label="Delete tower"
                confirmText={`Delete tower "${tower.name}"? Units must be reassigned first.`}
              />
            </div>

            {tower.units.length > 0 ? (
              <UnitTable units={tower.units} />
            ) : (
              <EmptyState
                title="No units here"
                note={`Nothing is filed under ${tower.name} yet. Open a listing and set its tower to move it in.`}
              />
            )}
          </div>
        ))}

        {ungroupedUnits.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-ink">Not assigned to a tower</p>
            <UnitTable units={ungroupedUnits} />
          </div>
        )}

        {/* Add tower — a plain field-set form, not the full ProjectForm
            treatment: a tower is four numbers and a name. */}
        <Card>
          <p className="desk-eyebrow">Add a tower</p>
          <form action={createTower} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="flex min-w-40 flex-col gap-1.5">
              <label htmlFor="towerName" className={fieldLabel}>
                Tower name
                <Req />
              </label>
              <input
                id="towerName"
                name="name"
                type="text"
                required
                maxLength={200}
                placeholder="Tower B"
                className={deskField}
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <label htmlFor="totalFloors" className={fieldLabel}>
                Floors
              </label>
              <input
                id="totalFloors"
                name="totalFloors"
                type="number"
                min={0}
                inputMode="numeric"
                className={deskField}
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <label htmlFor="unitsPerFloor" className={fieldLabel}>
                Units/floor
              </label>
              <input
                id="unitsPerFloor"
                name="unitsPerFloor"
                type="number"
                min={0}
                inputMode="numeric"
                className={deskField}
              />
            </div>
            <button type="submit" className={deskButton}>
              Add tower
            </button>
          </form>
        </Card>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className={fieldLabel}>{label}</dt>
      <dd className="mt-0.5 text-[13px] text-ink">{value ?? "—"}</dd>
    </div>
  );
}

type UnitRow = {
  id: number;
  title: string;
  configuration: string | null;
  areaValue: number | null;
  areaUnit: string;
  floorNumber: number | null;
  unitNumber: string | null;
  demandPrice: number | null;
  showPricePublicly: boolean;
  listingStatus: string;
};

/** Config · area · floor · price/on-request · status — the R-12 spec's table shape. */
function UnitTable({ units }: { units: UnitRow[] }) {
  return (
    <TableWrap>
      <Table className="min-w-[640px]">
        <thead>
          <tr>
            <th scope="col">Unit</th>
            <th scope="col">Config</th>
            <th scope="col" className={numericCell}>
              Area
            </th>
            <th scope="col" className={numericCell}>
              Floor
            </th>
            <th scope="col" className={numericCell}>
              Price
            </th>
            <th scope="col">Status</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id}>
              <td className="whitespace-nowrap">
                <Link href={`/admin/properties/${u.id}/edit`} className={deskRowLink}>
                  {u.title}
                </Link>
              </td>
              <td className="whitespace-nowrap text-soft">{u.configuration ?? "—"}</td>
              <td className={`${numericCell} whitespace-nowrap text-soft`}>
                {u.areaValue ? `${u.areaValue} ${u.areaUnit}` : "—"}
              </td>
              <td className={`${numericCell} whitespace-nowrap text-soft`}>
                {u.floorNumber ?? "—"}
                {u.unitNumber ? ` / ${u.unitNumber}` : ""}
              </td>
              <td className={`${numericCell} whitespace-nowrap text-soft`}>
                {u.demandPrice
                  ? u.showPricePublicly
                    ? formatIndianShort(u.demandPrice)
                    : `${formatIndianShort(u.demandPrice)} (hidden)`
                  : "On request"}
              </td>
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
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
