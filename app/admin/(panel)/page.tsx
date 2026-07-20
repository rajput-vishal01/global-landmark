import Link from "next/link";
import { count, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { deals, projects, properties } from "@/lib/db/schema";
import { getActiveDeal, todayIST } from "@/lib/db/queries";

async function counts() {
  try {
    const today = todayIST();
    const [[p], [j], [d]] = await Promise.all([
      db.select({ n: count() }).from(properties),
      db.select({ n: count() }).from(projects),
      db.select({ n: count() }).from(deals).where(gte(deals.endsAt, today)),
    ]);
    return { properties: p.n, projects: j.n, deals: d.n };
  } catch {
    return { properties: 0, projects: 0, deals: 0 };
  }
}

export default async function AdminDashboard() {
  const [stats, activeDeal] = await Promise.all([counts(), getActiveDeal()]);

  const cards = [
    { label: "Properties", value: stats.properties, href: "/properties" },
    { label: "Projects", value: stats.projects, href: "/projects" },
    { label: "Live & queued deals", value: stats.deals, href: "/deals" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-h2 text-ink">Portfolio</h1>
        <p className="mt-2 text-body font-sans text-ink-muted">
          {activeDeal
            ? `Deal of the Week is live: ${activeDeal.property.title} (through ${activeDeal.endsAt}).`
            : "No Deal of the Week is currently live."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group border border-border bg-white p-6 transition-colors hover:border-gold"
          >
            <p className="font-serif text-h2 text-ink">{card.value}</p>
            <p className="text-eyebrow mt-1 font-sans font-medium uppercase tracking-[0.18em] text-ink-muted group-hover:text-gold-deep">
              {card.label}
            </p>
          </Link>
        ))}
      </div>
      <div>
        <Link
          href="/properties/new"
          className="inline-block bg-ink px-8 py-3.5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Add a property
        </Link>
      </div>
    </div>
  );
}
