import { NextResponse } from "next/server";

const controlPort = process.env.STAKEOS_CONTROL_PORT || "3233";
const controlBaseUrl = `http://127.0.0.1:${controlPort}`;

async function requestDesktopShell(path: string, init?: RequestInit) {
  try {
    const response = await fetch(`${controlBaseUrl}${path}`, {
      ...init,
      cache: "no-store"
    });

    const bodyText = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      bodyText
    };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      bodyText: JSON.stringify({
        ok: false,
        available: false,
        error: error instanceof Error ? error.message : "Desktop shell is unavailable."
      })
    };
  }
}

export async function GET() {
  const result = await requestDesktopShell("/status");
  return new NextResponse(result.bodyText, {
    status: result.status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";
  const route = typeof body?.route === "string" ? body.route : undefined;

  if (action !== "restart") {
    return NextResponse.json({ error: "Unsupported desktop action." }, { status: 400 });
  }

  const result = await requestDesktopShell("/restart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, route })
  });

  return new NextResponse(result.bodyText, {
    status: result.status,
    headers: { "Content-Type": "application/json" }
  });
}
