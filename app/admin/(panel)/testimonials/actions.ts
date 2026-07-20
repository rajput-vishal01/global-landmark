"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testimonialVideos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { parseVideo } from "@/lib/video";
import type { DeleteState } from "../properties/actions";

export type TestimonialFormState = { error?: string };

export async function createTestimonialVideo(
  _prev: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  await requireAdmin();
  const parsed = parseVideo(String(formData.get("video") ?? ""));
  if (!parsed) {
    return { error: "Paste a valid YouTube or Instagram link (or a YouTube ID)." };
  }
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 200);

  try {
    await db.insert(testimonialVideos).values({
      provider: parsed.provider,
      videoId: parsed.videoId,
      caption,
    });
  } catch (err) {
    console.error("createTestimonialVideo failed:", err);
    return { error: "Could not save the video. Try again." };
  }
  revalidatePublicSite();
  redirect("/testimonials");
}

export async function deleteTestimonialVideo(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing video id." };
  try {
    await db.delete(testimonialVideos).where(eq(testimonialVideos.id, id));
  } catch (err) {
    console.error("deleteTestimonialVideo failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/testimonials");
}
