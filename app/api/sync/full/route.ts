import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { query } from "@/src/db/pool";

export const runtime = "nodejs";

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

  const projectDir = process.cwd();
  const runDir = path.join(projectDir, ".run");
  await mkdir(runDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(runDir, `web-full-sync-${timestamp}.log`);

  const shell = process.platform === "win32" ? "cmd.exe" : "zsh";
  const args =
    process.platform === "win32"
      ? ["/c", `cd /d "${projectDir}" && npm run db:migrate && npm run sync:full >> "${logFile}" 2>&1`]
      : ["-lc", `cd "${projectDir}" && npm run db:migrate && npm run sync:full >> "${logFile}" 2>&1`];

  const child = spawn(shell, args, {
    cwd: projectDir,
    detached: true,
    stdio: "ignore"
  });
  child.unref();

  return NextResponse.json({
    started: true,
    message: "Directory sync started. Complete LCR login in the Playwright browser if prompted.",
    logFile
  });
}
