import { TESTIMONIALS } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { listTestimonialVideos } from "@/lib/db/queries";
// EXPERIMENT: the 3D ring replaces the reel rail on trial. To revert, import
// VideoTestimonials again and render it in place of VideoRing below.
import { VideoRing } from "@/components/VideoRing";

/**
 * "From the Ground" — the client's own reels: site walkthroughs, plot
 * visits, buying advice.
 *
 * Redesigned away from a heading column beside a 2x2 grid. Two problems
 * with that: the heading column was mostly empty space, and the section sat
 * directly under the written-testimonial wall on a matching light
 * background, so the page read as the same section rendered twice. It is
 * now a full-width band with a centred heading — the same treatment
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
    // Graphite gradient against the now flat footer, so the last band and
    // the footer no longer read as one block.
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

      <VideoRing videos={videos} />
    </section>
  );
}
