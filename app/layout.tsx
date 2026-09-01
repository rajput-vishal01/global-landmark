import type { Metadata, Viewport } from "next";
import { Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
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
  // iOS reads almost none of the web app manifest. These four are what make
  // an installed icon on an iPhone look like an app rather than a bookmark:
  // the touch icon, standalone display, a dark status bar over our navy
  // chrome, and the name under the icon.
  appleWebApp: {
    capable: true,
    title: COMPANY.name,
    statusBarStyle: "black-translucent",
  },
  applicationName: COMPANY.name,
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Windows tile colour, for a site pinned to the Start menu.
  other: { "msapplication-TileColor": "#252839" },
};

/**
 * Navy address bar on Android and the installed title bar everywhere, and
 * viewport-fit=cover so a standalone iPhone window paints under the notch
 * instead of leaving a white band.
 */
export const viewport: Viewport = {
  themeColor: "#252839",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
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
        <ServiceWorker />
      </body>
    </html>
  );
}
