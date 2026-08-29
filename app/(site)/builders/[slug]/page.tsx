import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { getBuilderBySlug, type PublicBuilderDetail } from "@/lib/db/queries";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { COMPANY } from "@/lib/data";
import { breadcrumbJsonLd, canonical, jsonLdHtml } from "@/lib/seo";

// ISR: cached and served instantly; admin edits bust the cache on save.
export const revalidate = 3600;

type BuilderProject = PublicBuilderDetail["projects"][number];

function projectLocation(project: BuilderProject): string {
  return [project.locality, project.sector, project.city].filter(Boolean).join(", ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const builder = await getBuilderBySlug(slug);
  if (!builder) return { title: "Not found", robots: { index: false } };
  const path = `/builders/${builder.slug}`;
  // SERPs truncate around 60-65 chars; admin-entered names are unbounded.
  const title = `${builder.name}${builder.belongsTo ? ` — ${builder.belongsTo}` : ""}`.slice(0, 65);
  const description =
    builder.about?.slice(0, 160) || `Developer profile${builder.belongsTo ? ` — ${builder.belongsTo}` : ""}.`;
  const ogImages = builder.logoUrl ? [{ url: canonical(builder.logoUrl) }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: COMPANY.legalName,
      title,
      description,
      url: canonical(path),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function BuilderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const builder = await getBuilderBySlug(slug);
  if (!builder) notFound();

  // Organization — a developer profile, not our own agency (that's
  // organizationJsonLd()); no ready-made schema.org type for "builder we
  // are not", so a plain Organization is the honest, low-risk fit.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: builder.name,
    ...(builder.about ? { description: builder.about } : {}),
    url: canonical(`/builders/${builder.slug}`),
    ...(builder.logoUrl ? { logo: canonical(builder.logoUrl) } : {}),
    ...(builder.website ? { sameAs: [builder.website] } : {}),
  };

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: builder.name, path: `/builders/${builder.slug}` },
  ];
  const breadcrumbLd = breadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd) }}
      />
      <Header />
      <main>
        {/* Hero — quiet dark ground, same shape as the project detail hero */}
        <section className="relative flex min-h-[60vh] flex-col justify-end overflow-hidden bg-dark-deep">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          />
          <div className="relative px-5 pb-16 pt-40 md:px-12 md:pb-20">
            <div className="mb-4">
              <Breadcrumbs items={breadcrumbItems} tone="dark" />
            </div>
            <span className="mb-8 block h-px w-16 bg-gold" />
            <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.25em] text-cream/70">
              Developer
            </p>
            <h1 className="mt-4 max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
              {builder.name}
            </h1>
            {builder.belongsTo && (
              <p className="mt-5 max-w-xl text-pretty text-body font-sans text-cream/80">
                {builder.belongsTo}
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-14 px-5 py-20 md:grid-cols-[1.7fr_1fr] md:gap-20 md:px-12 md:py-28">
          <div className="flex flex-col gap-16">
            {builder.about && (
              <div>
                <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  About
                </span>
                <div className="mt-6 flex max-w-2xl flex-col gap-5">
                  {builder.about
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p key={i} className="text-pretty text-body font-sans leading-relaxed text-ink">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                <span className="block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Projects
                </span>
                {builder.projects.length > 0 && (
                  <span className="text-meta font-sans text-ink-muted">
                    {builder.projects.length} project{builder.projects.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {builder.projects.length === 0 ? (
                <p className="text-pretty text-body font-sans text-ink-muted">
                  No projects listed for this developer yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  {builder.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="md:sticky md:top-28 md:self-start">
            <div className="border border-border bg-white p-8 md:p-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              {builder.logoUrl && (
                <div className="relative mb-6 h-14 w-full">
                  <Image
                    src={builder.logoUrl}
                    alt={builder.name}
                    fill
                    sizes="240px"
                    className="object-contain object-left"
                  />
                </div>
              )}
              <dl className="flex flex-col">
                {builder.belongsTo && (
                  <div className="flex items-baseline justify-between gap-6 border-t border-border py-3.5 first:border-t-0">
                    <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                      Belongs To
                    </dt>
                    <dd className="break-words text-right font-sans text-meta text-ink">
                      {builder.belongsTo}
                    </dd>
                  </div>
                )}
                {builder.website && (
                  <div className="flex items-baseline justify-between gap-6 border-t border-border py-3.5 first:border-t-0">
                    <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                      Website
                    </dt>
                    <dd className="break-words text-right font-sans text-meta text-ink">
                      <a
                        href={builder.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                      >
                        Visit ↗
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </section>

        <CTABand />
      </main>
      <Footer />
    </>
  );
}

function ProjectCard({ project }: { project: BuilderProject }) {
  const location = projectLocation(project);
  return (
    <Link href={`/projects/${project.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
        {project.coverImage && (
          <Image
            src={project.coverImage}
            alt={project.name}
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="img-zoom"
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-h4 text-ink">{project.name}</h3>
        {location && <p className="text-meta font-sans text-ink-muted">{location}</p>}
        {project.possessionStatus && (
          <p className="text-meta font-sans text-ink-muted">{project.possessionStatus}</p>
        )}
      </div>
    </Link>
  );
}
