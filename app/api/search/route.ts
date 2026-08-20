import { NextResponse } from "next/server";
import { searchProperties, searchProjects } from "@/lib/db/queries";
import { categoryLabel } from "@/lib/categories";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export async function GET(request: Request) {
  // Each query runs several ILIKE scans — cap scripted hammering.
  if (isRateLimited("search", clientIp(request.headers), 300, 3000)) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }
  const [properties, projects] = await Promise.all([searchProperties(q), searchProjects(q)]);
  return NextResponse.json({
    results: [
      ...properties.map((p) => ({
        type: "property" as const,
        slug: p.slug,
        title: p.title,
        location: p.location,
        category: categoryLabel(p.category),
        // 64px thumbnail — don't make the optimizer pull the full original.
        image: p.images[0] ? p.images[0].url : null,
      })),
      ...projects.map((p) => ({
        type: "project" as const,
        slug: p.slug,
        title: p.name,
        location: [p.locality, p.sector, p.city].filter(Boolean).join(", "),
        category: "Project",
        image: p.coverImage,
      })),
    ],
  });
}
