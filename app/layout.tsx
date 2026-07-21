import type { Metadata } from "next";
import { Prata, Manrope } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { COMPANY, SEO } from "@/lib/data";
import { jsonLdHtml, organizationJsonLd, SITE_URL } from "@/lib/seo";

const prata = Prata({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
    images: [{ url: SEO.ogImage, width: 1200, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.description,
    images: [SEO.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the head script stamps .js on <html> before
    // hydration (deliberate — CSS pre-hide gate), which React would flag.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${prata.variable} ${manrope.variable}`}
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
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(organizationJsonLd()) }}
        />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
