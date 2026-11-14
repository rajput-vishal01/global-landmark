
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { ServiceWorker } from "@/components/ServiceWorker";
import { InstallPrompt } from "@/components/InstallPrompt";
import { COMPANY, SEO } from "@/lib/data";
import { jsonLdHtml, OG_DEFAULTS, organizationJsonLd, SITE_URL } from "@/lib/seo";

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

  // Google Search Console verification
  verification: {
    google: "TgBlmtYHv8876IHhvrfVrmqJnnNRgFT2Zj-fcG8DlXY",
  },

  // No canonical here: every page states its own. A root one was inherited
  // by each page that did not — /offline, the soft-404s, the admin — and
  // named the home page as their canonical.
  title: {
    default: SEO.title,
    // The short name: "| Global Landmark Realty Group" ate 31 of the ~60
    // characters a results page shows. The full legal name stays in the
    // default title, og:site_name and the JSON-LD.
    template: `%s | ${COMPANY.name}`,
  },
  description: SEO.description,
  openGraph: {
    ...OG_DEFAULTS,
    type: "website",
    title: SEO.title,
    description: SEO.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.description,
    images: [SEO.ogImage],
  },
  // No robots default: "index, follow" is what a crawler assumes anyway, and
  // a root one was printed beside Next's own "noindex" on every 404.
  // iOS reads almost none of the web app manifest. These are what make an
  // installed icon on an iPhone look like an app rather than a bookmark:
  // the touch icon, standalone display, a status bar, and the name under
  // the icon.
  //
  // "default", not "black-translucent": translucent lets the page paint
  // under the status bar, which only works if every fixed element carries
  // env(safe-area-inset-top) padding. Nothing here does, so the site
  // header and the panel's top bar would open under the clock. iOS
  // reserving the strip is the correct-looking failure, not the broken one.
  appleWebApp: {
    capable: true,
    title: COMPANY.name,
    statusBarStyle: "default",
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
 * Navy address bar on Android and the installed title bar everywhere.
 *
 * No viewport-fit=cover: it goes with the translucent status bar above,
 * and both are only safe once the fixed chrome handles safe-area insets.
 */
export const viewport: Viewport = {
  themeColor: "#252839",
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
      lang="en-IN"
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

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-ZYZNK58P01"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZYZNK58P01');
            `,
          }}
        />

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-TR33KWDD');
            `,
          }}
        />
      </head>

      <body className="bg-cream font-sans text-ink antialiased">

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TR33KWDD"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(orgJsonLd) }}
        />

        <MotionProvider>
          {children}

          {/* Root layout, not the site group: the panel is where installing
              actually pays off, so admins get the offer too. */}
          <InstallPrompt />
        </MotionProvider>

        <ServiceWorker />
      </body>
    </html>
  );
}
