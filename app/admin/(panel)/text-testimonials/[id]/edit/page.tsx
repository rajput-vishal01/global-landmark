import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { textTestimonials } from "@/lib/db/schema";
import { TextTestimonialForm } from "@/components/admin/TextTestimonialForm";
import { updateTextTestimonial } from "../../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Edit written testimonial" };

export default async function EditTextTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [testimonial] = await db
    .select()
    .from(textTestimonials)
    .where(eq(textTestimonials.id, numericId));
  if (!testimonial) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Edit written testimonial"
        sub="A client quote and its author, shown on the landing page."
        actions={
          <Link href="/admin/text-testimonials" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <TextTestimonialForm action={updateTextTestimonial} testimonial={testimonial} />
    </div>
  );
}
