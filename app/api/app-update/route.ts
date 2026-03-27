import { NextResponse } from "next/server";
import { getCurrentAppVersion, isVersionNewer } from "@/src/appUpdate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_OWNER = "naugsco";
const REPO_NAME = "stakeos";

export async function GET() {
  const currentVersion = getCurrentAppVersion();

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "StakeOS-Desktop"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        currentVersion,
        updateAvailable: false,
        message: "Unable to check for updates right now."
      });
    }

    const payload = await response.json();
    const latestVersion = `${payload.tag_name || payload.name || ""}`.trim().replace(/^v/i, "");
    const releaseUrl = typeof payload.html_url === "string" ? payload.html_url : null;
    const publishedAt = typeof payload.published_at === "string" ? payload.published_at : null;
    const updateAvailable = latestVersion ? isVersionNewer(latestVersion, currentVersion) : false;

    return NextResponse.json({
      ok: true,
      currentVersion,
      latestVersion,
      updateAvailable,
      releaseUrl,
      publishedAt
    });
  } catch {
    return NextResponse.json({
      ok: false,
      currentVersion,
      updateAvailable: false,
      message: "Unable to check for updates right now."
    });
  }
}
