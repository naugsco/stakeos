import { NextResponse } from "next/server";
import {
  getDesktopConfigSnapshot,
  importProjectEnvIntoDesktopConfig,
  loadDesktopConfig,
  saveDesktopConfig,
  type DesktopConfig
} from "@/src/config/desktopConfig";

const configKeys = [
  "LCR_DIRECTORY_URL",
  "PLAYWRIGHT_USER_DATA_DIR",
  "PLAYWRIGHT_HEADLESS",
  "STAKE_NAME",
  "UNIT_NUMBER",
  "STAKE_PRESIDENCY_EMAILS",
  "STAKE_COUNCIL_EMAILS",
  "HIGH_COUNCIL_EMAILS",
  "HIGH_COUNCIL_UNIT_ASSIGNMENTS",
  "STAKE_RELIEF_SOCIETY_EMAILS",
  "STAKE_YOUNG_WOMEN_EMAILS",
  "STAKE_PRIMARY_EMAILS",
  "STAKE_SUNDAY_SCHOOL_EMAILS",
  "RECIPIENTS_ALL_CALLINGS",
  "RECIPIENTS_ALL_BISHOPS",
  "RECIPIENTS_ALL_BISHOPRICS",
  "RECIPIENTS_ALL_CLERKS",
  "RECIPIENTS_ALL_EXECUTIVE_SECRETARIES",
  "RECIPIENTS_ALL_ORGANIZATION_PRESIDENCIES",
  "RECIPIENTS_ALL_ELDERS_QUORUM_PRESIDENCIES",
  "RECIPIENTS_ALL_RELIEF_SOCIETY_PRESIDENCIES",
  "RECIPIENTS_ALL_YOUNG_WOMEN_PRESIDENCIES",
  "RECIPIENTS_ALL_SUNDAY_SCHOOL_PRESIDENCIES",
  "RECIPIENTS_ALL_PRIMARY_PRESIDENCIES",
  "RECIPIENTS_ALL_WARD_MISSION_LEADERS",
  "RECIPIENTS_ALL_WARD_COUNCILS",
  "RECIPIENTS_ALL_WARD_YSA_LEADERS",
  "RECIPIENTS_ALL_TEMPLE_FAMILY_HISTORY_LEADERS",
  "RECIPIENTS_ALL_MEMBERS",
  "RECIPIENTS_ALL_ADULT_MEMBERS",
  "RECIPIENTS_ALL_MEN",
  "RECIPIENTS_ALL_WOMEN",
  "RECIPIENTS_ALL_MELCHIZEDEK_PRIESTHOOD_HOLDERS",
  "RECIPIENTS_SINGLE_ADULTS",
  "RECIPIENTS_YOUNG_SINGLE_ADULTS",
  "RECIPIENTS_YOUNG_MEN",
  "RECIPIENTS_YOUNG_WOMEN",
  "RECIPIENTS_PARENTS_OF_YOUNG_MEN",
  "RECIPIENTS_PARENTS_OF_YOUNG_WOMEN",
  "RECIPIENTS_PARENTS_OF_PRIMARY_CHILDREN",
  "RECIPIENTS_FULL_TIME_MISSIONARIES"
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

  saveDesktopConfig({
    ...loadDesktopConfig(),
    ...nextConfig
  });

  return NextResponse.json({
    ...(await getDesktopConfigSnapshot()),
    requiresRestart: true
  });
}
