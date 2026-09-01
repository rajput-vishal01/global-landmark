import { StatCounter } from "@/components/ui/StatCounter";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { resolveCredibility } from "@/lib/site-settings";

/**
 * The proof band directly under the hero: eyebrow, serif claim, supporting
 * line, then three figures on a hairline.
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

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-10 border-t border-border pt-12 sm:grid-cols-2">
          {CREDIBILITY.stats.map((stat) => (
            <div key={stat.label}>
              <StatCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                label={stat.label}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
