import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { textTestimonials } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Button } from "@/components/ui/Button";
import { deleteTextTestimonial } from "./actions";

export const metadata = { title: "Written testimonials" };

/** Reads the table directly — unlike the public query, drafts must show. */
async function listAll() {
  try {
    return await db
      .select()
      .from(textTestimonials)
      .orderBy(asc(textTestimonials.sortOrder), asc(textTestimonials.id));
  } catch (err) {
    console.error("admin listAll text testimonials failed:", err);
    return [];
  }
}

export default async function AdminTextTestimonialsPage() {
  const rows = await listAll();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-h2 text-ink">Written testimonials</h1>
          <p className="mt-2 max-w-2xl text-body font-sans text-ink-muted">
            Quotes shown in the &ldquo;What our clients say&rdquo; strip on the
            landing page. Video reels are managed separately under
            Testimonials.
          </p>
        </div>
        <Button href="/admin/text-testimonials/new" variant="outline">
          Add testimonial
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          No written testimonials yet — the section stays hidden until the
          first one is added.
        </p>
      ) : (
        <ul className="border border-border bg-white">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="line-clamp-2 font-sans text-body text-ink">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-1 text-meta font-sans text-ink-muted">
                  by {t.author}
                  {t.context ? ` · ${t.context}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <span className="text-meta font-sans tabular-nums text-ink-muted">
                  #{t.sortOrder}
                </span>
                <span className="text-meta font-sans text-ink-muted">
                  {t.isPublished ? "Published" : "Draft"}
                </span>
                <Link
                  href={`/admin/text-testimonials/${t.id}/edit`}
                  className="text-meta font-sans text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteTextTestimonial}
                  id={t.id}
                  confirmText={`Delete the testimonial by ${t.author}?`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
