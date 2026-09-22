import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { textTestimonials } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddRecordDialog } from "@/components/admin/AddRecordDialog";
import { TextTestimonialForm } from "@/components/admin/TextTestimonialForm";
import {
  Chip,
  EmptyState,
  PageHead,
  Table,
  TableWrap,
  deskRowLink,
  numericCell,
} from "@/components/admin/desk";
import { createTextTestimonial, deleteTextTestimonial } from "./actions";

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
    <div className="flex flex-col gap-4">
      <PageHead
        title="Written testimonials"
        sub="Client quotes for the “What our clients say” strip. Video reels are under Website content → Video Reels."
        actions={
          <AddRecordDialog
            label="Add client quote"
            title="Add a client quote"
            description="Appears in the “What our clients say” wall on the landing page."
          >
            <TextTestimonialForm action={createTextTestimonial} />
          </AddRecordDialog>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          note="The quote wall stays hidden on the landing page until the first written testimonial is added."
        />
      ) : (
        <TableWrap>
          <Table className="min-w-[680px]">
            <thead>
              <tr>
                <th scope="col" className={numericCell}>
                  Order
                </th>
                <th scope="col">Quote</th>
                <th scope="col">Client</th>
                <th scope="col">State</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className={`${numericCell} text-soft`}>{t.sortOrder}</td>
                  <td>
                    <span className="line-clamp-2 max-w-lg text-ink">
                      &ldquo;{t.quote}&rdquo;
                    </span>
                  </td>
                  <td className="text-soft">
                    {t.author}
                    {t.context ? ` · ${t.context}` : ""}
                  </td>
                  <td>
                    <Chip tone={t.isPublished ? "live" : "neutral"}>
                      {t.isPublished ? "Published" : "Draft"}
                    </Chip>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/text-testimonials/${t.id}/edit`}
                        className={deskRowLink}
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteTextTestimonial}
                        id={t.id}
                        confirmText={`Delete the testimonial by ${t.author}?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
