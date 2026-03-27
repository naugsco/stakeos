import { NextResponse } from "next/server";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { clearSyncLaunchState, getActiveSyncLaunchState, readSyncLaunchState } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let databaseRunning = false;
  let latest: {
    id: string;
    syncType: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    errorMessage: string | null;
    recordsProcessed: number;
  } | null = null;

  const db = openSqliteSpikeDb();
  try {
    const running = db.prepare(`SELECT COUNT(*) AS count FROM sync_logs WHERE status = 'running'`).get() as { count: number };
    const latestRow = db.prepare(
      `
      SELECT
        CAST(id AS TEXT) AS id,
        sync_type AS syncType,
        status,
        started_at AS startedAt,
        completed_at AS completedAt,
        error_message AS errorMessage,
        COALESCE(records_processed, 0) AS recordsProcessed
      FROM sync_logs
      ORDER BY started_at DESC
      LIMIT 1
      `
    ).get() as typeof latest | undefined;
    databaseRunning = running.count > 0;
    latest = latestRow ?? null;
  } finally {
    db.close();
  }

  const activeLaunch = getActiveSyncLaunchState();
  const staleLaunch = !activeLaunch ? readSyncLaunchState() : null;

  if (!databaseRunning && staleLaunch) {
    clearSyncLaunchState();
  }

  return NextResponse.json({
    running: databaseRunning || Boolean(activeLaunch),
    phase: databaseRunning ? "running" : activeLaunch ? "launching" : "idle",
    activeJob: activeLaunch,
    latest
  });
}
