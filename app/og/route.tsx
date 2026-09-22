import { ImageResponse } from "next/og";
import { COMPANY, SEO } from "@/lib/data";

// Branded default OG card (referenced as SEO.ogImage). Property pages
// override it with their own photography via generateMetadata; this covers
// the homepage and every page without a listing image. Static — no
// request APIs — so it renders once at build and is served from there;
// without this line a GET handler re-drew the PNG on every request.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#14213D",
          color: "#FFFFFF",
        }}
      >
        <div style={{ width: 72, height: 2, background: "#C9992E", marginBottom: 48 }} />
        <div style={{ fontSize: 84, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {COMPANY.name}
        </div>
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "#F5D98B",
            marginTop: 20,
          }}
        >
          {COMPANY.tagline}
        </div>
        <div style={{ fontSize: 26, color: "#FFFFFFB3", marginTop: 56 }}>
          {SEO.description.split(".")[0]}
        </div>
        <div style={{ width: 72, height: 2, background: "#C9992E", marginTop: 48 }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
