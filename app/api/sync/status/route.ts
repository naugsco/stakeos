import { NextResponse } from "next/server";
import { query } from "@/src/db/pool";
import { clearSyncLaunchState, getActiveSyncLaunchState, readSyncLaunchState } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [running, latest] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM sync_logs WHERE status = 'running'`),
    query<{
      id: string;
      syncType: string;
      status: string;
      startedAt: string;
      completedAt: string | null;
      errorMessage: string | null;
      recordsProcessed: number;
    }>(
      `
      SELECT
        id::text AS id,
        sync_type AS "syncType",
        status,
        started_at::text AS "startedAt",
        completed_at::text AS "completedAt",
        error_message AS "errorMessage",
        records_processed AS "recordsProcessed"
      FROM sync_logs
      ORDER BY started_at DESC
      LIMIT 1
      `
    )
  ]);

  const databaseRunning = Number.parseInt(running.rows[0]?.count ?? "0", 10) > 0;
  const activeLaunch = getActiveSyncLaunchState();
  const staleLaunch = !activeLaunch ? readSyncLaunchState() : null;

  if (!databaseRunning && staleLaunch) {
    clearSyncLaunchState();
  }

  return NextResponse.json({
    running: databaseRunning || Boolean(activeLaunch),
    phase: databaseRunning ? "running" : activeLaunch ? "launching" : "idle",
    activeJob: activeLaunch,
    latest: latest.rows[0] ?? null
  });
}
