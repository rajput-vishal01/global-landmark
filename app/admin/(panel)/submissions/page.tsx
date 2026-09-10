import Link from "next/link";
import { asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyImages, propertyOwners } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/dates";
import { formatIndianShort, formatArea } from "@/lib/attributes";
import { SubmissionActions } from "./SubmissionActions";
import {
  Card,
  Chip,
  EmptyState,
  PageHead,
  deskButton,
  type ChipTone,
} from "@/components/admin/desk";

export const metadata = { title: "Property submissions" };

/**
 * The review queue for the public /sell form.
 *
 * A submission is an ordinary property row with `submittedAt` set, so this
 * screen is a filtered view of the portfolio rather than a separate inbox.
 * Approving publishes the row; declining archives it; a published one can be
 * taken back down from here. All three leave it editable in the normal
 * property editor afterwards, which is where a broker will usually go first —
 * a seller's own wording is rarely publication-ready.
 *
 * It keeps showing published submissions on purpose: this is the one screen
 * that says "these listings are not ours", and the place to pull one off the
 * website without hunting for it among our own.
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
  publicationState: string;
};

/**
 * The submitted photographs, keyed by property.
 *
 * One query for the whole page rather than one per card: a submissions
 * inbox is short, but N+1 on a page that already joins owners is the kind of
 * thing that only shows up once the inbox is busy.
 */
async function listPhotos(ids: number[]): Promise<Map<number, string[]>> {
  const byProperty = new Map<number, string[]>();
  if (!ids.length) return byProperty;
  try {
    const rows = await db
      .select({ propertyId: propertyImages.propertyId, url: propertyImages.url })
      .from(propertyImages)
      .where(inArray(propertyImages.propertyId, ids))
      .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.id));
    for (const row of rows) {
      const list = byProperty.get(row.propertyId) ?? [];
      list.push(row.url);
      byProperty.set(row.propertyId, list);
    }
  } catch (err) {
    // Fail soft, like the list itself: a submission with no thumbnails is
    // still reviewable, a 500 is not.
    console.error("admin submission photos failed:", err);
  }
  return byProperty;
}

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
        publicationState: properties.publicationState,
        sellerName: propertyOwners.name,
        sellerMobile: propertyOwners.mobile,
        sellerNotes: propertyOwners.notes,
      })
      .from(properties)
      .leftJoin(propertyOwners, eq(propertyOwners.propertyId, properties.id))
      // Every submission, not just the ones still waiting. A published one
      // stays on this page on purpose: it is the screen that says "this
      // listing came from an owner, not from us", and the place to take it
      // back down without hunting for it in the full properties table.
      // submittedAt is what makes a row a submission — publicationState is
      // only what has happened to it since.
      .where(isNotNull(properties.submittedAt))
      .orderBy(desc(properties.submittedAt));
  } catch (err) {
    // Fail soft, like every other panel screen: a database blip shows an
    // empty queue, it does not 500 the panel.
    console.error("listSubmissions failed:", err);
    return [];
  }
}

/**
 * How a submission's publication state reads on this page.
 *
 * The words are about the website, not the database: an owner's submission
 * that is live is "On the website" — the thing the broker wants to know is
 * whether the public can see it, and the button beside it takes it down.
 * Anything unrecognised falls back to review, which is the safe reading.
 */
const STATES: Record<string, { tone: ChipTone; label: string }> = {
  draft: { tone: "quiet", label: "Awaiting review" },
  published: { tone: "live", label: "On the website" },
  archived: { tone: "neutral", label: "Declined" },
};

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
  const photos = await listPhotos(rows.map((row) => row.id));

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Property submissions"
        sub="Everything owners sent through the public sell form — waiting, live, or declined."
        actions={
          <Link href="/sell" className={deskButton}>
            Open the sell form
          </Link>
        }
      />

      <p className="max-w-2xl text-[13px] text-soft">
        These are not our own listings. Open one to fix the wording and add
        photographs before you publish it — approving puts it live exactly as
        written. Anything already on the website stays on this page, so you can
        take it back down from here.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          note="Nobody has sent the public sell form. Anything an owner submits appears here the moment they send it, and stays here after you publish it."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <Card key={row.id} className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="text-[17px] font-bold text-ink">{row.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={(STATES[row.publicationState] ?? STATES.draft).tone}>
                      {(STATES[row.publicationState] ?? STATES.draft).label}
                    </Chip>
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

              {/* The seller's own photographs, above the facts. A broker
                  triaging this inbox decides "is this worth my time" from the
                  pictures first — a row of specifications does not answer that
                  and a photograph does. Absent for a submission sent before
                  the form had an uploader, and for anyone who skipped it. */}
              {(photos.get(row.id) ?? []).length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {(photos.get(row.id) ?? []).map((url, i) => (
                    <li key={url} className="h-20 w-28 overflow-hidden bg-ink/5">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {/* Plain img, not next/image: these are 112px
                            thumbnails of same-origin uploads, so the optimiser
                            would cost a round trip to save nothing. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${row.title} — photo ${i + 1}`}
                          className="h-full w-full object-cover transition-opacity hover:opacity-85"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}

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
                <SubmissionActions id={row.id} publicationState={row.publicationState} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
