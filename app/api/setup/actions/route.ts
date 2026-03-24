import { NextResponse } from "next/server";
import { getDesktopConfigSnapshot } from "@/src/config/desktopConfig";
import { runSetupAction, type SetupActionKey } from "@/src/setup/setupActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supportedActions = new Set<SetupActionKey>(["create_database", "run_db_migrate", "install_chromium"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? (body.action as SetupActionKey) : null;

  if (!action || !supportedActions.has(action)) {
    return NextResponse.json({ error: "Unsupported setup action." }, { status: 400 });
  }

  try {
    const snapshot = await getDesktopConfigSnapshot();
    const result = await runSetupAction(action, snapshot.effectiveConfig.DATABASE_URL);

    return NextResponse.json({
      ok: true,
      action,
      result,
      snapshot: await getDesktopConfigSnapshot()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        action,
        error: error instanceof Error ? error.message : "Setup action failed."
      },
      { status: 500 }
    );
  }
}
