import { listTestimonialVideos } from "@/lib/db/queries";
import { VideoThumb } from "@/components/VideoThumb";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { TestimonialCreateForm } from "./TestimonialCreateForm";
import { deleteTestimonialVideo } from "./actions";

export const metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  const videos = await listTestimonialVideos();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-h2 text-ink">Video testimonials</h1>
        <p className="mt-2 max-w-2xl text-body font-sans text-ink-muted">
          Paste a YouTube or Instagram reel link — it appears in the video
          section of the landing page.
        </p>
      </div>

      <TestimonialCreateForm />

      {videos.length === 0 ? (
        <p className="text-body font-sans text-ink-muted">
          No videos yet. The landing page shows written quotes until the
          first video is added.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            return (
            <li key={video.id} className="border border-border bg-white p-3">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-dark-deep">
                <VideoThumb provider={video.provider} videoId={video.videoId} />
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <p className="min-w-0 font-sans text-meta text-ink">
                  {video.caption || <span className="text-ink-muted">No caption</span>}
                  <span className="mt-0.5 block truncate text-[0.75rem] text-ink-muted">
                    {video.provider} · {video.videoId}
                  </span>
                </p>
                <DeleteButton
                  action={deleteTestimonialVideo}
                  id={video.id}
                  label="Remove"
                  confirmText="Remove this video from the site?"
                />
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
