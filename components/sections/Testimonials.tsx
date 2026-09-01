import { TESTIMONIALS } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listTestimonialVideos } from "@/lib/db/queries";
import { VideoTestimonials } from "@/components/VideoTestimonials";

/**
 * "From the Ground" — the client's own reels: site walkthroughs, plot
 * visits, buying advice.
 *
 * Redesigned away from a heading column beside a 2x2 grid. Two problems
 * with that: the heading column was mostly empty space, and the section sat
 * directly under the written-testimonial wall on a matching light
 * background, so the page read as the same section rendered twice. It is
 * now a full-width navy band with a centred heading — the same treatment
 * the other dark bands get — which separates it from the wall above and the
 * services grid below on colour alone.
 *
 * The written-quote fallback is gone with it: that loop existed when this
 * was the only place quotes appeared, and it is now a worse copy of the
 * testimonial wall. No videos means no section.
 */
export async function Testimonials() {
  const videos = await listTestimonialVideos();
  if (videos.length === 0) return null;

  return (
    <section className="overflow-hidden bg-navy py-16 md:py-24">
      <div className="px-5 md:px-12">
        <SectionHeading
          align="center"
          tone="dark"
          eyebrow="From Our Clients"
          title={TESTIMONIALS.heading}
          sub={TESTIMONIALS.sub}
        />
      </div>

      <VideoTestimonials videos={videos} />
    </section>
  );
}
