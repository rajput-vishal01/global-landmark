import { SectionHeading } from "@/components/ui/SectionHeading";
import { resolveCredibility } from "@/lib/site-settings";

/**
 * The claim band directly under the hero: eyebrow, serif claim, supporting
 * line.
 *
 * It used to end in a row of counters — value sold, properties transacted,
 * years in the Tricity. Those are gone at the client's instruction: no
 * figure they cannot back up to a buyer belongs on the page, and the
 * surest way to hold that line is to have no figure at all. What is left
 * is the part that was always doing the work, which is the sentence.
 *
 * The band used to curve over the hero on a 4rem top radius. That read as
 * an editorial cover flap, which is the opposite of the flat, sectioned
 * portal the client asked for, so the section is now square and carries the
 * page's standard white/cream rhythm instead.
 */
export async function CredibilityBand() {
  // Same identifier as the static default (lib/data.ts's CREDIBILITY) so
  // every reference below picks up an admin override automatically (R-36).
  const CREDIBILITY = await resolveCredibility();
  return (
    <section className="bg-surface px-5 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          align="center"
          eyebrow={CREDIBILITY.eyebrow}
          title={
            <>
              {CREDIBILITY.headingPre}{" "}
              <span className="text-ink-muted">{CREDIBILITY.headingHighlight}</span>{" "}
              {CREDIBILITY.headingPost}
            </>
          }
          sub={CREDIBILITY.sub}
        />
      </div>
    </section>
  );
}
