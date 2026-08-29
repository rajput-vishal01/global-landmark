import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";

/**
 * The chrome every non-landing public page shares.
 *
 * Before this existed, each subpage hand-rolled its own opening band and
 * they had all drifted: three different top paddings, breadcrumbs on some
 * pages and not others, an eyebrow on the detail pages only, and heroes
 * ranging from a flat 12rem strip to an 88vh photograph. A portal is meant
 * to feel like one product — you should be able to tell where you are and
 * how you got there without the page changing personality.
 *
 * Navy, not the near-black the bands used to use: it is the chrome token
 * (same as the footer), it separates "site furniture" from the photographic
 * heroes, and it gives the yellow CTA and cream type a ground they were
 * designed against.
 */

/** Standard vertical rhythm for a content section on white. */
export const SECTION = "px-5 py-16 md:px-12 md:py-24";

/** Same rhythm, banded — used to alternate against SECTION down a page. */
export const SECTION_BAND =
  "border-y border-border bg-cream px-5 py-16 md:px-12 md:py-24";

const EYEBROW_DARK =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.24em] text-cta";

type PageHeaderProps = {
  title: ReactNode;
  /** Small uppercase kicker above the title. Matches the hero's treatment. */
  eyebrow?: ReactNode;
  sub?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Cover photograph. Given one, the band becomes a scrimmed image hero. */
  image?: { src: string; alt?: string } | null;
  /** Right-hand slot on wide screens — facts, counts, a secondary action. */
  aside?: ReactNode;
  /** Extra content directly under the sub (tag rows, badges). */
  children?: ReactNode;
};

export function PageHeader({
  title,
  eyebrow,
  sub,
  breadcrumbs,
  image,
  aside,
  children,
}: PageHeaderProps) {
  const body = (
    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} tone="dark" />
          </div>
        )}
        {eyebrow && <p className={EYEBROW_DARK}>{eyebrow}</p>}
        <h1
          className={`max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream ${
            eyebrow ? "mt-4" : ""
          }`}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-5 max-w-2xl text-pretty text-body font-sans text-cream/75">
            {sub}
          </p>
        )}
        {children}
      </div>
      {aside && <div className="shrink-0 md:pb-2">{aside}</div>}
    </div>
  );

  if (image) {
    return (
      <section className="relative flex min-h-[60vh] flex-col justify-end overflow-hidden bg-navy-deep">
        <Image
          src={image.src}
          alt={image.alt ?? ""}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Black rather than navy: the scrim sits on a photograph, and a
            tinted one shifts every cover image toward the chrome colour. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20"
        />
        <div className="relative px-5 pb-14 pt-40 md:px-12 md:pb-16">{body}</div>
      </section>
    );
  }

  return (
    <section className="bg-navy px-5 pb-14 pt-32 md:px-12 md:pb-16 md:pt-40">
      {body}
    </section>
  );
}

/**
 * The heading that opens a content section: small gold eyebrow, serif title,
 * an optional right-aligned count or link, and one hairline underneath.
 */
export function SectionHeading({
  eyebrow,
  title,
  aside,
  tone = "light",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={`mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b pb-5 md:mb-12 ${
        isDark ? "border-cream/15" : "border-border"
      }`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className={`text-eyebrow mb-2 font-sans font-medium uppercase tracking-[0.2em] ${
              isDark ? "text-cta" : "text-gold-deep"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-balance font-serif text-h3 ${
            isDark ? "text-cream" : "text-heading"
          }`}
        >
          {title}
        </h2>
      </div>
      {aside && (
        <div
          className={`text-meta font-sans ${isDark ? "text-cream/70" : "text-ink-muted"}`}
        >
          {aside}
        </div>
      )}
    </div>
  );
}
