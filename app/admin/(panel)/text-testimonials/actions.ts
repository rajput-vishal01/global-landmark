"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { textTestimonials } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import type { DeleteState } from "../properties/actions";

/**
 * Written testimonials. A separate route from /admin/testimonials, which
 * manages VIDEO reels — the two tables and the two screens have nothing in
 * common beyond a sort order.
 */

export type TextTestimonialFormState = { error?: string };

function parseTestimonial(formData: FormData) {
  const sortOrder = Number(formData.get("sortOrder"));
  return {
    context: String(formData.get("context") ?? "").trim().slice(0, 200) || null,
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    isPublished: formData.get("isPublished") === "on",
  };
}

/** Quote + author are the whole point of the row; both are required. */
function requiredFields(formData: FormData) {
  return {
    quote: String(formData.get("quote") ?? "").trim().slice(0, 1000),
    author: String(formData.get("author") ?? "").trim().slice(0, 200),
  };
}

export async function createTextTestimonial(
  _prev: TextTestimonialFormState,
  formData: FormData
): Promise<TextTestimonialFormState> {
  await requireAdmin();
  const { quote, author } = requiredFields(formData);
  if (!quote || !author) return { error: "A quote and an author are required." };

  try {
    await db.insert(textTestimonials).values({
      quote,
      author,
      ...parseTestimonial(formData),
    });
  } catch (err) {
    console.error("createTextTestimonial failed:", err);
    return { error: "Could not save the testimonial. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/text-testimonials");
}

export async function updateTextTestimonial(
  _prev: TextTestimonialFormState,
  formData: FormData
): Promise<TextTestimonialFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing testimonial id." };
  const { quote, author } = requiredFields(formData);
  if (!quote || !author) return { error: "A quote and an author are required." };

  try {
    await db
      .update(textTestimonials)
      .set({ quote, author, ...parseTestimonial(formData) })
      .where(eq(textTestimonials.id, id));
  } catch (err) {
    console.error("updateTextTestimonial failed:", err);
    return { error: "Could not save the testimonial. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/text-testimonials");
}

export async function deleteTextTestimonial(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing testimonial id." };

  try {
    await db.delete(textTestimonials).where(eq(textTestimonials.id, id));
  } catch (err) {
    console.error("deleteTextTestimonial failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/text-testimonials");
}
