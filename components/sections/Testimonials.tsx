import { TESTIMONIALS } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listTestimonialVideos } from "@/lib/db/queries";
import { VideoTestimonials } from "@/components/VideoTestimonials";

const QUOTES = TESTIMONIALS.quotes;

/**
 * Client testimonials: serif intro on the left. The right column shows
 * admin-managed YouTube video testimonials when any exist, and falls back
 * to the auto-scrolling written-quote loop until then.
 *
 * The intro column used to stick to the viewport while the quotes scrolled
 * past it. Sticky is scroll-driven behaviour like any other and it went
 * with the rest — the column is short, so it now simply sits at the top of
 * its cell.
 */
export async function Testimonials() {
  const videos = await listTestimonialVideos();

  return (
    <section className="grid grid-cols-1 gap-10 bg-cream px-5 py-16 md:grid-cols-[1fr_1.6fr] md:gap-16 md:px-12 md:py-24">
      {/* Wrapped: SectionHeading bottom-aligns its own row, and this cell is
          as tall as the quote loop beside it. */}
      <div>
        <SectionHeading
          flush
          eyebrow="From Our Clients"
          title={TESTIMONIALS.heading}
          sub={TESTIMONIALS.sub}
        />
      </div>

      {videos.length > 0 ? (
        <VideoTestimonials videos={videos} />
      ) : (
        <div className="group/scroll relative max-h-[32rem] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee-y flex flex-col group-hover/scroll:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex flex-col">
                {QUOTES.map((item) => (
                  <figure
                    key={`${copy}-${item.name}`}
                    className="flex flex-col gap-4 border-b border-border py-7"
                  >
                    <blockquote className="max-w-xl text-balance font-serif text-h4 leading-snug text-heading">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                    <figcaption className="flex items-baseline gap-3">
                      <span className="h-px w-8 bg-gold" aria-hidden />
                      <span className="text-meta font-sans text-ink">{item.name}</span>
                      <span className="text-meta font-sans text-ink-muted">
                        {item.role}
                      </span>
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
