import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// script-src needs 'unsafe-inline' for Next's hydration bootstrap; img-src
// stays broad because news thumbnails come from arbitrary publisher hosts.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  // openstreetmap.org is the property-page map embed (Phase E) — a plain
  // iframe, no map library. Without this entry the frame renders blank.
  // google.com is the footer office-map preview (display only; the link
  // over it opens Google Maps in a new tab). 'self' is the admin's document
  // preview, which frames a PDF from /api/admin/documents.
  "frame-src 'self' https://www.youtube-nocookie.com https://www.instagram.com https://www.openstreetmap.org https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  images: {
    // Only hosts we actually serve property/site imagery from. A wildcard
    // here would let anyone use /_next/image as an SSRF proxy to any HTTPS
    // host. Admin-pasted images from other hosts need their host added.
    //
    // Uploaded images are served same-origin from /api/images/<sha256> and
    // need no entry at all. Unsplash is only here for the remaining stock
    // photography and goes when the client's own images land.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],

    // Every image is served exactly as uploaded (Sep 2026, the client’s
    // call): no resizing, no AVIF/WebP re-encode, 100% of the uploaded
    // quality. The photographs are the product, and the optimiser’s copies
    // were visibly softer than the files the broker uploaded. The cost is
    // weight — upload photos at the size they should be seen (around 2500px
    // on the long edge is plenty), not straight off a 50MP camera.
    unoptimized: true,
  },
  // Builder and area pages were removed (Sep 2026). Anything still linking
  // to them lands on the listings instead of a 404.
  async redirects() {
    return [
      { source: "/areas", destination: "/properties", permanent: true },
      { source: "/areas/:slug", destination: "/properties", permanent: true },
      { source: "/builders/:slug", destination: "/properties", permanent: true },
    ];
  },
  async headers() {
    return [
      // Every page but the admin document route gets the site CSP. That route
      // serves a PDF into the preview frame, and Chrome draws a PDF with a
      // plugin that the site's object-src 'none' would block — the preview
      // would render blank. It is admin-gated, same-origin, and sends nosniff;
      // it keeps frame-ancestors so only this site can frame it.
      {
        source: "/((?!api/admin/documents/).*)",
        headers: [{ key: "Content-Security-Policy", value: CSP }],
      },
      {
        source: "/api/admin/documents/:key",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
