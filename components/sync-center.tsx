"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SyncStatusPayload = {
  running: boolean;
  phase: "idle" | "launching" | "running";
  activeJob: {
    kind: "full" | "callings";
    pid: number;
    logFile: string;
    startedAt: string;
  } | null;
  latest: {
    id: string;
    syncType: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    errorMessage: string | null;
    recordsProcessed: number;
  } | null;
  latestSuccessfulFullSyncSummary: {
    completedAt: string | null;
    membersImported: number;
    unitsFound: number;
    callingsImported: number;
  } | null;
};

type SyncLogPayload = {
  logFile: string | null;
  exists: boolean;
  tail: string;
  message?: string;
};

const cardClassName =
  "rounded-[28px] border border-amber-900/10 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

const formatSyncType = (value: string) => {
  switch (value) {
    case "sqlite_full_sync":
    case "sqlite_spike_full_sync":
    case "nightly_full_directory_sync":
      return "Full Directory Sync";
    case "sqlite_calling_sync":
    case "sqlite_spike_calling_sync":
    case "hourly_calling_sync":
      return "Calling Sync";
    case "sqlite_baseline_seed":
    case "sqlite_spike_baseline_seed":
      return "Baseline Seed";
    default:
      return value;
  }
};

export function SyncCenter() {
  const [status, setStatus] = useState<SyncStatusPayload | null>(null);
  const [log, setLog] = useState<SyncLogPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"full" | "callings" | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logAction, setLogAction] = useState<"open" | "reveal" | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const logRef = useRef<HTMLPreElement | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/sync/status", { cache: "no-store" });
    const payload = (await response.json()) as SyncStatusPayload;
    setStatus(payload);
  }, []);

  const loadLog = useCallback(async () => {
    const response = await fetch("/api/sync/log?lines=160", { cache: "no-store" });
    const payload = (await response.json()) as SyncLogPayload;
    setLog(payload);
  }, []);

  useEffect(() => {
    void Promise.all([loadStatus(), loadLog()]);
    const interval = window.setInterval(() => {
      void Promise.all([loadStatus(), loadLog()]);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [loadLog, loadStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!autoScroll || !logRef.current) {
      return;
    }

    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [autoScroll, log?.tail]);

  const runSync = async (kind: "full" | "callings") => {
    setAction(kind);
    setError(null);
    setMessage(null);

    try {
      const endpoint = kind === "full" ? "/api/sync/full" : "/api/sync/callings";
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to start sync.");
      }

      setMessage(payload.message || "Sync started.");
      await Promise.all([loadStatus(), loadLog()]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start sync.");
    } finally {
      setAction(null);
    }
  };

  const phaseLabel = useMemo(() => {
    if (!status) {
      return "Loading";
    }

    if (status.phase === "launching") {
      return "Launching";
    }

    if (status.phase === "running") {
      return "Running";
    }

    return "Idle";
  }, [status]);

  const elapsedLabel = useMemo(() => {
    const startedAt = status?.activeJob?.startedAt;
    if (!startedAt) {
      return "—";
    }

    const startedMs = new Date(startedAt).getTime();
    const diffMs = Math.max(nowMs - startedMs, 0);
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 59) {
      const hours = Math.floor(minutes / 60);
      const remMinutes = minutes % 60;
      return `${hours}h ${remMinutes}m`;
    }

    return `${minutes}m ${seconds}s`;
  }, [nowMs, status?.activeJob?.startedAt]);

  const runStateDescription = useMemo(() => {
    if (!status) {
      return "Loading sync state.";
    }

    if (status.phase === "launching") {
      return "StakeOS has launched the sync process and is waiting for the database sync log to begin.";
    }

    if (status.phase === "running") {
      return "A sync is actively processing data. The live log below will update automatically.";
    }

    return "No sync is running right now.";
  }, [status]);

  const openLogAction = async (kind: "open" | "reveal") => {
    if (!log?.logFile) {
      return;
    }

    setLogAction(kind);
    setError(null);

    try {
      const response = await fetch(`/api/sync/log/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: log.logFile })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || `Unable to ${kind} log file.`);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to open log file.");
    } finally {
      setLogAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-amber-900/10 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Desktop Operations</p>
        <h1 className="mt-3 font-serif text-4xl text-slate-900">Sync Center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Run LCR sync jobs from the desktop app and monitor progress without leaving StakeOS. Full sync refreshes the local directory store and reseeds exact snapshot diffs. Calling sync updates callings only.
        </p>
        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className={cardClassName}>
            <h2 className="font-serif text-2xl text-slate-900">Run Sync</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start one sync at a time. StakeOS will block duplicate launches while a sync is starting or running.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runSync("full")}
                disabled={Boolean(status?.running) || action !== null}
                className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action === "full" ? "Starting Full Sync..." : "Run Full Sync"}
              </button>
              <button
                type="button"
                onClick={() => runSync("callings")}
                disabled={Boolean(status?.running) || action !== null}
                className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action === "callings" ? "Starting Calling Sync..." : "Run Calling Sync"}
              </button>
            </div>
          </div>

          <div className={cardClassName}>
            <h2 className="font-serif text-2xl text-slate-900">Current Status</h2>
            <p className="mt-2 text-sm text-slate-600">{runStateDescription}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phase</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{phaseLabel}</div>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Sync</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {status?.activeJob
                    ? status.activeJob.kind === "full"
                      ? "Full Directory"
                      : "Calling Only"
                    : "None"}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Launcher PID</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{status?.activeJob?.pid ?? "—"}</div>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Elapsed</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{elapsedLabel}</div>
              </div>
            </div>
            {status?.activeJob ? (
              <div className="mt-4 rounded-2xl border border-amber-900/10 bg-white px-4 py-3 text-sm text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">Started:</span> {new Date(status.activeJob.startedAt).toLocaleString()}
                </div>
                <div className="mt-1 break-all">
                  <span className="font-semibold text-slate-900">Log:</span> {status.activeJob.logFile}
                </div>
              </div>
            ) : null}
          </div>

          <div className={cardClassName}>
            <h2 className="font-serif text-2xl text-slate-900">Latest Completed Sync</h2>
            {status?.latest ? (
              <div className="mt-6 space-y-2 text-sm text-slate-700">
                <div><span className="font-semibold text-slate-900">Type:</span> {formatSyncType(status.latest.syncType)}</div>
                <div><span className="font-semibold text-slate-900">Status:</span> {status.latest.status}</div>
                <div><span className="font-semibold text-slate-900">Started:</span> {new Date(status.latest.startedAt).toLocaleString()}</div>
                <div><span className="font-semibold text-slate-900">Completed:</span> {status.latest.completedAt ? new Date(status.latest.completedAt).toLocaleString() : "—"}</div>
                <div><span className="font-semibold text-slate-900">Records:</span> {status.latest.recordsProcessed}</div>
                {status.latest.errorMessage ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{status.latest.errorMessage}</div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">No sync has been recorded yet.</p>
            )}
          </div>

          <div className={cardClassName}>
            <h2 className="font-serif text-2xl text-slate-900">Latest Full Sync Summary</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use this as the post-sync confirmation screen. It shows the current local import footprint after the latest successful full sync.
            </p>
            {status?.latestSuccessfulFullSyncSummary ? (
              <>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members Imported</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{status.latestSuccessfulFullSyncSummary.membersImported}</div>
                  </div>
                  <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units Found</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{status.latestSuccessfulFullSyncSummary.unitsFound}</div>
                  </div>
                  <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Callings Imported</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{status.latestSuccessfulFullSyncSummary.callingsImported}</div>
                  </div>
                  <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Sync Time</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">
                      {status.latestSuccessfulFullSyncSummary.completedAt
                        ? new Date(status.latestSuccessfulFullSyncSummary.completedAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Full sync completed and local SQLite data is ready for the dashboard, reports, and MCP tools.
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-4 text-sm text-slate-600">
                No successful full sync has been recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className={cardClassName}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-slate-900">Live Sync Log</h2>
              <p className="mt-2 text-sm text-slate-600">
                The newest sync log is shown here. It refreshes automatically while the page is open.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoScroll((current) => !current)}
                className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {autoScroll ? "Pause Auto-Scroll" : "Resume Auto-Scroll"}
              </button>
              <button
                type="button"
                onClick={() => void loadLog()}
                className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Refresh Log
              </button>
              <button
                type="button"
                onClick={() => void openLogAction("open")}
                disabled={!log?.logFile || logAction !== null}
                className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logAction === "open" ? "Opening..." : "Open Log File"}
              </button>
              <button
                type="button"
                onClick={() => void openLogAction("reveal")}
                disabled={!log?.logFile || logAction !== null}
                className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logAction === "reveal" ? "Revealing..." : "Reveal In Finder"}
              </button>
            </div>
          </div>
          <div className="mt-6 rounded-[24px] border border-slate-900/10 bg-slate-950 p-4 shadow-inner">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {log?.logFile ? log.logFile : "No log selected"}
            </div>
            <pre
              ref={logRef}
              className="max-h-[38rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 text-xs leading-6 text-slate-100"
            >
              {log?.exists ? log.tail || "Log is empty so far." : log?.message || "No sync log available yet."}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
