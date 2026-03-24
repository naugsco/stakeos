import { NextResponse } from "next/server";
import { query } from "@/src/db/pool";
import { getActiveSyncLaunchState, launchSyncJob } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const running = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM sync_logs WHERE status = 'running'`
  );

  if (Number.parseInt(running.rows[0]?.count ?? "0", 10) > 0) {
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

  const state = launchSyncJob("callings");

  return NextResponse.json({
    started: true,
    message: "Calling sync started.",
    job: state
  });
}
