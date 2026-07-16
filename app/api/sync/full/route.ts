import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { getEffectiveDesktopEnv } from "@/src/config/desktopConfig";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { runSetupAction } from "@/src/setup/setupActions";
import { getActiveSyncLaunchState, launchSyncJob } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const desktopEnv = getEffectiveDesktopEnv();
  process.env.PLAYWRIGHT_BROWSERS_PATH = desktopEnv.PLAYWRIGHT_BROWSERS_PATH;
  process.env.PLAYWRIGHT_USER_DATA_DIR = desktopEnv.PLAYWRIGHT_USER_DATA_DIR;

  const { chromium } = await import("playwright");
  let executablePath = chromium.executablePath();
  if (!executablePath || !existsSync(executablePath)) {
    try {
      await runSetupAction("install_chromium");
    } catch (error) {
      // Surface the real reason as JSON; an uncaught throw here returns an HTML error page
      // that the client cannot parse, leaving the button with no visible explanation.
      return NextResponse.json(
        {
          started: false,
          message: `Chromium could not be installed automatically: ${
            error instanceof Error ? error.message : "Unknown error."
          }`
        },
        { status: 412 }
      );
    }

    process.env.PLAYWRIGHT_BROWSERS_PATH = desktopEnv.PLAYWRIGHT_BROWSERS_PATH;
    process.env.PLAYWRIGHT_USER_DATA_DIR = desktopEnv.PLAYWRIGHT_USER_DATA_DIR;
    executablePath = chromium.executablePath();

    if (!executablePath || !existsSync(executablePath)) {
      return NextResponse.json(
        {
          started: false,
          message: "Chromium could not be installed automatically. Install it in setup and try again."
        },
        { status: 412 }
      );
    }
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

  let state;
  try {
    state = launchSyncJob("full");
  } catch (error) {
    return NextResponse.json(
      { started: false, message: error instanceof Error ? error.message : "Unable to start the full sync." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    started: true,
    message: "Full directory sync started. Complete LCR login in the Playwright browser if prompted.",
    job: state
  });
}
