import type { Metadata } from "next";
import { Prata, Manrope } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollReveals } from "@/components/ScrollReveals";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const OG_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Global Landmark Realty Group | Luxury Real Estate",
    template: "%s | Global Landmark Realty Group",
  },
  description:
    "The standard in global luxury real estate. Landmark residences, considered representation, over $2.4B in sales.",
  openGraph: {
    type: "website",
    siteName: "Global Landmark Realty Group",
    title: "Global Landmark Realty Group | Luxury Real Estate",
    description:
      "The standard in global luxury real estate. Landmark residences, considered representation.",
    url: SITE_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Landmark Realty Group | Luxury Real Estate",
    description:
      "The standard in global luxury real estate. Landmark residences, considered representation.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${prata.variable} ${manrope.variable}`}>
      <body className="bg-cream font-sans text-ink antialiased">
        <SmoothScroll />
        <ScrollReveals />
        {children}
      </body>
    </html>
  );
}
