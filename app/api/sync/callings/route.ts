import { NextResponse } from "next/server";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { getActiveSyncLaunchState, launchSyncJob } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  let runningCount = 0;

  const db = openSqliteSpikeDb();
  try {
    const row = db
      .prepare(`SELECT COUNT(*) AS count FROM sync_logs WHERE status = 'running'`)
      .get() as { count: number };
    runningCount = row.count;
  } finally {
    db.close();
  }

  if (runningCount > 0) {
    return NextResponse.json(
      { started: false, message: "A sync is already running." },
      { status: 409 }
    );
  }

  const activeJob = getActiveSyncLaunchState();
  if (activeJob) {
    return NextResponse.json(
      { started: false, message: "A sync launcher is already active.", activeJob },
      { status: 409 }
    );
  }

  let state;
  try {
    state = launchSyncJob("callings");
  } catch (error) {
    return NextResponse.json(
      { started: false, message: error instanceof Error ? error.message : "Unable to start the calling sync." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    started: true,
    message: "Calling sync started.",
    job: state
  });
}
