import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyOwners } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/dates";
import { formatIndianShort, formatArea } from "@/lib/attributes";
import { SubmissionActions } from "./SubmissionActions";

export const metadata = { title: "Property submissions" };

/**
 * The review queue for the public /sell form.
 *
 * A submission is an ordinary property row with `submittedAt` set and
 * `publication_state = 'draft'`, so this screen is a filtered view of the
 * portfolio rather than a separate inbox. Approving publishes the row;
 * declining archives it. Both leave it editable in the normal property
 * editor afterwards, which is where a broker will usually go first — a
 * seller's own wording is rarely publication-ready.
 *
 * Local to this route rather than lib/db/queries.ts: every row carries the
 * seller's name and phone number, which must never reach the public query
 * layer.
 */
type SubmissionRow = {
  id: number;
  refCode: string | null;
  title: string;
  city: string | null;
  locality: string | null;
  propertyType: string | null;
  configuration: string | null;
  areaValue: number | null;
  areaUnit: string;
  demandPrice: number | null;
  description: string;
  submittedAt: Date | null;
  sellerName: string | null;
  sellerMobile: string | null;
  sellerNotes: string | null;
};

async function listSubmissions(): Promise<SubmissionRow[]> {
  try {
    return await db
      .select({
        id: properties.id,
        refCode: properties.refCode,
        title: properties.title,
        city: properties.city,
        locality: properties.locality,
        propertyType: properties.propertyType,
        configuration: properties.configuration,
        areaValue: properties.areaValue,
        areaUnit: properties.areaUnit,
        demandPrice: properties.demandPrice,
        description: properties.description,
        submittedAt: properties.submittedAt,
        sellerName: propertyOwners.name,
        sellerMobile: propertyOwners.mobile,
        sellerNotes: propertyOwners.notes,
      })
      .from(properties)
      .leftJoin(propertyOwners, eq(propertyOwners.propertyId, properties.id))
      .where(
        and(
          isNotNull(properties.submittedAt),
          eq(properties.publicationState, "draft")
        )
      )
      .orderBy(desc(properties.submittedAt));
  } catch (err) {
    // Fail soft, like every other panel screen: a database blip shows an
    // empty queue, it does not 500 the panel.
    console.error("listSubmissions failed:", err);
    return [];
  }
}

const META = "text-meta font-sans text-ink-muted";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted/70">
        {label}
      </span>
      <span className="font-sans text-meta text-ink">{value}</span>
    </div>
  );
}

export default async function SubmissionsPage() {
  const rows = await listSubmissions();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-h2 text-heading">Property submissions</h1>
        <p className={`max-w-2xl ${META}`}>
          Sent by owners through the public{" "}
          <Link href="/sell" className="underline decoration-border underline-offset-4 hover:decoration-gold">
            Sell your property
          </Link>{" "}
          form. Nothing here is on the website yet. Open one to fix the wording
          and add photographs before you publish it — approving puts it live
          exactly as written.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className={META}>
          Nothing waiting. New submissions appear here the moment they arrive.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <article key={row.id} className="flex flex-col gap-5 border border-border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-h4 text-ink">{row.title}</h2>
                  <p className={META}>
                    {[row.locality, row.city].filter(Boolean).join(", ") || "Location not given"}
                    {row.refCode ? ` · ${row.refCode}` : ""}
                    {row.submittedAt ? ` · ${formatDateTime(row.submittedAt)}` : ""}
                  </p>
                </div>
                <Link
                  href={`/admin/properties/${row.id}/edit`}
                  className="whitespace-nowrap border border-ink/25 px-3 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold"
                >
                  Review &amp; edit
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <Fact label="Seller" value={row.sellerName ?? "—"} />
                <Fact label="Phone" value={row.sellerMobile ?? "—"} />
                <Fact
                  label="Type"
                  value={[row.propertyType, row.configuration].filter(Boolean).join(" · ") || "—"}
                />
                <Fact
                  label="Area"
                  value={row.areaValue ? formatArea(row.areaValue, row.areaUnit) : "—"}
                />
                <Fact
                  label="Asking price"
                  value={row.demandPrice ? formatIndianShort(row.demandPrice) : "—"}
                />
              </div>

              {row.description && (
                <p className={`whitespace-pre-line border-t border-border pt-4 ${META}`}>
                  {row.description}
                </p>
              )}
              {row.sellerNotes && <p className={META}>{row.sellerNotes}</p>}

              <div className="border-t border-border pt-4">
                <SubmissionActions id={row.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
