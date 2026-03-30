import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { getActiveSyncLaunchState, launchSyncJob } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const executablePath = chromium.executablePath();
  if (!executablePath || !existsSync(executablePath)) {
    return NextResponse.json(
      {
        started: false,
        message: "Chromium is not installed yet. Install it in setup before running the first full sync."
      },
      { status: 412 }
    );
  }

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

  const state = launchSyncJob("full");

  return NextResponse.json({
    started: true,
    message: "Full directory sync started. Complete LCR login in the Playwright browser if prompted.",
    job: state
  });
}
