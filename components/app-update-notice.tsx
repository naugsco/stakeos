"use client";

import { useEffect, useState } from "react";

type AppUpdatePayload = {
  ok: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  releaseUrl?: string | null;
  publishedAt?: string | null;
};

const STORAGE_KEY = "stakeos-app-update-check";
const DAY_MS = 24 * 60 * 60 * 1000;

export function AppUpdateNotice() {
  const [payload, setPayload] = useState<AppUpdatePayload | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { checkedAt: number; payload: AppUpdatePayload };
        if (Date.now() - cached.checkedAt < DAY_MS) {
          setPayload(cached.payload);
          return;
        }
      } catch {
        // ignore malformed cache
      }
    }

    void (async () => {
      try {
        const response = await fetch("/api/app-update", { cache: "no-store" });
        const nextPayload = (await response.json()) as AppUpdatePayload;
        setPayload(nextPayload);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            checkedAt: Date.now(),
            payload: nextPayload
          })
        );
      } catch {
        // ignore update-check failure
      }
    })();
  }, []);

  if (!payload?.updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="border-b border-amber-300/60 bg-amber-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 text-sm text-amber-950">
        <div>
          <span className="font-semibold">Update available.</span>{" "}
          StakeOS {payload.latestVersion} is published on GitHub. You are running {payload.currentVersion}.
        </div>
        <div className="flex items-center gap-3">
          {payload.releaseUrl ? (
            <a
              href={payload.releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-amber-900/10 bg-white px-3 py-1.5 font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              View Release
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-full border border-transparent px-3 py-1.5 font-medium text-slate-600 transition hover:bg-white/70"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
