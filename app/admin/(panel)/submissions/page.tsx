import Link from "next/link";
import { asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyImages, propertyOwners } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/dates";
import { formatArea, formatIndianShort } from "@/lib/attributes";
import { SubmissionActions } from "./SubmissionActions";
import { EmptyState, PageHead, cardChrome, deskButton, deskRowLink } from "@/components/admin/desk";

export const metadata = { title: "Property submissions" };

/**
 * The review queue for the public /sell form (Sep 2026 redesign).
 *
 * A submission is an ordinary property row with `submittedAt` set, so this
 * is a filtered view of the portfolio, split into three tabs by what has
 * happened to it: waiting, live, declined. Approving publishes the row;
 * declining archives it; a live one can be taken down from here. All three
 * leave it editable in the normal property editor.
 *
 * Local to this route rather than lib/db/queries.ts: every row carries the
 * seller's name, phone and private address, which must never reach the
 * public query layer.
 */

const TABS = [
  { state: "draft", label: "Awaiting review" },
  { state: "published", label: "On the website" },
  { state: "archived", label: "Declined" },
] as const;

type TabState = (typeof TABS)[number]["state"];

type SubmissionRow = {
  id: number;
  refCode: string | null;
  title: string;
  category: string;
  location: string;
  city: string | null;
  propertyType: string | null;
  configuration: string | null;
  areaValue: number | null;
  areaUnit: string;
  demandPrice: number | null;
  description: string;
  mapsUrl: string | null;
  submittedAt: Date | null;
  publicationState: string;
  sellerName: string | null;
  sellerMobile: string | null;
  sellerAddress: string | null;
  sellerNotes: string | null;
};

async function listSubmissions(): Promise<SubmissionRow[]> {
  try {
    return await db
      .select({
        id: properties.id,
        refCode: properties.refCode,
        title: properties.title,
        category: properties.category,
        location: properties.location,
        city: properties.city,
        propertyType: properties.propertyType,
        configuration: properties.configuration,
        areaValue: properties.areaValue,
        areaUnit: properties.areaUnit,
        demandPrice: properties.demandPrice,
        description: properties.description,
        mapsUrl: properties.mapsUrl,
        submittedAt: properties.submittedAt,
        publicationState: properties.publicationState,
        sellerName: propertyOwners.name,
        sellerMobile: propertyOwners.mobile,
        sellerAddress: propertyOwners.address,
        sellerNotes: propertyOwners.notes,
      })
      .from(properties)
      .leftJoin(propertyOwners, eq(propertyOwners.propertyId, properties.id))
      .where(isNotNull(properties.submittedAt))
      .orderBy(desc(properties.submittedAt));
  } catch (err) {
    // Fail soft: a database blip shows an empty queue, not a 500.
    console.error("listSubmissions failed:", err);
    return [];
  }
}

/** Every submitted photo, keyed by property — one query for the page. */
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
      byProperty.set(row.propertyId, [...(byProperty.get(row.propertyId) ?? []), row.url]);
    }
  } catch (err) {
    console.error("admin submission photos failed:", err);
  }
  return byProperty;
}

/** A 10-digit Indian mobile gets the country code WhatsApp needs. */
function waLink(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const requested = (await searchParams).state;
  const active: TabState = TABS.some((t) => t.state === requested)
    ? (requested as TabState)
    : "draft";

  const all = await listSubmissions();
  const counts = Object.fromEntries(
    TABS.map((t) => [t.state, all.filter((r) => (r.publicationState ?? "draft") === t.state).length])
  ) as Record<TabState, number>;
  const rows = all.filter((r) => r.publicationState === active);
  const photos = await listPhotos(rows.map((r) => r.id));

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Property submissions"
        sub="Owners who listed a property through the website's sell page. Review, fix the wording, then publish."
        actions={
          <Link href="/sell" className={deskButton}>
            Open the sell page
          </Link>
        }
      />

      <nav aria-label="Submission status" className="flex flex-wrap gap-1 rounded-lg bg-raise p-1 sm:w-fit">
        {TABS.map((tab) => {
          const isActive = tab.state === active;
          return (
            <Link
              key={tab.state}
              href={`/admin/submissions?state=${tab.state}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                isActive ? "bg-surface text-ink shadow-[0_1px_2px_rgb(20_20_20/0.08)]" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                  isActive && tab.state === "draft" && counts.draft > 0
                    ? "bg-gold text-surface"
                    : "bg-ink/[0.06] text-soft"
                }`}
              >
                {counts[tab.state]}
              </span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title={
            active === "draft"
              ? "Nothing waiting"
              : active === "published"
                ? "No submissions on the website"
                : "Nothing declined"
          }
          note={
            active === "draft"
              ? "When an owner sends the sell form, it lands here for review."
              : "Submissions move here from Awaiting review."
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <SubmissionCard key={row.id} row={row} photos={photos.get(row.id) ?? []} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SubmissionCard({ row, photos }: { row: SubmissionRow; photos: string[] }) {
  const facts: [string, string][] = [
    ["For", row.category === "lease" ? "Rent / lease" : "Sale"],
    ["Type", [row.propertyType, row.configuration].filter(Boolean).join(" · ") || "—"],
    ["Area", row.areaValue ? formatArea(row.areaValue, row.areaUnit) : "—"],
    ["Asking", row.demandPrice ? formatIndianShort(row.demandPrice) : "—"],
  ];

  return (
    <li className={`${cardChrome} grid grid-cols-1 overflow-hidden lg:grid-cols-[15rem_minmax(0,1fr)]`}>
      {/* Photos first: whether a submission is worth a call is decided from
          the pictures, not the specifications. */}
      <div className="flex flex-col gap-1 bg-raise p-1">
        {photos.length > 0 ? (
          <>
            <a href={photos[0]} target="_blank" rel="noopener noreferrer" className="block aspect-[16/9] overflow-hidden rounded-md lg:aspect-[4/3]">
              {/* Plain img: same-origin thumbnails, nothing for next/image to save. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt={`${row.title} — photo 1`} className="h-full w-full object-cover" />
            </a>
            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-1">
                {photos.slice(1, 5).map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${row.title} — photo ${i + 2}`} className="h-full w-full object-cover" />
                    {i === 3 && photos.length > 5 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[12px] font-semibold text-white">
                        +{photos.length - 5}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center rounded-md text-[12px] text-muted lg:aspect-[4/3]">
            No photos sent
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-ink">{row.title}</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {[row.location || row.city || "Location not given", row.refCode, row.submittedAt && `sent ${formatDateTime(row.submittedAt)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Link href={`/admin/properties/${row.id}/edit`} className={`${deskButton} whitespace-nowrap`}>
            Review &amp; edit
          </Link>
        </div>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
              <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {row.description && (
          <p className="line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-soft">
            {row.description}
          </p>
        )}

        {/* Private — the seller, their exact address and notes. */}
        <div className="flex flex-col gap-2 rounded-lg bg-raise px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-[13px] font-semibold text-ink">{row.sellerName ?? "Seller not named"}</span>
            {row.sellerMobile && (
              <>
                <a href={`tel:${row.sellerMobile}`} className={`${deskRowLink} text-[13px]`}>
                  {row.sellerMobile}
                </a>
                <a href={waLink(row.sellerMobile)} target="_blank" rel="noopener noreferrer" className={`${deskRowLink} text-[13px]`}>
                  WhatsApp
                </a>
              </>
            )}
            {row.mapsUrl && (
              <a href={row.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${deskRowLink} text-[13px]`}>
                Map
              </a>
            )}
            <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Admin only
            </span>
          </div>
          {row.sellerAddress && <p className="text-[12.5px] text-soft">{row.sellerAddress}</p>}
          {row.sellerNotes && <p className="text-[12px] text-muted">{row.sellerNotes}</p>}
        </div>

        <div className="mt-auto">
          <SubmissionActions id={row.id} publicationState={row.publicationState} />
        </div>
      </div>
    </li>
  );
}
