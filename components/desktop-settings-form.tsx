"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DiagnosticActionKey = "initialize_local_store" | "install_chromium" | "configure_mcp";

type DiagnosticCheck = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail" | "info";
  summary: string;
  detail?: string;
  action?: string;
  actionKey?: DiagnosticActionKey;
  actionLabel?: string;
};

type ConfigSnapshot = {
  configPath: string;
  configExists: boolean;
  effectiveConfig: Record<string, string>;
  status: {
    requiredComplete: boolean;
    missing: string[];
    database: { ok: boolean; message: string; exists: boolean; schemaReady: boolean };
    mcp: {
      configPath: string;
      configExists: boolean;
      launcherPath: string;
      launcherExists: boolean;
      serverPath: string | null;
      serverExists: boolean;
      configured: boolean;
      matchesExpected: boolean;
      detail: string;
    };
    playwrightConfigured: boolean;
    lcrConfigured: boolean;
    schemaReady: boolean;
    firstSyncCompleted: boolean;
    latestSuccessfulSyncAt: string | null;
    latestSuccessfulSyncType: string | null;
    prerequisitesReady: boolean;
    setupComplete: boolean;
    diagnostics: DiagnosticCheck[];
    diagnosticSummary: {
      pass: number;
      warn: number;
      fail: number;
      info: number;
    };
  };
};

type DesktopSettingsFormProps = {
  initialSnapshot: ConfigSnapshot;
  initialSetup?: boolean;
  restartRequired?: boolean;
};

type DesktopShellStatus = {
  ok: boolean;
  available: boolean;
  desktopPort?: string;
  controlPort?: string;
  managedNextProcess?: boolean;
  hasWindow?: boolean;
  error?: string;
};

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
};

type SyncLogPayload = {
  logFile: string | null;
  exists: boolean;
  tail: string;
  message?: string;
};

type SetupStep = "welcome" | "required" | "diagnostics" | "firstSync" | "optional" | "finish";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-amber-900/10 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

const sectionClassName = "rounded-[28px] border border-amber-900/10 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

const runtimeCriticalKeys = ["LCR_DIRECTORY_URL", "PLAYWRIGHT_USER_DATA_DIR", "PLAYWRIGHT_HEADLESS"] as const;

const setupSteps: Array<{ id: SetupStep; label: string; description: string }> = [
  { id: "welcome", label: "Welcome", description: "Understand how StakeOS setup works before changing anything." },
  { id: "required", label: "Required", description: "Enter the minimum settings required to run StakeOS Desktop." },
  { id: "diagnostics", label: "Diagnostics", description: "Handle prerequisites and verify local readiness." },
  { id: "firstSync", label: "First Sync", description: "Run the first full LCR sync so the app has local data." },
  { id: "optional", label: "Optional", description: "Add predefined recipient lists if you want them available in the app." },
  { id: "finish", label: "Finish", description: "Save the final settings and open the dashboard." }
];

const statusTone = (ok: boolean) =>
  ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900";

const diagnosticTone = (status: DiagnosticCheck["status"]) => {
  switch (status) {
    case "pass":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "fail":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
};

const getWizardStepFromSnapshot = (snapshot: ConfigSnapshot, initialSetup: boolean, restartRequired: boolean): SetupStep => {
  if (!initialSetup) {
    return "required";
  }

  if (!snapshot.status.requiredComplete) {
    return "welcome";
  }

  if (restartRequired) {
    return "required";
  }

  if (!snapshot.status.prerequisitesReady) {
    return "diagnostics";
  }

  if (!snapshot.status.firstSyncCompleted) {
    return "firstSync";
  }

  return "optional";
};

export function DesktopSettingsForm({ initialSnapshot, initialSetup = false, restartRequired = false }: DesktopSettingsFormProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [form, setForm] = useState(initialSnapshot.effectiveConfig);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    restartRequired
      ? "StakeOS Desktop needs a restart before the updated settings take effect."
      : initialSetup && !initialSnapshot.status.requiredComplete
        ? "Complete setup before using the rest of StakeOS Desktop."
        : null
  );
  const [error, setError] = useState<string | null>(null);
  const [shellStatus, setShellStatus] = useState<DesktopShellStatus | null>(null);
  const [wizardStep, setWizardStep] = useState<SetupStep>(getWizardStepFromSnapshot(initialSnapshot, initialSetup, restartRequired));
  const [setupAction, setSetupAction] = useState<DiagnosticActionKey | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusPayload | null>(null);
  const [syncLog, setSyncLog] = useState<SyncLogPayload | null>(null);
  const [syncAction, setSyncAction] = useState<"full" | null>(null);
  const [autoScrollLog, setAutoScrollLog] = useState(true);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const logRef = useRef<HTMLPreElement | null>(null);
  const autoRedirectAfterSyncRef = useRef(false);

  const missingLabel = useMemo(
    () => snapshot.status.missing.map((field) => field.replaceAll("_", " ")).join(", "),
    [snapshot.status.missing]
  );

  const requiredFieldLooksComplete = useMemo(() => {
    const lcrUrl = `${form.LCR_DIRECTORY_URL || ""}`.trim();
    return Boolean(lcrUrl) && !lcrUrl.includes("YOUR-REPORT-ID");
  }, [form.LCR_DIRECTORY_URL]);

  const runtimeCriticalChanged = useMemo(
    () => runtimeCriticalKeys.some((key) => `${snapshot.effectiveConfig[key] || ""}` !== `${form[key] || ""}`),
    [form, snapshot.effectiveConfig]
  );

  const loadShellStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/desktop-shell", { cache: "no-store" });
      const payload = (await response.json()) as DesktopShellStatus;
      setShellStatus(payload);
      return payload;
    } catch {
      const payload = { ok: false, available: false, error: "Desktop shell is unavailable." };
      setShellStatus(payload);
      return payload;
    }
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/api/desktop-config", { cache: "no-store" });
    const payload = (await response.json()) as ConfigSnapshot;
    if (!response.ok) {
      throw new Error("Unable to refresh desktop config.");
    }
    setSnapshot(payload);
    setForm(payload.effectiveConfig);
    return payload;
  }, []);

  const loadSyncStatus = useCallback(async () => {
    const response = await fetch("/api/sync/status", { cache: "no-store" });
    const payload = (await response.json()) as SyncStatusPayload;
    setSyncStatus(payload);
    return payload;
  }, []);

  const loadSyncLog = useCallback(async () => {
    const response = await fetch("/api/sync/log?lines=100", { cache: "no-store" });
    const payload = (await response.json()) as SyncLogPayload;
    setSyncLog(payload);
    return payload;
  }, []);

  useEffect(() => {
    void loadShellStatus();
  }, [loadShellStatus]);

  useEffect(() => {
    if (wizardStep !== "firstSync") {
      return;
    }

    void Promise.all([loadSyncStatus(), loadSyncLog()]);
    const interval = window.setInterval(() => {
      void Promise.all([loadSyncStatus(), loadSyncLog()]);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [wizardStep, loadSyncLog, loadSyncStatus]);

  useEffect(() => {
    if (!autoScrollLog || !logRef.current) {
      return;
    }

    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [autoScrollLog, syncLog?.tail]);

  useEffect(() => {
    if (!initialSetup || wizardStep !== "firstSync" || !syncStatus?.latest) {
      return;
    }

    const latest = syncStatus.latest;
    if (latest.status !== "success" || latest.syncType !== "sqlite_spike_full_sync") {
      return;
    }

    let cancelled = false;
    void (async () => {
      const refreshed = await refreshSnapshot().catch(() => null);
      if (!cancelled && refreshed?.status.firstSyncCompleted) {
        if (autoRedirectAfterSyncRef.current) {
          return;
        }

        autoRedirectAfterSyncRef.current = true;
        setOpeningDashboard(true);
        setMessage("First full sync completed. Opening the dashboard now.");
        window.setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialSetup, refreshSnapshot, syncStatus?.latest, wizardStep]);

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const waitForServerHealth = async () => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < 90_000) {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (response.ok) {
          return true;
        }
      } catch {}

      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }

    throw new Error("StakeOS Desktop did not come back after restart.");
  };

  const restartAndRefresh = async (successMessage: string) => {
    setRestarting(true);
    try {
      const restartResponse = await fetch("/api/desktop-shell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" })
      });
      const restartPayload = await restartResponse.json().catch(() => null);

      if (!restartResponse.ok) {
        throw new Error(restartPayload?.error || "Unable to restart StakeOS Desktop.");
      }

      await waitForServerHealth();
      const refreshed = await refreshSnapshot();
      await loadShellStatus();
      setMessage(successMessage);
      setWizardStep(getWizardStepFromSnapshot(refreshed, initialSetup, false));
      return refreshed;
    } finally {
      setRestarting(false);
    }
  };

  const saveSettings = async ({ restart = false, redirectToDashboard = false }: { restart?: boolean; redirectToDashboard?: boolean } = {}) => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/desktop-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: form })
      });

      const payload = (await response.json()) as ConfigSnapshot & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save desktop settings.");
      }

      setSnapshot(payload);
      setForm(payload.effectiveConfig);
      await loadShellStatus();

      const shouldRestart = restart || initialSetup || runtimeCriticalChanged;
      if (shouldRestart) {
        const refreshed = await restartAndRefresh("Settings saved. StakeOS Desktop reloaded with the new configuration.");
        if (redirectToDashboard && refreshed.status.firstSyncCompleted) {
          window.location.href = "/dashboard";
        }
        return refreshed;
      }

      setMessage(redirectToDashboard ? "Settings saved. Opening dashboard." : "Settings saved.");
      if (redirectToDashboard) {
        window.location.href = "/dashboard";
      }
      return payload;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save settings.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const importFromEnv = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/desktop-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_env" })
      });

      const payload = (await response.json()) as ConfigSnapshot & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to import .env values.");
      }

      setSnapshot(payload);
      setForm(payload.effectiveConfig);
      await restartAndRefresh("Imported .env values and reloaded StakeOS Desktop.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to import .env values.");
    } finally {
      setSaving(false);
    }
  };

  const runDiagnosticAction = async (action: DiagnosticActionKey) => {
    setSetupAction(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/setup/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Setup action failed.");
      }

      setSnapshot(payload.snapshot as ConfigSnapshot);
      setForm((payload.snapshot as ConfigSnapshot).effectiveConfig);
      setMessage(payload.result?.message || "Setup action completed.");
      setWizardStep(getWizardStepFromSnapshot(payload.snapshot as ConfigSnapshot, initialSetup, false));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Setup action failed.");
    } finally {
      setSetupAction(null);
    }
  };

  const runFirstSync = async () => {
    setSyncAction("full");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/sync/full", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "Unable to start the first full sync.");
      }

      setMessage(payload.message || "First full sync started.");
      await Promise.all([loadSyncStatus(), loadSyncLog()]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to start the first full sync.");
    } finally {
      setSyncAction(null);
    }
  };

  const continueWizard = async () => {
    const currentIndex = setupSteps.findIndex((step) => step.id === wizardStep);
    const next = setupSteps[currentIndex + 1];

    if (wizardStep === "required") {
      const saved = await saveSettings({ restart: true });
      if (!saved) {
        return;
      }
      return;
    }

    if (wizardStep === "diagnostics") {
      const refreshed = await refreshSnapshot().catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh diagnostics.");
        return null;
      });
      if (!refreshed) {
        return;
      }
      if (!refreshed.status.prerequisitesReady) {
        setMessage("Resolve the failing prerequisite checks before continuing.");
        return;
      }
      setWizardStep(refreshed.status.firstSyncCompleted ? "optional" : "firstSync");
      return;
    }

    if (wizardStep === "firstSync") {
      const refreshed = await refreshSnapshot().catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh sync status.");
        return null;
      });
      if (!refreshed?.status.firstSyncCompleted) {
        setMessage("Run a successful full sync before continuing.");
        return;
      }
      setOpeningDashboard(true);
      setMessage("First full sync completed. Opening the dashboard now.");
      window.location.href = "/dashboard";
      return;
    }

    if (wizardStep === "optional") {
      setWizardStep("finish");
      return;
    }

    if (next) {
      setWizardStep(next.id);
    }
  };

  const goBack = () => {
    const currentIndex = setupSteps.findIndex((step) => step.id === wizardStep);
    const previous = setupSteps[currentIndex - 1];
    if (previous) {
      setWizardStep(previous.id);
    }
  };

  const renderRequiredSettings = () => (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-slate-700">
        LCR Custom Report URL
        <input className={fieldClassName} value={form.LCR_DIRECTORY_URL || ""} onChange={(event) => handleChange("LCR_DIRECTORY_URL", event.target.value)} placeholder="https://lcr.churchofjesuschrist.org/mlt/report/..." />
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Stake Name
          <input className={fieldClassName} value={form.STAKE_NAME || ""} onChange={(event) => handleChange("STAKE_NAME", event.target.value)} placeholder="StakeOS Stake" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Unit Number
          <input className={fieldClassName} value={form.UNIT_NUMBER || ""} onChange={(event) => handleChange("UNIT_NUMBER", event.target.value)} placeholder="000000" />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Playwright User Data Directory
          <input className={fieldClassName} value={form.PLAYWRIGHT_USER_DATA_DIR || ""} onChange={(event) => handleChange("PLAYWRIGHT_USER_DATA_DIR", event.target.value)} placeholder=".playwright/profile" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Playwright Headless
          <select className={fieldClassName} value={form.PLAYWRIGHT_HEADLESS || "false"} onChange={(event) => handleChange("PLAYWRIGHT_HEADLESS", event.target.value)}>
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderDiagnostics = () => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.requiredComplete)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">Required Config</div>
          <div className="mt-1 font-semibold">{snapshot.status.requiredComplete ? "Ready" : "Needs attention"}</div>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.schemaReady)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">Schema</div>
          <div className="mt-1 font-semibold">{snapshot.status.schemaReady ? "Ready" : "Missing"}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="text-xs font-semibold uppercase tracking-wide">Pass</div>
          <div className="mt-1 font-semibold">{snapshot.status.diagnosticSummary.pass}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="text-xs font-semibold uppercase tracking-wide">Warnings</div>
          <div className="mt-1 font-semibold">{snapshot.status.diagnosticSummary.warn}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="text-xs font-semibold uppercase tracking-wide">Failures</div>
          <div className="mt-1 font-semibold">{snapshot.status.diagnosticSummary.fail}</div>
        </div>
      </div>

      <div className="space-y-3">
        {snapshot.status.diagnostics.map((check) => (
          <div key={check.key} className={`rounded-2xl border px-4 py-4 text-sm ${diagnosticTone(check.status)}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em]">{check.label}</div>
                <div className="mt-1 font-semibold">{check.summary}</div>
              </div>
              <div className="rounded-full border border-current/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                {check.status}
              </div>
            </div>
            {check.detail ? <div className="mt-2 text-xs opacity-80">{check.detail}</div> : null}
            {check.action ? <div className="mt-2 text-xs font-medium">{check.action}</div> : null}
            {check.actionKey && check.actionLabel ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void runDiagnosticAction(check.actionKey!)}
                  disabled={saving || restarting || setupAction !== null}
                  className="rounded-full border border-current/15 bg-white/70 px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {setupAction === check.actionKey ? `${check.actionLabel}...` : check.actionLabel}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  const renderFirstSync = () => (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.firstSyncCompleted)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">First Full Sync</div>
          <div className="mt-1 font-semibold">{snapshot.status.firstSyncCompleted ? "Completed" : "Pending"}</div>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Phase</div>
          <div className="mt-1 font-semibold text-slate-900">{syncStatus?.phase || "idle"}</div>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest Full Sync</div>
          <div className="mt-1 font-semibold text-slate-900">{snapshot.status.latestSuccessfulSyncAt ? new Date(snapshot.status.latestSuccessfulSyncAt).toLocaleString() : "None yet"}</div>
        </div>
        <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Records</div>
          <div className="mt-1 font-semibold text-slate-900">{syncStatus?.latest?.recordsProcessed ?? "—"}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-4 text-sm text-slate-600">
        <p>Run one full sync now. StakeOS will open Playwright if needed, and you can complete the LCR login manually in that browser session.</p>
        <p className="mt-2">After the first full sync succeeds, the dashboard, reports, and MCP tools will all have local stake data available.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void runFirstSync()}
          disabled={Boolean(syncStatus?.running) || syncAction !== null}
          className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncAction === "full" ? "Starting First Sync..." : "Run First Full Sync"}
        </button>
        <button
          type="button"
          onClick={() => {
            void Promise.all([loadSyncStatus(), loadSyncLog(), refreshSnapshot()]).catch((caughtError) =>
              setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh first-sync status.")
            );
          }}
          className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Refresh First Sync Status
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/sync-center";
          }}
          className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Open Sync Center
        </button>
      </div>

      <div className="rounded-2xl border border-amber-900/10 bg-slate-950 text-slate-100 shadow-inner">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">First Sync Log</div>
            <div className="mt-1 text-xs text-slate-400">{syncLog?.logFile || "No sync log yet."}</div>
          </div>
          <button
            type="button"
            onClick={() => setAutoScrollLog((current) => !current)}
            className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {autoScrollLog ? "Auto-scroll on" : "Auto-scroll off"}
          </button>
        </div>
        <pre ref={logRef} className="max-h-72 overflow-auto px-4 py-4 text-xs leading-5 text-slate-200">{syncLog?.tail || "Waiting for sync log output..."}</pre>
      </div>
    </div>
  );

  const renderOptionalSettings = () => (
    <div className="grid gap-6">
      <div className={sectionClassName}>
        <h3 className="font-serif text-2xl text-slate-900">Report Recipients</h3>
        <p className="mt-2 text-sm text-slate-600">Optional. Store common leadership recipient lists for quick access inside StakeOS.</p>
        <div className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Stake Presidency Emails
            <textarea className={`${fieldClassName} min-h-24`} value={form.STAKE_PRESIDENCY_EMAILS || ""} onChange={(event) => handleChange("STAKE_PRESIDENCY_EMAILS", event.target.value)} placeholder="person1@example.com, person2@example.com" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Stake Council Emails
            <textarea className={`${fieldClassName} min-h-24`} value={form.STAKE_COUNCIL_EMAILS || ""} onChange={(event) => handleChange("STAKE_COUNCIL_EMAILS", event.target.value)} placeholder="person1@example.com, person2@example.com" />
          </label>
        </div>
      </div>
      <div className={sectionClassName}>
        <h3 className="font-serif text-2xl text-slate-900">Claude Desktop MCP</h3>
        <p className="mt-2 text-sm text-slate-600">
          Optional. Register StakeOS as a local MCP server in Claude Desktop so Claude can query the same local SQLite data as the app.
        </p>
        <div className="mt-6 rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-4 text-sm text-slate-600">
          <div><span className="font-semibold text-slate-900">Claude config:</span> {snapshot.status.mcp.configPath}</div>
          <div className="mt-1"><span className="font-semibold text-slate-900">StakeOS MCP:</span> {snapshot.status.mcp.matchesExpected ? "Configured" : snapshot.status.mcp.configured ? "Needs refresh" : "Not configured"}</div>
          <div className="mt-1"><span className="font-semibold text-slate-900">Launcher:</span> {snapshot.status.mcp.launcherPath}</div>
          <div className="mt-1"><span className="font-semibold text-slate-900">Server build:</span> {snapshot.status.mcp.serverExists ? snapshot.status.mcp.serverPath : "Missing dist/server.cjs"}</div>
          <div className="mt-1">{snapshot.status.mcp.detail}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runDiagnosticAction("configure_mcp")}
            disabled={saving || restarting || setupAction !== null}
            className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {setupAction === "configure_mcp"
              ? "Configuring Claude MCP..."
              : snapshot.status.mcp.matchesExpected
                ? "Refresh Claude MCP Setup"
                : "Enable StakeOS MCP In Claude Desktop"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemStatus = () => (
    <div className={sectionClassName}>
      <h2 className="font-serif text-2xl text-slate-900">System Status</h2>
      <p className="mt-2 text-sm text-slate-600">
        Desktop config overrides <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code>. This panel shows setup gate status and the running Electron shell.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(Boolean(shellStatus?.available))}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">Desktop Shell</div>
          <div className="mt-1 font-semibold">{shellStatus?.available ? "Connected" : "Unavailable"}</div>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.setupComplete && !restartRequired)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">Setup Gate</div>
          <div className="mt-1 font-semibold">{snapshot.status.setupComplete && !restartRequired ? "Unlocked" : "Locked to setup"}</div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-600">
        <div><span className="font-semibold text-slate-900">Config file:</span> {snapshot.configPath}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">Desktop port:</span> {shellStatus?.desktopPort || "Unavailable"}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">Control port:</span> {shellStatus?.controlPort || "Unavailable"}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">Managed local server:</span> {shellStatus?.managedNextProcess ? "Yes" : "No / reused"}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">First successful full sync:</span> {snapshot.status.latestSuccessfulSyncAt ? new Date(snapshot.status.latestSuccessfulSyncAt).toLocaleString() : "None yet"}</div>
        {shellStatus?.error ? <div className="mt-1"><span className="font-semibold text-slate-900">Shell error:</span> {shellStatus.error}</div> : null}
      </div>
    </div>
  );

  const renderSetupWizard = () => {
    const activeStep = setupSteps.find((step) => step.id === wizardStep)!;
    const stepIndex = setupSteps.findIndex((step) => step.id === wizardStep);

    return (
      <div className="space-y-8">
        <section className="rounded-[32px] border border-amber-900/10 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">First-Run Setup</p>
          <h1 className="mt-3 font-serif text-4xl text-slate-900">StakeOS Desktop Setup</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Handle local prerequisites, restart into the saved configuration automatically, run the first sync, and then hand the user off to the actual app.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-6">
            {setupSteps.map((step, index) => {
              const current = index === stepIndex;
              const complete = index < stepIndex;
              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    current
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : complete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-900/10 bg-white text-slate-500"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em]">{step.label}</div>
                  <div className="mt-1 text-xs leading-5">{step.description}</div>
                </div>
              );
            })}
          </div>
          {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        </section>

        <section className={sectionClassName}>
          <h2 className="font-serif text-2xl text-slate-900">{activeStep.label}</h2>
          <p className="mt-2 text-sm text-slate-600">{activeStep.description}</p>

          <div className="mt-6">
            {wizardStep === "welcome" ? (
              <div className="space-y-4 text-sm text-slate-600">
                <p>
                  StakeOS Desktop never captures or stores LCR credentials. It relies on a Playwright browser profile that you control. The first-run flow verifies the machine,
                  applies required configuration, then guides the user through the first real directory sync.
                </p>
                <p>
                  If this repo is already configured in <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code>, import those values now. StakeOS will restart itself automatically.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={importFromEnv}
                    disabled={saving || restarting}
                    className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving || restarting ? "Importing And Restarting..." : "Import Current .env And Restart"}
                  </button>
                </div>
              </div>
            ) : null}

            {wizardStep === "required" ? renderRequiredSettings() : null}
            {wizardStep === "diagnostics" ? renderDiagnostics() : null}
            {wizardStep === "firstSync" ? renderFirstSync() : null}
            {wizardStep === "optional" ? renderOptionalSettings() : null}
            {wizardStep === "finish" ? (
              <div className="space-y-4 text-sm text-slate-600">
                <p>StakeOS is ready. The required runtime configuration is active, the local prerequisites passed, and the first full sync is recorded.</p>
                <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-4">
                  <div><span className="font-semibold text-slate-900">Required config:</span> {snapshot.status.requiredComplete ? "Ready" : "Still incomplete"}</div>
                  <div className="mt-1"><span className="font-semibold text-slate-900">Prerequisites:</span> {snapshot.status.prerequisitesReady ? "Ready" : "Needs attention"}</div>
                  <div className="mt-1"><span className="font-semibold text-slate-900">First sync:</span> {snapshot.status.firstSyncCompleted ? "Completed" : "Missing"}</div>
                  <div className="mt-1"><span className="font-semibold text-slate-900">Claude Desktop MCP:</span> {snapshot.status.mcp.matchesExpected ? "Configured" : "Optional and not configured"}</div>
                  <div className="mt-1"><span className="font-semibold text-slate-900">Last successful full sync:</span> {snapshot.status.latestSuccessfulSyncAt ? new Date(snapshot.status.latestSuccessfulSyncAt).toLocaleString() : "None yet"}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {!snapshot.status.requiredComplete ? `Missing required values: ${missingLabel || "LCR_DIRECTORY_URL"}` : restartRequired ? "Restart required before using the app." : "Required values are present."}
            </div>
            <div className="flex flex-wrap gap-3">
              {wizardStep !== "welcome" ? (
                <button type="button" onClick={goBack} className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  Back
                </button>
              ) : null}

              {wizardStep !== "finish" ? (
                <button
                  type="button"
                  onClick={() => void continueWizard()}
                  disabled={
                    saving ||
                    restarting ||
                    setupAction !== null ||
                    syncAction !== null ||
                    (wizardStep === "required" && !requiredFieldLooksComplete) ||
                    (wizardStep === "diagnostics" && !snapshot.status.prerequisitesReady) ||
                    (wizardStep === "firstSync" && !snapshot.status.firstSyncCompleted)
                  }
                  className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {wizardStep === "required" ? (saving || restarting ? "Applying Configuration..." : "Save, Restart, And Continue") : wizardStep === "diagnostics" ? "Continue To First Sync" : wizardStep === "firstSync" ? "Continue" : "Continue"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setOpeningDashboard(true);
                    const saved = await saveSettings({ restart: false, redirectToDashboard: true });
                    if (!saved) {
                      setOpeningDashboard(false);
                    }
                  }}
                  disabled={saving || restarting || openingDashboard}
                  className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving || openingDashboard ? "Opening Dashboard..." : "Open Dashboard"}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  };

  if (initialSetup) {
    return renderSetupWizard();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-amber-900/10 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Desktop Setup</p>
        <h1 className="mt-3 font-serif text-4xl text-slate-900">StakeOS Settings</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          StakeOS Desktop stores local configuration outside the repo and applies it before any fallback <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code> values.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.setupComplete && !restartRequired)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">Setup Complete</div>
            <div className="mt-1 font-semibold">{snapshot.status.setupComplete && !restartRequired ? "Ready" : "Needs attention"}</div>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.database.ok)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">Local Data Store</div>
            <div className="mt-1 font-semibold">{snapshot.status.database.ok ? "Ready" : "Needs setup"}</div>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.schemaReady)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">Schema</div>
            <div className="mt-1 font-semibold">{snapshot.status.schemaReady ? "Ready" : "Missing"}</div>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.firstSyncCompleted)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">First Sync</div>
            <div className="mt-1 font-semibold">{snapshot.status.firstSyncCompleted ? "Completed" : "Pending"}</div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-600">
          <div><span className="font-semibold text-slate-900">Config file:</span> {snapshot.configPath}</div>
          <div className="mt-1"><span className="font-semibold text-slate-900">Local store:</span> {snapshot.status.database.message}</div>
          <div className="mt-1"><span className="font-semibold text-slate-900">First successful full sync:</span> {snapshot.status.latestSuccessfulSyncAt ? new Date(snapshot.status.latestSuccessfulSyncAt).toLocaleString() : "None yet"}</div>
          {!snapshot.status.requiredComplete ? <div className="mt-1"><span className="font-semibold text-slate-900">Missing required values:</span> {missingLabel}</div> : null}
          {restartRequired ? <div className="mt-1"><span className="font-semibold text-slate-900">Restart required:</span> The running app has not applied the current desktop config yet.</div> : null}
        </div>
        {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={sectionClassName}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-slate-900">Required Core Settings</h2>
              <p className="mt-2 text-sm text-slate-600">These are the minimum fields needed for StakeOS Desktop to operate cleanly.</p>
            </div>
            <button type="button" onClick={importFromEnv} disabled={saving || restarting} className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              {saving || restarting ? "Importing..." : "Import Current .env And Restart"}
            </button>
          </div>
          <div className="mt-6">{renderRequiredSettings()}</div>
        </div>

        {renderSystemStatus()}
      </section>

      <section className={sectionClassName}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-slate-900">Diagnostics And Prerequisites</h2>
            <p className="mt-2 text-sm text-slate-600">These checks verify that the machine, database, schema, and Playwright runtime are actually ready to support the desktop app.</p>
          </div>
          <button type="button" onClick={() => void refreshSnapshot().catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh diagnostics."))} className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Re-run Diagnostics
          </button>
        </div>
        <div className="mt-6">{renderDiagnostics()}</div>
      </section>

      {!snapshot.status.firstSyncCompleted ? (
        <section className={sectionClassName}>
          <h2 className="font-serif text-2xl text-slate-900">Guided First Sync</h2>
          <p className="mt-2 text-sm text-slate-600">Run a full sync now so StakeOS has local data to populate the dashboard and MCP tools.</p>
          <div className="mt-6">{renderFirstSync()}</div>
        </section>
      ) : null}

      {renderOptionalSettings()}

      <div className="flex items-center justify-between rounded-[28px] border border-amber-900/10 bg-white/80 px-6 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div>
          <div className="text-sm font-semibold text-slate-900">Save Desktop Settings</div>
          <div className="mt-1 text-sm text-slate-600">Runtime-critical changes auto-restart StakeOS Desktop. Optional settings save without restart.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void saveSettings()} disabled={saving || restarting} className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && !restarting ? "Saving..." : runtimeCriticalChanged ? "Save And Auto-Restart" : "Save Settings"}
          </button>
          <button type="button" onClick={() => void saveSettings({ restart: true })} disabled={saving || restarting || !shellStatus?.available} className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            {restarting ? "Restarting..." : "Save And Restart StakeOS"}
          </button>
        </div>
      </div>
    </div>
  );
}
