import { TextTestimonialForm } from "@/components/admin/TextTestimonialForm";
import { createTextTestimonial } from "../actions";

export const metadata = { title: "Add written testimonial" };

export default function NewTextTestimonialPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-h2 text-ink">Add written testimonial</h1>
      <TextTestimonialForm action={createTextTestimonial} />
    </div>
  );
}
