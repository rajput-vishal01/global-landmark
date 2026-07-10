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

export const metadata: Metadata = {
  title: "Global Landmark Realty Group",
  description:
    "The standard in global luxury real estate. Landmark residences, considered representation.",
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
