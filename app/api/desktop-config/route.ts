import { NextResponse } from "next/server";
import {
  getDesktopConfigSnapshot,
  importProjectEnvIntoDesktopConfig,
  saveDesktopConfig,
  type DesktopConfig
} from "@/src/config/desktopConfig";

const configKeys = [
  "DATABASE_URL",
  "LCR_DIRECTORY_URL",
  "PLAYWRIGHT_USER_DATA_DIR",
  "PLAYWRIGHT_HEADLESS",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "STAKE_NAME",
  "UNIT_NUMBER",
  "STAKE_PRESIDENCY_EMAILS",
  "STAKE_COUNCIL_EMAILS"
] as const;

export async function GET() {
  return NextResponse.json(await getDesktopConfigSnapshot());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "import_env") {
    importProjectEnvIntoDesktopConfig();
    return NextResponse.json({
      ...(await getDesktopConfigSnapshot()),
      requiresRestart: true,
      importedFromEnv: true
    });
  }

  if (!("config" in body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const incoming = body.config as Record<string, unknown>;
  const nextConfig = Object.fromEntries(
    configKeys.map((key) => [key, typeof incoming[key] === "string" ? incoming[key] : ""])
  ) as DesktopConfig;

  saveDesktopConfig(nextConfig);

  return NextResponse.json({
    ...(await getDesktopConfigSnapshot()),
    requiresRestart: true
  });
}
