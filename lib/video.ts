export type VideoProvider = "youtube" | "instagram";
export type ParsedVideo = { provider: VideoProvider; videoId: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const IG_CODE = /^[A-Za-z0-9_-]{5,20}$/;

/**
 * Accepts a YouTube link/ID or an Instagram post/reel link and returns a
 * normalized {provider, videoId}. Instagram videoId is the post shortcode.
 */
export function parseVideo(input: string): ParsedVideo | null {
  const s = input.trim();
  if (YT_ID.test(s)) return { provider: "youtube", videoId: s };

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1] ?? "";
    return YT_ID.test(id) ? { provider: "youtube", videoId: id } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return { provider: "youtube", videoId: v };
    const m = url.pathname.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
    return m ? { provider: "youtube", videoId: m[1] } : null;
  }
  if (host === "instagram.com" || host === "instagr.am") {
    const m = url.pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    return m && IG_CODE.test(m[1]) ? { provider: "instagram", videoId: m[1] } : null;
  }
  return null;
}

export function videoEmbed(provider: VideoProvider, id: string): string {
  return provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://www.instagram.com/reel/${id}/embed/`;
}

/**
 * Thumbnail URL. YouTube serves one directly; Instagram's poster is proxied
 * through our own route (it 302s to a signed, expiring CDN URL). The proxy
 * 404s when IG refuses, so callers should fall back to a placeholder on error.
 */
export function videoThumb(provider: VideoProvider, id: string): string {
  return provider === "youtube"
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : `/api/ig-thumb/${id}`;
}
