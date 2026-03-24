"use client";

import { useEffect, useMemo, useState } from "react";

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

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-amber-900/10 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

const sectionClassName = "rounded-[28px] border border-amber-900/10 bg-white/85 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]";

const statusTone = (ok: boolean) =>
  ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-900";

export function DesktopSettingsForm({ initialSnapshot, initialSetup = false }: DesktopSettingsFormProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [form, setForm] = useState(initialSnapshot.effectiveConfig);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState<string | null>(
    initialSetup && !initialSnapshot.status.requiredComplete
      ? "Complete the required settings below, then restart StakeOS Desktop."
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [shellStatus, setShellStatus] = useState<DesktopShellStatus | null>(null);

  const missingLabel = useMemo(
    () => snapshot.status.missing.map((field) => field.replaceAll("_", " ")).join(", "),
    [snapshot.status.missing]
  );

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadShellStatus = async () => {
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

    void loadShellStatus();

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

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save desktop settings.");
      }

      setSnapshot(payload);
      setForm(payload.effectiveConfig);
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
        return;
      }

      setMessage("Settings saved. Restart StakeOS Desktop to apply server-side changes.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save settings.");
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

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to import .env values.");
      }

      setSnapshot(payload);
      setForm(payload.effectiveConfig);
      setMessage("Imported current .env values into desktop config. Restart StakeOS Desktop to apply them.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to import .env values.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-amber-900/10 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Desktop Setup</p>
        <h1 className="mt-3 font-serif text-4xl text-slate-900">StakeOS Settings</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          StakeOS Desktop now supports a local app-managed config file. These settings are stored outside the repo and
          merged with any existing <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code> values on app startup.
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

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={sectionClassName}>
          <h2 className="font-serif text-2xl text-slate-900">Required Core Settings</h2>
          <p className="mt-2 text-sm text-slate-600">These are the minimum fields needed for StakeOS Desktop to operate cleanly.</p>
          <div className="mt-6 space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Database URL
              <input className={fieldClassName} value={form.DATABASE_URL || ""} onChange={(event) => handleChange("DATABASE_URL", event.target.value)} placeholder="postgresql://localhost:5432/stakeos" />
            </label>
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
        </div>

        <div className="space-y-6">
          <div className={sectionClassName}>
            <h2 className="font-serif text-2xl text-slate-900">System Status</h2>
            <p className="mt-2 text-sm text-slate-600">
              Desktop config overrides <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code>. Use this panel to verify the running desktop shell and setup gate.
            </p>
            <div className="mt-6 grid gap-3">
              <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(Boolean(shellStatus?.available))}`}>
                <div className="text-xs font-semibold uppercase tracking-wide">Desktop Shell</div>
                <div className="mt-1 font-semibold">{shellStatus?.available ? "Connected" : "Unavailable"}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-sm ${statusTone(snapshot.status.requiredComplete)}`}>
                <div className="text-xs font-semibold uppercase tracking-wide">Setup Gate</div>
                <div className="mt-1 font-semibold">{snapshot.status.requiredComplete ? "Unlocked" : "Locked to setup"}</div>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-[#fffaf0] px-4 py-3 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-900">Desktop port:</span> {shellStatus?.desktopPort || "Unavailable"}</div>
                <div className="mt-1"><span className="font-semibold text-slate-900">Control port:</span> {shellStatus?.controlPort || "Unavailable"}</div>
                <div className="mt-1"><span className="font-semibold text-slate-900">Managed local server:</span> {shellStatus?.managedNextProcess ? "Yes" : "No / reused"}</div>
                {shellStatus?.error ? <div className="mt-1"><span className="font-semibold text-slate-900">Shell error:</span> {shellStatus.error}</div> : null}
              </div>
            </div>
          </div>

          <div className={sectionClassName}>
            <h2 className="font-serif text-2xl text-slate-900">Email Settings</h2>
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
            <h2 className="font-serif text-2xl text-slate-900">Report Recipients</h2>
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
      </section>

      <div className="flex items-center justify-between rounded-[28px] border border-amber-900/10 bg-white/80 px-6 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div>
          <div className="text-sm font-semibold text-slate-900">Save Desktop Settings</div>
          <div className="mt-1 text-sm text-slate-600">Desktop config overrides .env. Use Save And Restart to apply changes immediately.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={importFromEnv}
            disabled={saving || restarting}
            className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Import Current .env
          </button>
          <button
            type="button"
            onClick={() => saveSettings()}
            disabled={saving || restarting}
            className="rounded-full border border-amber-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && !restarting ? "Saving..." : "Save Settings"}
          </button>
          <button
            type="button"
            onClick={() => saveSettings({ restart: true })}
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
