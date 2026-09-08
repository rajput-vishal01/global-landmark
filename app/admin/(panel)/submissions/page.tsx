import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyOwners } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/dates";
import { formatIndianShort, formatArea } from "@/lib/attributes";
import { SubmissionActions } from "./SubmissionActions";
import {
  Card,
  Chip,
  EmptyState,
  PageHead,
  deskButton,
} from "@/components/admin/desk";

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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <span className="text-[13px] text-ink">{value}</span>
    </div>
  );
}

export default async function SubmissionsPage() {
  const rows = await listSubmissions();

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Property submissions"
        sub="Listings owners sent through the public sell form, waiting to be checked before anything goes live."
        actions={
          <Link href="/sell" className={deskButton}>
            Open the sell form
          </Link>
        }
      />

      <p className="max-w-2xl text-[13px] text-soft">
        Nothing here is on the website yet. Open one to fix the wording and add
        photographs before you publish it — approving puts it live exactly as
        written.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          note="Every submission has been dealt with. New ones appear here the moment an owner sends the sell form."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <Card key={row.id} className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="text-[17px] font-bold text-ink">{row.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="quiet">Awaiting review</Chip>
                    <span className="text-[12px] text-muted">
                      {[row.locality, row.city].filter(Boolean).join(", ") || "Location not given"}
                      {row.refCode ? ` · ${row.refCode}` : ""}
                      {row.submittedAt ? ` · ${formatDateTime(row.submittedAt)}` : ""}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/admin/properties/${row.id}/edit`}
                  className={`whitespace-nowrap ${deskButton}`}
                >
                  Review &amp; edit
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-line-soft pt-4 sm:grid-cols-4">
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
                <p className="whitespace-pre-line border-t border-line-soft pt-4 text-[13px] text-soft">
                  {row.description}
                </p>
              )}
              {row.sellerNotes && <p className="text-[13px] text-muted">{row.sellerNotes}</p>}

              <div className="border-t border-line-soft pt-4">
                <SubmissionActions id={row.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
