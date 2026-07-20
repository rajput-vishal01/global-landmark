import { NextResponse } from "next/server";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

const CODE_RE = /^[A-Za-z0-9_-]{5,20}$/;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Proxies an Instagram post/reel poster image. Instagram's public
 * `/p/{code}/media/?size=l` endpoint 302s to a signed, expiring CDN URL —
 * resolving it server-side (and caching a day) keeps thumbnails stable and
 * keeps the expiring URLs off the client. 404 on any failure so the UI
 * falls back to its branded card.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  // Each miss makes an outbound fetch to Instagram — cap scripted hammering
  // (hits are served from the fetch cache, so the budget is generous).
  if (isRateLimited("ig-thumb", clientIp(req.headers), 200, 2000)) {
    return new NextResponse(null, { status: 429 });
  }
  const { code } = await params;
  if (!CODE_RE.test(code)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.instagram.com/p/${code}/media/?size=l`,
      {
        headers: { "User-Agent": UA },
        redirect: "follow",
        next: { revalidate: 86400 },
      }
    );
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("ig-thumb proxy failed:", err);
    return new NextResponse(null, { status: 404 });
  }
}
