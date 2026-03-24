import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isSyncLogPathSafe } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const filePath = typeof body?.filePath === "string" ? body.filePath : "";

  if (!filePath || !isSyncLogPathSafe(filePath) || !existsSync(filePath)) {
    return NextResponse.json({ error: "Invalid log file path." }, { status: 400 });
  }

  try {
    if (process.platform === "darwin") {
      await execFileAsync("open", ["-R", filePath]);
    } else if (process.platform === "win32") {
      await execFileAsync("explorer.exe", ["/select,", filePath]);
    } else {
      await execFileAsync("xdg-open", [path.dirname(filePath)]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reveal log file." },
      { status: 500 }
    );
  }
}
