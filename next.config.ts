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
  "frame-src https://www.youtube-nocookie.com https://www.instagram.com https://www.openstreetmap.org",
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

    // Next 16 changed the default for this from "any quality" to [75], so a
    // `quality` prop outside this list is rejected at request time. Property
    // photography is the product here — a buyer decides whether to visit off
    // these images — so the gallery is served at 95 and cards at 90, and 75
    // stays listed because unrelated imagery still uses the default.
    qualities: [75, 90, 95],

    // AVIF first, WebP as the fallback. AVIF carries noticeably more detail
    // per byte at these quality levels, which is what makes 95 affordable;
    // browsers that cannot take it are served the WebP.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
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
