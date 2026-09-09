import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { PageHeader, SECTION } from "./page-chrome";
import { formatDate } from "@/lib/dates";
import type { LegalDocument } from "@/lib/legal";

/**
 * The privacy policy and the terms, drawn the same way.
 *
 * One component because the two documents are structurally identical — a
 * title, a date, and a run of headed sections — and two hand-written pages
 * would drift on the first wording change. The content lives in lib/legal.ts.
 *
 * Deliberately narrow: `max-w-2xl` is about 75 characters at this size, which
 * is the measure long prose is readable at. The rest of the site is wide
 * because it is showing photographs; this is the one place that is not.
 */
export function LegalPage({
  doc,
  path,
}: {
  doc: LegalDocument;
  /** Its own route, for the breadcrumb. */
  path: string;
}) {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          breadcrumbs={[
            { name: "Home", path: "/" },
            { name: doc.title, path },
          ]}
          eyebrow="Legal"
          title={doc.title}
          sub={doc.intro}
        />

        <section className={SECTION}>
          <div className="mx-auto max-w-2xl">
            <p className="text-meta font-sans text-ink-muted">
              Last updated {formatDate(doc.updated)}
            </p>

            <div className="mt-10 flex flex-col gap-10">
              {doc.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-serif text-h4 text-heading">{section.heading}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-body font-sans text-ink">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.list && (
                    <ul className="mt-4 flex flex-col gap-2">
                      {section.list.map((item) => (
                        <li
                          key={item}
                          // The gold rule is the bullet. A disc would be the
                          // only round dot on the site.
                          className="border-l-2 border-gold/40 pl-4 text-body font-sans text-ink"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
