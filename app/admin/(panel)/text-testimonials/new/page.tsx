import { TextTestimonialForm } from "@/components/admin/TextTestimonialForm";
import { createTextTestimonial } from "../actions";
import Link from "next/link";
import { PageHead, deskButton } from "@/components/admin/desk";

export const metadata = { title: "Add written testimonial" };

export default function NewTextTestimonialPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Add written testimonial"
        sub="A client quote and its author, shown on the landing page."
        actions={
          <Link href="/admin/text-testimonials" className={deskButton}>
            Cancel
          </Link>
        }
      />
      <TextTestimonialForm action={createTextTestimonial} />
    </div>
  );
}
