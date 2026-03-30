import { NextResponse } from "next/server";
import { ensureSqliteSpikeSchema, openSqliteSpikeDb } from "@/src/sqlite/db";
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
  let latestSuccessfulFullSyncSummary: {
    completedAt: string | null;
    membersImported: number;
    unitsFound: number;
    callingsImported: number;
  } | null = null;

  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);

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

    const latestSuccessfulFullSync = db.prepare(
      `
      SELECT
        CAST(id AS TEXT) AS id,
        completed_at AS completedAt
      FROM sync_logs
      WHERE status = 'success'
        AND sync_type IN ('sqlite_full_sync', 'sqlite_spike_full_sync')
      ORDER BY completed_at DESC, id DESC
      LIMIT 1
      `
    ).get() as { id?: string; completedAt?: string | null } | undefined;

    if (latestSuccessfulFullSync?.id) {
      const membersImported = db.prepare(`SELECT COUNT(*) AS count FROM members`).get() as { count: number };
      const unitsFound = db.prepare(
        `SELECT COUNT(DISTINCT COALESCE(NULLIF(unit_name, ''), unit_abbreviation, unit_number)) AS count FROM members`
      ).get() as { count: number };
      const callingsImported = db.prepare(
        `SELECT COUNT(*) AS count FROM callings WHERE released_on IS NULL AND is_current = 1`
      ).get() as { count: number };

      latestSuccessfulFullSyncSummary = {
        completedAt: latestSuccessfulFullSync.completedAt ?? null,
        membersImported: membersImported.count,
        unitsFound: unitsFound.count,
        callingsImported: callingsImported.count
      };
    }

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
    latest,
    latestSuccessfulFullSyncSummary
  });
}
