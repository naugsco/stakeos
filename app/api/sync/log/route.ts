import { NextRequest, NextResponse } from "next/server";
import { resolveSyncLogFile, tailSyncLog } from "@/src/sync/syncControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const linesParam = request.nextUrl.searchParams.get("lines");
  const source = request.nextUrl.searchParams.get("source") === "sqlite" ? "sqlite" : "postgres";
  const maxLines = Number.isFinite(Number(linesParam)) ? Math.min(Math.max(Number(linesParam), 20), 400) : 160;
  const logFile = resolveSyncLogFile(source);

  if (!logFile) {
    return NextResponse.json({
      logFile: null,
      exists: false,
      tail: "",
      message: "No sync log is available yet."
    });
  }

  return NextResponse.json(tailSyncLog(logFile, maxLines));
}
