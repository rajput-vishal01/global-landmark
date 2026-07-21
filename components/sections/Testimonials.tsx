import { TESTIMONIALS } from "@/lib/data";
import { listTestimonialVideos } from "@/lib/db/queries";
import { VideoTestimonials } from "@/components/VideoTestimonials";

const QUOTES = TESTIMONIALS.quotes;

/**
 * Client testimonials: sticky serif intro on the left. The right column
 * shows admin-managed YouTube video testimonials when any exist, and falls
 * back to the auto-scrolling written-quote loop until then.
 */
export async function Testimonials() {
  const videos = await listTestimonialVideos();

  return (
    <section className="grid grid-cols-1 gap-14 bg-cream px-5 py-20 md:grid-cols-[1fr_1.6fr] md:gap-20 md:px-12 md:py-28">
      <div className="md:sticky md:top-32 md:self-start">
        <h2 data-reveal className="max-w-sm text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          {TESTIMONIALS.heading}
        </h2>
        <p data-reveal className="mt-5 max-w-sm text-pretty text-body font-sans text-ink-muted">
          {TESTIMONIALS.sub}
        </p>
      </div>

      {videos.length > 0 ? (
        <VideoTestimonials videos={videos} />
      ) : (
      <div
        data-reveal
        className="group/scroll relative max-h-[34rem] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
      >
        <div className="animate-marquee-y flex flex-col group-hover/scroll:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex flex-col">
              {QUOTES.map((item) => (
                <figure
                  key={`${copy}-${item.name}`}
                  className="flex flex-col gap-5 border-b border-border py-9"
                >
                  <blockquote className="max-w-xl text-balance font-serif text-h4 leading-snug text-ink">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-baseline gap-3">
                    <span className="h-px w-8 bg-gold" aria-hidden />
                    <span className="text-meta font-sans text-ink">{item.name}</span>
                    <span className="text-meta font-sans text-ink-muted">{item.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
