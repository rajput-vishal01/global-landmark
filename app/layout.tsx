import type { Metadata } from "next";
import { Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { COMPANY, SEO } from "@/lib/data";
import { jsonLdHtml, organizationJsonLd, SITE_URL } from "@/lib/seo";

// Typeface pairing for the portal restyle. Prata (display serif, single
// weight) and Manrope (geometric sans) gave the old editorial look; the
// client asked for the read of a mainstream property portal, which in this
// market means a humanist serif for headings over a rounded humanist sans
// for everything else. Playfair carries real weights, so headings can sit
// at 400 instead of relying on size alone.
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: {
    default: SEO.title,
    template: `%s | ${COMPANY.legalName}`,
  },
  description: SEO.description,
  openGraph: {
    type: "website",
    siteName: COMPANY.legalName,
    title: SEO.title,
    description: SEO.description,
    url: SITE_URL,
    images: [{ url: SEO.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.description,
    images: [SEO.ogImage],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = await organizationJsonLd();
  return (
    // suppressHydrationWarning: the head script stamps .js on <html> before
    // hydration (deliberate — CSS pre-hide gate), which React would flag.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${nunitoSans.variable}`}
    >
      <head>
        {/* Before first paint: lets CSS pre-hide reveal targets only when
            JS will actually run the reveal (no-JS visitors keep content). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js")`,
          }}
        />
      </head>
      <body className="bg-cream font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(orgJsonLd) }}
        />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
