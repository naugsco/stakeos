import { NextRequest, NextResponse } from "next/server";
import { query } from "@/src/db/pool";
import { openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import { getActiveSyncLaunchState, launchSyncJob } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getSource = (request: NextRequest) =>
  request.nextUrl.searchParams.get("source") === "sqlite" ? "sqlite" : "postgres";

export async function POST(request: NextRequest) {
  const source = getSource(request);
  let runningCount = 0;

  if (source === "sqlite") {
    const db = openSqliteSpikeDb();
    try {
      const row = db
        .prepare(`SELECT COUNT(*) AS count FROM sync_logs WHERE status = 'running'`)
        .get() as { count: number };
      runningCount = row.count;
    } finally {
      db.close();
    }
  } else {
    const running = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM sync_logs WHERE status = 'running'`
    );
    runningCount = Number.parseInt(running.rows[0]?.count ?? "0", 10);
  }

  if (runningCount > 0) {
    return NextResponse.json(
      { started: false, message: "A sync is already running." },
      { status: 409 }
    );
  }

  const activeJob = getActiveSyncLaunchState(source);
  if (activeJob) {
    return NextResponse.json(
      { started: false, message: "A sync launcher is already active.", activeJob },
      { status: 409 }
    );
  }

  const state = launchSyncJob("full", source);

  return NextResponse.json({
    started: true,
    message: "Full directory sync started. Complete LCR login in the Playwright browser if prompted.",
    job: state
  });
}
