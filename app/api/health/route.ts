import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Keep-alive + uptime endpoint. Point an external pinger (cron-job.org,
 * UptimeRobot) at this every ~4 minutes to stop Neon's free tier from
 * suspending, and to get alerted when the site is actually down.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("health check failed:", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
