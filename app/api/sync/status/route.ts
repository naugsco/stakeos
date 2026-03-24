import { NextRequest, NextResponse } from "next/server";
import { query } from "@/src/db/pool";
import { openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import { clearSyncLaunchState, getActiveSyncLaunchState, readSyncLaunchState } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getSource = (request: NextRequest) =>
  request.nextUrl.searchParams.get("source") === "sqlite" ? "sqlite" : "postgres";

export async function GET(request: NextRequest) {
  const source = getSource(request);

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

  if (source === "sqlite") {
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
  } else {
    const [running, latestResult] = await Promise.all([
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
    databaseRunning = Number.parseInt(running.rows[0]?.count ?? "0", 10) > 0;
    latest = latestResult.rows[0] ?? null;
  }

  const activeLaunch = getActiveSyncLaunchState(source);
  const staleLaunch = !activeLaunch ? readSyncLaunchState(source) : null;

  if (!databaseRunning && staleLaunch) {
    clearSyncLaunchState(source);
  }

  return NextResponse.json({
    running: databaseRunning || Boolean(activeLaunch),
    phase: databaseRunning ? "running" : activeLaunch ? "launching" : "idle",
    activeJob: activeLaunch,
    latest
  });
}
