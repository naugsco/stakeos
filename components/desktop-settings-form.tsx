"use client";

import { useEffect, useMemo, useState } from "react";

type DiagnosticCheck = {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail" | "info";
  summary: string;
  detail?: string;
  action?: string;
};

type ConfigSnapshot = {
  configPath: string;
  configExists: boolean;
  effectiveConfig: Record<string, string>;
  status: {
    requiredComplete: boolean;
    missing: string[];
    database: { ok: boolean; message: string };
    emailConfigured: boolean;
    playwrightConfigured: boolean;
    lcrConfigured: boolean;
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

type SetupStep = "welcome" | "required" | "diagnostics" | "optional" | "finish";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-amber-900/10 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

const sectionClassName = "rounded-[28px] border border-amber-900/10 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

const statusTone = (ok: boolean) =>
  ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-900";

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

const setupSteps: Array<{ id: SetupStep; label: string; description: string }> = [
  { id: "welcome", label: "Welcome", description: "Understand how StakeOS setup works before changing anything." },
  { id: "required", label: "Required", description: "Enter the minimum settings required to run StakeOS Desktop." },
  { id: "diagnostics", label: "Diagnostics", description: "Check database, Playwright, LCR URL, and email readiness." },
  { id: "optional", label: "Optional", description: "Configure email and recipient lists if you want in-app delivery." },
  { id: "finish", label: "Finish", description: "Save settings and restart StakeOS Desktop." }
];

export function DesktopSettingsForm({ initialSnapshot, initialSetup = false }: DesktopSettingsFormProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [form, setForm] = useState(initialSnapshot.effectiveConfig);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    initialSetup && !initialSnapshot.status.requiredComplete
      ? "Complete setup before using the rest of StakeOS Desktop."
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [shellStatus, setShellStatus] = useState<DesktopShellStatus | null>(null);
  const [wizardStep, setWizardStep] = useState<SetupStep>(
    initialSetup
      ? initialSnapshot.status.requiredComplete
        ? "diagnostics"
        : "welcome"
      : "required"
  );

  const missingLabel = useMemo(
    () => snapshot.status.missing.map((field) => field.replaceAll("_", " ")).join(", "),
    [snapshot.status.missing]
  );

  const requiredFieldLooksComplete = useMemo(() => {
    const databaseUrl = `${form.DATABASE_URL || ""}`.trim();
    const lcrUrl = `${form.LCR_DIRECTORY_URL || ""}`.trim();
    return Boolean(databaseUrl) && Boolean(lcrUrl) && !lcrUrl.includes("YOUR-REPORT-ID");
  }, [form.DATABASE_URL, form.LCR_DIRECTORY_URL]);

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loadShellStatus = async () => {
    try {
      const response = await fetch("/api/desktop-shell", { cache: "no-store" });
      const payload = (await response.json()) as DesktopShellStatus;
      setShellStatus(payload);
    } catch {
      setShellStatus({ ok: false, available: false, error: "Desktop shell is unavailable." });
    }
  };

  const refreshSnapshot = async () => {
    const response = await fetch("/api/desktop-config", { cache: "no-store" });
    const payload = (await response.json()) as ConfigSnapshot;
    if (!response.ok) {
      throw new Error("Unable to refresh desktop config.");
    }
    setSnapshot(payload);
    setForm(payload.effectiveConfig);
    return payload;
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/desktop-shell", { cache: "no-store" });
        const payload = (await response.json()) as DesktopShellStatus;
        if (!cancelled) {
          setShellStatus(payload);
        }
      } catch {
        if (!cancelled) {
          setShellStatus({ ok: false, available: false, error: "Desktop shell is unavailable." });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveSettings = async ({ restart = false }: { restart?: boolean } = {}) => {
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

      if (restart) {
        setRestarting(true);
        const restartResponse = await fetch("/api/desktop-shell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restart" })
        });
        const restartPayload = await restartResponse.json().catch(() => null);

        if (!restartResponse.ok) {
          throw new Error(restartPayload?.error || "Unable to restart StakeOS Desktop.");
        }

        setMessage("Settings saved. StakeOS Desktop is restarting now.");
        return payload;
      }

      setMessage("Settings saved. Restart StakeOS Desktop to apply server-side changes.");
      return payload;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save settings.");
      return null;
    } finally {
      setSaving(false);
      setRestarting(false);
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
      setMessage("Imported current .env values into desktop config. Review diagnostics, then restart StakeOS Desktop.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to import .env values.");
    } finally {
      setSaving(false);
    }
  };

  const continueWizard = async () => {
    const currentIndex = setupSteps.findIndex((step) => step.id === wizardStep);
    const next = setupSteps[currentIndex + 1];

    if (wizardStep === "required") {
      const saved = await saveSettings();
      if (!saved) {
        return;
      }
    }

    if (wizardStep === "diagnostics") {
      try {
        await refreshSnapshot();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh diagnostics.");
        return;
      }
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
        Database URL
        <input
          className={fieldClassName}
          value={form.DATABASE_URL || ""}
          onChange={(event) => handleChange("DATABASE_URL", event.target.value)}
          placeholder="postgresql://localhost:5432/stakeos"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        LCR Custom Report URL
        <input
          className={fieldClassName}
          value={form.LCR_DIRECTORY_URL || ""}
          onChange={(event) => handleChange("LCR_DIRECTORY_URL", event.target.value)}
          placeholder="https://lcr.churchofjesuschrist.org/mlt/report/..."
        />
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Stake Name
          <input
            className={fieldClassName}
            value={form.STAKE_NAME || ""}
            onChange={(event) => handleChange("STAKE_NAME", event.target.value)}
            placeholder="StakeOS Stake"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Unit Number
          <input
            className={fieldClassName}
            value={form.UNIT_NUMBER || ""}
            onChange={(event) => handleChange("UNIT_NUMBER", event.target.value)}
            placeholder="000000"
          />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Playwright User Data Directory
          <input
            className={fieldClassName}
            value={form.PLAYWRIGHT_USER_DATA_DIR || ""}
            onChange={(event) => handleChange("PLAYWRIGHT_USER_DATA_DIR", event.target.value)}
            placeholder=".playwright/profile"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Playwright Headless
          <select
            className={fieldClassName}
            value={form.PLAYWRIGHT_HEADLESS || "false"}
            onChange={(event) => handleChange("PLAYWRIGHT_HEADLESS", event.target.value)}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderDiagnostics = () => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.requiredComplete)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">Required Config</div>
          <div className="mt-1 font-semibold">{snapshot.status.requiredComplete ? "Ready" : "Needs attention"}</div>
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
          </div>
        ))}
      </div>
    </div>
  );

  const renderOptionalSettings = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={sectionClassName}>
        <h3 className="font-serif text-2xl text-slate-900">Email Settings</h3>
        <p className="mt-2 text-sm text-slate-600">Optional. Needed for in-app email drafting and automated mail delivery.</p>
        <div className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            SMTP Host
            <input className={fieldClassName} value={form.SMTP_HOST || ""} onChange={(event) => handleChange("SMTP_HOST", event.target.value)} placeholder="smtp.example.com" />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              SMTP Port
              <input className={fieldClassName} value={form.SMTP_PORT || ""} onChange={(event) => handleChange("SMTP_PORT", event.target.value)} placeholder="587" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              SMTP Secure
              <select className={fieldClassName} value={form.SMTP_SECURE || "false"} onChange={(event) => handleChange("SMTP_SECURE", event.target.value)}>
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            SMTP User
            <input className={fieldClassName} value={form.SMTP_USER || ""} onChange={(event) => handleChange("SMTP_USER", event.target.value)} placeholder="username" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            SMTP Password
            <input type="password" className={fieldClassName} value={form.SMTP_PASS || ""} onChange={(event) => handleChange("SMTP_PASS", event.target.value)} placeholder="password" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            SMTP From Address
            <input className={fieldClassName} value={form.SMTP_FROM || ""} onChange={(event) => handleChange("SMTP_FROM", event.target.value)} placeholder="stake@example.com" />
          </label>
        </div>
      </div>

      <div className={sectionClassName}>
        <h3 className="font-serif text-2xl text-slate-900">Report Recipients</h3>
        <p className="mt-2 text-sm text-slate-600">Optional. Used by reporting and messaging features that target predefined leadership groups.</p>
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
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.requiredComplete)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide">Setup Gate</div>
          <div className="mt-1 font-semibold">{snapshot.status.requiredComplete ? "Unlocked" : "Locked to setup"}</div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-600">
        <div><span className="font-semibold text-slate-900">Config file:</span> {snapshot.configPath}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">Desktop port:</span> {shellStatus?.desktopPort || "Unavailable"}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">Control port:</span> {shellStatus?.controlPort || "Unavailable"}</div>
        <div className="mt-1"><span className="font-semibold text-slate-900">Managed local server:</span> {shellStatus?.managedNextProcess ? "Yes" : "No / reused"}</div>
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
            Complete the required configuration first, review diagnostics, then finish with a restart so StakeOS Desktop loads with the correct local settings.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
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
                  StakeOS Desktop never captures or stores LCR credentials. It relies on a Playwright browser profile that you control.
                  Required settings are your local PostgreSQL connection and the LCR custom report URL.
                </p>
                <p>
                  If you already configured this repo in <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code>, import those values now and review them before continuing.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={importFromEnv}
                    disabled={saving || restarting}
                    className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Importing..." : "Import Current .env"}
                  </button>
                </div>
              </div>
            ) : null}

            {wizardStep === "required" ? renderRequiredSettings() : null}
            {wizardStep === "diagnostics" ? renderDiagnostics() : null}
            {wizardStep === "optional" ? renderOptionalSettings() : null}
            {wizardStep === "finish" ? (
              <div className="space-y-4 text-sm text-slate-600">
                <p>Setup is ready to finish. Save the current settings and restart StakeOS Desktop so the protected pages unlock with the updated configuration.</p>
                <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-4">
                  <div><span className="font-semibold text-slate-900">Required config:</span> {snapshot.status.requiredComplete ? "Ready" : "Still incomplete"}</div>
                  <div className="mt-1"><span className="font-semibold text-slate-900">Database:</span> {snapshot.status.database.message}</div>
                  <div className="mt-1"><span className="font-semibold text-slate-900">Diagnostics:</span> {snapshot.status.diagnosticSummary.pass} pass, {snapshot.status.diagnosticSummary.warn} warning, {snapshot.status.diagnosticSummary.fail} failure</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {!snapshot.status.requiredComplete ? `Missing required values: ${missingLabel || "DATABASE_URL, LCR_DIRECTORY_URL"}` : "Required values are present."}
            </div>
            <div className="flex flex-wrap gap-3">
              {wizardStep !== "welcome" ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Back
                </button>
              ) : null}

              {wizardStep !== "finish" ? (
                <button
                  type="button"
                  onClick={() => void continueWizard()}
                  disabled={saving || restarting || (wizardStep === "required" && !requiredFieldLooksComplete)}
                  className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {wizardStep === "required" && saving ? "Saving..." : wizardStep === "diagnostics" ? "Re-run Checks And Continue" : "Continue"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void saveSettings({ restart: true })}
                  disabled={saving || restarting || !shellStatus?.available}
                  className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {restarting ? "Restarting..." : "Save And Restart StakeOS"}
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
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.requiredComplete)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">Required Config</div>
            <div className="mt-1 font-semibold">{snapshot.status.requiredComplete ? "Ready" : "Needs attention"}</div>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.database.ok)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">Database</div>
            <div className="mt-1 font-semibold">{snapshot.status.database.ok ? "Connected" : "Connection failed"}</div>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.lcrConfigured)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">LCR Report</div>
            <div className="mt-1 font-semibold">{snapshot.status.lcrConfigured ? "Configured" : "Missing"}</div>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.emailConfigured)}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">Email</div>
            <div className="mt-1 font-semibold">{snapshot.status.emailConfigured ? "Configured" : "Optional / not set"}</div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-600">
          <div><span className="font-semibold text-slate-900">Config file:</span> {snapshot.configPath}</div>
          <div className="mt-1"><span className="font-semibold text-slate-900">Database status:</span> {snapshot.status.database.message}</div>
          {!snapshot.status.requiredComplete ? (
            <div className="mt-1"><span className="font-semibold text-slate-900">Missing required values:</span> {missingLabel}</div>
          ) : null}
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
            <button
              type="button"
              onClick={importFromEnv}
              disabled={saving || restarting}
              className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Working..." : "Import Current .env"}
            </button>
          </div>
          <div className="mt-6">{renderRequiredSettings()}</div>
        </div>

        {renderSystemStatus()}
      </section>

      <section className={sectionClassName}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-slate-900">Diagnostics</h2>
            <p className="mt-2 text-sm text-slate-600">These checks help you verify that the desktop app can actually run its local services and LCR automation.</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshSnapshot().catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh diagnostics."))}
            className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Re-run Diagnostics
          </button>
        </div>
        <div className="mt-6">{renderDiagnostics()}</div>
      </section>

      {renderOptionalSettings()}

      <div className="flex items-center justify-between rounded-[28px] border border-amber-900/10 bg-white/80 px-6 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div>
          <div className="text-sm font-semibold text-slate-900">Save Desktop Settings</div>
          <div className="mt-1 text-sm text-slate-600">Desktop config overrides .env. Use Save And Restart to apply changes immediately.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={saving || restarting}
            className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && !restarting ? "Saving..." : "Save Settings"}
          </button>
          <button
            type="button"
            onClick={() => void saveSettings({ restart: true })}
            disabled={saving || restarting || !shellStatus?.available}
            className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {restarting ? "Restarting..." : "Save And Restart StakeOS"}
          </button>
        </div>
      </div>
    </div>
  );
}
