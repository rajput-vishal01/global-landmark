import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { StatusBadge } from "@/components/admin/BasicDetailsSection";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { FIELD, LABEL } from "@/components/form-classes";
import { formatIndianShort } from "@/lib/attributes";
import { createTower, deleteTower } from "../actions";
import { duplicateProperty } from "../../properties/actions";

export const metadata = { title: "Project" };

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">{project.name}</h1>
          {project.description && (
            <p className="mt-2 max-w-2xl text-body font-sans text-ink-muted">
              {project.description}
            </p>
          )}
        </div>
        <Link
          href={`/admin/projects/${project.id}/edit`}
          className="border border-border px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold hover:text-gold-deep"
        >
          Edit project
        </Link>
      </div>

      {/* Builder pitch card — the payoff screen. */}
      {project.builder ? (
        <section className="border border-border bg-white p-6">
          <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
            Builder
          </p>
          <h2 className="mt-1 font-serif text-h3 text-ink">{project.builder.name}</h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-meta font-sans text-ink-muted">
            {project.builder.belongsTo && <span>{project.builder.belongsTo}</span>}
            {project.builder.website && <span>{project.builder.website}</span>}
          </div>
          {project.builder.about && (
            <p className="mt-3 max-w-2xl text-body font-sans text-ink">{project.builder.about}</p>
          )}
          {project.builder.priceAppreciation && (
            <p className="mt-3 text-meta font-sans text-ink-muted">
              <span className={LABEL}>Track record: </span>
              {project.builder.priceAppreciation}
            </p>
          )}
          {siblingProjects.length > 0 && (
            <div className="mt-4">
              <p className={LABEL}>Other projects by this builder</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {siblingProjects.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/admin/projects/${s.id}`}
                      className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <p className="text-meta font-sans text-ink-muted">
          No builder linked.{" "}
          <Link
            href={`/admin/projects/${project.id}/edit`}
            className="underline decoration-border underline-offset-4 hover:decoration-gold"
          >
            Link one
          </Link>
          .
        </p>
      )}

      {/* Project facts. */}
      <section className="border border-border bg-white p-6">
        <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
          Project facts
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
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
            <p className={LABEL}>Amenities</p>
            <p className="mt-1 text-meta font-sans text-ink-muted">
              {project.amenities.join(" · ")}
            </p>
          </div>
        )}
      </section>

      {/* Tower inventory (R-12). */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-h3 text-ink">Tower inventory</h2>
        </div>

        {project.towers.map((tower) => (
          <div key={tower.id} className="border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-sans text-body font-medium text-ink">{tower.name}</p>
                <p className="text-meta font-sans text-ink-muted">
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
              <p className="mt-3 text-meta font-sans text-ink-muted">
                No units linked to this tower yet.
              </p>
            )}
          </div>
        ))}

        {ungroupedUnits.length > 0 && (
          <div className="border border-border bg-white p-5">
            <p className="font-sans text-body font-medium text-ink">
              Not assigned to a tower
            </p>
            <UnitTable units={ungroupedUnits} />
          </div>
        )}

        {/* Add tower — a plain field-set form, not the full ProjectForm
            treatment: a tower is four numbers and a name. */}
        <form
          action={createTower}
          className="flex flex-wrap items-end gap-4 border border-border bg-white p-4"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <div className="flex min-w-40 flex-col gap-1.5">
            <label htmlFor="towerName" className={LABEL}>
              New tower name
            </label>
            <input
              id="towerName"
              name="name"
              type="text"
              required
              maxLength={200}
              placeholder="Tower B"
              className={FIELD}
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <label htmlFor="totalFloors" className={LABEL}>
              Floors
            </label>
            <input
              id="totalFloors"
              name="totalFloors"
              type="number"
              min={0}
              inputMode="numeric"
              className={FIELD}
            />
          </div>
          <div className="flex w-28 flex-col gap-1.5">
            <label htmlFor="unitsPerFloor" className={LABEL}>
              Units/floor
            </label>
            <input
              id="unitsPerFloor"
              name="unitsPerFloor"
              type="number"
              min={0}
              inputMode="numeric"
              className={FIELD}
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
          >
            Add tower
          </button>
        </form>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-sans text-meta text-ink">{value ?? "—"}</dd>
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
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-border">
            {["Unit", "Config", "Area", "Floor", "Price", "Status", ""].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.12em] text-ink-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2 text-meta font-sans text-ink">
                <Link
                  href={`/admin/properties/${u.id}/edit`}
                  className="underline decoration-border underline-offset-4 hover:decoration-gold"
                >
                  {u.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-meta font-sans text-ink-muted">
                {u.configuration ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-meta font-sans tabular-nums text-ink-muted">
                {u.areaValue ? `${u.areaValue} ${u.areaUnit}` : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-meta font-sans tabular-nums text-ink-muted">
                {u.floorNumber ?? "—"}
                {u.unitNumber ? ` / ${u.unitNumber}` : ""}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-meta font-sans tabular-nums text-ink-muted">
                {u.demandPrice
                  ? u.showPricePublicly
                    ? formatIndianShort(u.demandPrice)
                    : `${formatIndianShort(u.demandPrice)} (hidden)`
                  : "On request"}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <StatusBadge status={u.listingStatus} />
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <form action={duplicateProperty}>
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className="cursor-pointer text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                  >
                    Duplicate
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
