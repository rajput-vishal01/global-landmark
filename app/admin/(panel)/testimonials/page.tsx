import { listTestimonialVideos } from "@/lib/db/queries";
import { VideoThumb } from "@/components/VideoThumb";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Card, EmptyState, PageHead } from "@/components/admin/desk";
import { TestimonialCreateForm } from "./TestimonialCreateForm";
import { deleteTestimonialVideo } from "./actions";

export const metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  const videos = await listTestimonialVideos();

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Video testimonials"
        sub="Client reels for the landing page — paste a YouTube or Instagram link and the thumbnail is pulled in for you."
      />

      <TestimonialCreateForm />

      {videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          note="Until the first reel is added, the landing page falls back to the written quotes."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <li key={video.id}>
              <Card>
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-ink">
                  <VideoThumb provider={video.provider} videoId={video.videoId} showMissingHint />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[13px] text-ink">
                    {video.caption || <span className="text-muted">No caption</span>}
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                      {video.provider} ·{" "}
                      <a
                        href={
                          video.provider === "instagram"
                            ? `https://www.instagram.com/reel/${video.videoId}/`
                            : `https://www.youtube.com/watch?v=${video.videoId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-line underline-offset-2 hover:text-ink"
                      >
                        Open
                      </a>
                    </span>
                  </p>
                  <DeleteButton
                    action={deleteTestimonialVideo}
                    id={video.id}
                    label="Remove"
                    confirmText="Remove this video from the site?"
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
