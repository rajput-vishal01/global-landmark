import type { MetadataRoute } from "next";
import { COMPANY, SEO } from "@/lib/data";

/**
 * Web app manifest — what makes the site installable.
 *
 * `display: "standalone"` gives the installed app its own window with no
 * browser chrome on Android, Windows and macOS. iOS reads this too, but
 * only once the page also carries `apple-mobile-web-app-*` meta and an
 * apple-touch-icon; those are set in app/layout.tsx.
 *
 * Two icon entries at 512 on purpose: `any` is the plain square Windows and
 * macOS use, `maskable` is the padded one Android crops to a circle or
 * squircle. Shipping only the square makes Android clip the wordmark.
 *
 * `shortcuts` are the jump-list entries — right-click the installed icon on
 * Windows, or long-press on Android — so the two things a visitor actually
 * comes back for are one gesture away.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: COMPANY.legalName,
    short_name: COMPANY.name,
    description: SEO.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#252839",
    theme_color: "#252839",
    categories: ["business", "lifestyle", "shopping"],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Browse listings",
        short_name: "Listings",
        url: "/properties",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Market news",
        short_name: "News",
        url: "/news",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Contact us",
        short_name: "Contact",
        url: "/contact",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
