import { NextResponse } from "next/server";
import { query } from "@/src/db/pool";

export const runtime = "nodejs";

export async function GET() {
  const [running, latest] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM sync_logs WHERE status = 'running'`),
    query<{ syncType: string; status: string; completedAt: string | null }>(
      `
      SELECT
        sync_type AS "syncType",
        status,
        completed_at::text AS "completedAt"
      FROM sync_logs
      ORDER BY started_at DESC
      LIMIT 1
      `
    )
  ]);

  return NextResponse.json({
    running: Number.parseInt(running.rows[0]?.count ?? "0", 10) > 0,
    latest: latest.rows[0] ?? null
  });
}
