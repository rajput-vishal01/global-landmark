import Link from "next/link";
import { count, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, services, testimonialVideos, textTestimonials } from "@/lib/db/schema";
import { todayIST } from "@/lib/db/queries";
import { Card, PageHead, deskFace, focusRing } from "@/components/admin/desk";

export const metadata = { title: "Website content" };

/**
 * The four screens that edit the landing page, behind one rail row.
 *
 * The rail carried these as four rows named after their tables, which told a
 * broker nothing about which strip of the public page each one moved. A hub
 * is only worth the extra click if it says something the rail could not, so
 * every card carries the count that is live right now — "0 services" is the
 * answer to "why is that section missing from the site", and nothing in the
 * old rail could ever say it.
 */

/**
 * One count, failing on its own.
 *
 * Same fail-soft contract as every other admin screen, but per figure rather
 * than per page: a hub that 500s because one table is unhappy is strictly
 * worse than one showing a zero next to three good numbers.
 */
async function countOr0(
  label: string,
  run: () => Promise<{ n: number }[]>
): Promise<number> {
  try {
    const [row] = await run();
    return row?.n ?? 0;
  } catch (err) {
    console.error(`admin website hub count failed (${label}):`, err);
    return 0;
  }
}

type HubCard = {
  href: string;
  label: string;
  /** What this screen changes on the public site — not what the table holds. */
  what: string;
  value: number;
  /** The count in words, including what zero means for the public page. */
  note: string;
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function AdminWebsiteContentPage() {
  const today = todayIST();

  const [featuredDeals, reels, quotes, serviceCards] = await Promise.all([
    // Same window the dashboard counts: running today, or queued to run.
    // An expired window is history, not content anybody is managing.
    countOr0("featured deals", () =>
      db.select({ n: count() }).from(deals).where(gte(deals.endsAt, today))
    ),
    // No draft state on reels — every row added is on the site.
    countOr0("video reels", () => db.select({ n: count() }).from(testimonialVideos)),
    countOr0("client quotes", () =>
      db
        .select({ n: count() })
        .from(textTestimonials)
        .where(eq(textTestimonials.isPublished, true))
    ),
    countOr0("services", () =>
      db.select({ n: count() }).from(services).where(eq(services.isPublished, true))
    ),
  ]);

  const cards: HubCard[] = [
    {
      href: "/admin/deals",
      label: "Deal of the Week",
      what: "The Deal of the Week strip on the landing page.",
      value: featuredDeals,
      note:
        featuredDeals === 0
          ? "Nothing scheduled — the strip is left out entirely"
          : `${plural(featuredDeals, "window", "windows")} running or queued`,
    },
    {
      href: "/admin/testimonials",
      label: "Video Reels",
      what: "The client video wall on the landing page.",
      value: reels,
      note:
        reels === 0
          ? "No reels — the page falls back to the written quotes"
          : `${plural(reels, "reel", "reels")} on the site`,
    },
    {
      href: "/admin/text-testimonials",
      label: "Client Quotes",
      what: "The “What our clients say” quotes on the landing page.",
      value: quotes,
      note:
        quotes === 0
          ? "No published quotes — the wall stays hidden"
          : `${plural(quotes, "quote", "quotes")} published`,
    },
    {
      href: "/admin/services",
      label: "Services",
      what: "The “Our Services” grid on the landing page.",
      value: serviceCards,
      note:
        serviceCards === 0
          ? "No published cards — the section stays hidden"
          : `${plural(serviceCards, "card", "cards")} published`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Website content"
        sub="The four strips of the landing page you edit by hand, and how much is on each of them right now."
      />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            {/* The whole card is the link, not a word inside it — a hub whose
                targets are four small hit areas is slower than the rail it
                replaced. */}
            <Link href={card.href} className={`block rounded-[10px] ${focusRing}`}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[13px] font-semibold text-ink">{card.label}</p>
                  <p
                    className={`${deskFace} shrink-0 text-2xl font-bold leading-none tabular-nums text-ink`}
                  >
                    {card.value}
                  </p>
                </div>
                <p className="mt-2 text-[12.5px] text-soft">{card.what}</p>
                <p className="mt-1 text-[11.5px] text-muted">{card.note}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
