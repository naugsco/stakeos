import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { z } from "zod";

const desktopConfigSchema = z.object({
  DATABASE_URL: z.string().optional(),
  SQLITE_SPIKE_DB_PATH: z.string().optional(),
  LCR_DIRECTORY_URL: z.string().optional(),
  PLAYWRIGHT_USER_DATA_DIR: z.string().optional(),
  PLAYWRIGHT_HEADLESS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  STAKE_NAME: z.string().optional(),
  UNIT_NUMBER: z.string().optional(),
  STAKE_PRESIDENCY_EMAILS: z.string().optional(),
  STAKE_COUNCIL_EMAILS: z.string().optional()
});

export type DesktopConfig = z.infer<typeof desktopConfigSchema>;

export type DiagnosticStatus = "pass" | "warn" | "fail" | "info";

export interface DiagnosticCheck {
  key: string;
  label: string;
  status: DiagnosticStatus;
  summary: string;
  detail?: string;
  action?: string;
  actionKey?: "create_database" | "run_db_migrate" | "install_chromium";
  actionLabel?: string;
}

const REQUIRED_FIELDS = ["LCR_DIRECTORY_URL"] as const;

const getDesktopConfigDir = () => {
  const home = os.homedir();

  switch (process.platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", "StakeOS");
    case "win32":
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "StakeOS");
    default:
      return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "StakeOS");
  }
};

const getSqliteSpikeDbPath = () => {
  const configured = loadDesktopConfig().SQLITE_SPIKE_DB_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  const defaultPath = path.resolve(getDesktopConfigDir(), "stakeos.db");
  const legacyPath = path.resolve(getDesktopConfigDir(), "sqlite-spike", "stakeos-spike.db");

  if (!existsSync(defaultPath) && existsSync(legacyPath)) {
    mkdirSync(path.dirname(defaultPath), { recursive: true });
    renameSync(legacyPath, defaultPath);
  }

  return defaultPath;
};

const openSqliteConfigDb = () => {
  const dbPath = getSqliteSpikeDbPath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
};

export const getDesktopConfigPath = () => path.join(getDesktopConfigDir(), "config.json");

export const ensureDesktopConfigDir = () => {
  mkdirSync(getDesktopConfigDir(), { recursive: true });
};

export const loadDesktopConfig = (): DesktopConfig => {
  const configPath = getDesktopConfigPath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8"));
    return desktopConfigSchema.parse(parsed);
  } catch {
    return {};
  }
};

const getProjectEnvPath = () => path.resolve(process.cwd(), ".env");

export const loadProjectEnvConfig = (): DesktopConfig => {
  const envPath = getProjectEnvPath();

  if (!existsSync(envPath)) {
    return {};
  }

  try {
    return desktopConfigSchema.partial().parse(dotenv.parse(readFileSync(envPath, "utf8")));
  } catch {
    return {};
  }
};

const normalizeInput = (config: DesktopConfig): DesktopConfig => {
  const normalizedEntries = Object.entries(config)
    .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value] as const)
    .filter(([, value]) => value !== undefined);

  return desktopConfigSchema.parse(Object.fromEntries(normalizedEntries));
};

export const saveDesktopConfig = (config: DesktopConfig) => {
  ensureDesktopConfigDir();
  const normalized = normalizeInput(config);
  writeFileSync(getDesktopConfigPath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
};

export const importProjectEnvIntoDesktopConfig = () => {
  const current = loadDesktopConfig();
  const projectEnv = loadProjectEnvConfig();
  return saveDesktopConfig({
    ...current,
    ...projectEnv
  });
};

export const getEffectiveDesktopEnv = (baseEnv: NodeJS.ProcessEnv = process.env) => ({
  ...baseEnv,
  ...loadDesktopConfig()
});

const isValidLcrUrl = (value?: string) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.hostname === "lcr.churchofjesuschrist.org" && /\/mlt\/report\//.test(parsed.pathname);
  } catch {
    return false;
  }
};

const isMissingValue = (key: typeof REQUIRED_FIELDS[number], effectiveEnv: Record<string, string | undefined>) => {
  const value = effectiveEnv[key]?.trim();
  if (!value) {
    return true;
  }

  if (key === "LCR_DIRECTORY_URL") {
    if (value.includes("YOUR-REPORT-ID")) {
      return true;
    }

    return !isValidLcrUrl(value);
  }

  return false;
};

const isPlaceholderValue = (value?: string) => {
  const normalized = value?.trim().toLowerCase() || "";
  if (!normalized) {
    return true;
  }

  return [
    "smtp.example.com",
    "example_user",
    "example_pass",
    "stakeos <no-reply@example.com>",
    "no-reply@example.com"
  ].includes(normalized);
};

const summarizeDiagnostics = (checks: DiagnosticCheck[]) => ({
  pass: checks.filter((check) => check.status === "pass").length,
  warn: checks.filter((check) => check.status === "warn").length,
  fail: checks.filter((check) => check.status === "fail").length,
  info: checks.filter((check) => check.status === "info").length
});

const commandExists = (command: string) => {
  const lookupCommand = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookupCommand, [command], { stdio: "ignore" });
  return result.status === 0;
};

const validateLcrUrl = (rawUrl?: string): DiagnosticCheck => {
  const value = rawUrl?.trim();
  if (!value) {
    return {
      key: "lcr_url",
      label: "LCR Report URL",
      status: "fail",
      summary: "LCR report URL is missing.",
      action: "Paste the full custom report URL from LCR into settings."
    };
  }

  try {
    const parsed = new URL(value);
    const validHost = parsed.hostname === "lcr.churchofjesuschrist.org";
    const looksLikeReport = /\/mlt\/report\//.test(parsed.pathname);

    if (!validHost || !looksLikeReport) {
      return {
        key: "lcr_url",
        label: "LCR Report URL",
        status: "warn",
        summary: "The URL format is unusual for an LCR custom report.",
        detail: value,
        action: "Use the full report-details URL from LCR so StakeOS lands on the correct page."
      };
    }

    return {
      key: "lcr_url",
      label: "LCR Report URL",
      status: "pass",
      summary: "LCR report URL looks valid.",
      detail: parsed.hostname
    };
  } catch {
    return {
      key: "lcr_url",
      label: "LCR Report URL",
      status: "fail",
      summary: "LCR report URL is not a valid URL.",
      detail: value,
      action: "Paste the exact https://... URL from the LCR custom report page."
    };
  }
};

const validateSqliteStore = (): DiagnosticCheck => ({
  key: "sqlite_store",
  label: "Local Data Store Path",
  status: "info",
  summary: "StakeOS Desktop stores local data in the application-support folder.",
  detail: getSqliteSpikeDbPath()
});

const validatePlaywright = async (effectiveEnv: Record<string, string | undefined>): Promise<DiagnosticCheck[]> => {
  const checks: DiagnosticCheck[] = [];
  const profileDir = effectiveEnv.PLAYWRIGHT_USER_DATA_DIR?.trim();

  if (!profileDir) {
    checks.push({
      key: "playwright_profile",
      label: "Playwright Profile",
      status: "warn",
      summary: "Playwright user data directory is not set.",
      action: "Set PLAYWRIGHT_USER_DATA_DIR so StakeOS can reuse your manual LCR login session."
    });
  } else {
    checks.push({
      key: "playwright_profile",
      label: "Playwright Profile",
      status: "pass",
      summary: "Playwright user data directory is configured.",
      detail: profileDir
    });
  }

  try {
    const playwright = await import("playwright");
    const executablePath = playwright.chromium.executablePath();
    checks.push({
      key: "playwright_runtime",
      label: "Chromium Runtime",
      status: executablePath ? "pass" : "warn",
      summary: executablePath ? "Playwright Chromium is available." : "Chromium executable path was not resolved.",
      detail: executablePath || undefined,
      action: executablePath ? undefined : "Install Chromium for Playwright so StakeOS can automate the LCR browser session.",
      actionKey: executablePath ? undefined : "install_chromium",
      actionLabel: executablePath ? undefined : "Install Chromium"
    });
  } catch (error) {
    checks.push({
      key: "playwright_runtime",
      label: "Chromium Runtime",
      status: "fail",
      summary: "Playwright Chromium is not available.",
      detail: error instanceof Error ? error.message : "Chromium executable could not be resolved.",
      action: "Install Chromium for Playwright so StakeOS can automate the LCR browser session.",
      actionKey: "install_chromium",
      actionLabel: "Install Chromium"
    });
  }

  return checks;
};

type DatabaseInspection = {
  ok: boolean;
  message: string;
  exists: boolean;
  schemaReady: boolean;
  schemaMessage: string;
  firstSyncCompleted: boolean;
  latestSuccessfulSyncAt: string | null;
  latestSuccessfulSyncType: string | null;
};

const inspectDatabase = async (): Promise<DatabaseInspection> => {
  const dbPath = getSqliteSpikeDbPath();

  if (!existsSync(dbPath)) {
    return {
      ok: false,
      message: "Local directory store has not been initialized yet.",
      exists: false,
      schemaReady: false,
      schemaMessage: "Run the first full sync to create the local store.",
      firstSyncCompleted: false,
      latestSuccessfulSyncAt: null,
      latestSuccessfulSyncType: null
    };
  }

  const db = openSqliteConfigDb();

  try {
    const tableRows = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name IN ('members', 'callings', 'sync_logs')`
      )
      .all() as Array<{ name: string }>;
    const tableNames = new Set(tableRows.map((row) => row.name));
    const schemaReady =
      tableNames.has("members") && tableNames.has("callings") && tableNames.has("sync_logs");

    let latestSuccessfulSyncAt: string | null = null;
    let latestSuccessfulSyncType: string | null = null;
    let firstSyncCompleted = false;

    if (schemaReady) {
      const latestSync = db
        .prepare(
          `SELECT
             sync_type AS syncType,
             completed_at AS completedAt
           FROM sync_logs
           WHERE status = 'success'
             AND sync_type = 'sqlite_spike_full_sync'
             AND completed_at IS NOT NULL
           ORDER BY completed_at DESC, id DESC
           LIMIT 1`
        )
        .get() as { syncType?: string | null; completedAt?: string | null } | undefined;

      latestSuccessfulSyncAt = latestSync?.completedAt ?? null;
      latestSuccessfulSyncType = latestSync?.syncType ?? null;
      firstSyncCompleted = Boolean(latestSuccessfulSyncAt);
    }

    return {
      ok: true,
      message: "Connected",
      exists: true,
      schemaReady,
      schemaMessage: schemaReady ? "Local data schema is present." : "Local data schema has not been initialized yet.",
      firstSyncCompleted,
      latestSuccessfulSyncAt,
      latestSuccessfulSyncType
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to inspect the local data store.",
      exists: true,
      schemaReady: false,
      schemaMessage: "StakeOS cannot inspect the local data schema right now.",
      firstSyncCompleted: false,
      latestSuccessfulSyncAt: null,
      latestSuccessfulSyncType: null
    };
  } finally {
    db.close();
  }
};

export const getDesktopConfigSnapshot = async () => {
  const storedConfig = loadDesktopConfig();
  const effectiveEnv = getEffectiveDesktopEnv();
  const missing = REQUIRED_FIELDS.filter((key) => isMissingValue(key, effectiveEnv));
  const database = await inspectDatabase();
  const diagnostics = [
    validateSqliteStore(),
    {
      key: "database",
      label: "Local Directory Store",
      status: database.ok ? "pass" : "fail",
      summary: database.ok ? "Local store is available." : "Local store is not ready yet.",
      detail: database.message,
      action: database.ok ? undefined : "Run the first full sync to initialize the local store."
    } satisfies DiagnosticCheck,
    {
      key: "schema",
      label: "Local Data Schema",
      status: !database.ok ? "info" : database.schemaReady ? "pass" : "fail",
      summary: !database.ok
        ? "Schema check is waiting for the local store to exist."
        : database.schemaReady
          ? "Local data schema is ready."
          : "Local data schema has not been initialized yet.",
      detail: database.schemaMessage,
      action: !database.ok || database.schemaReady ? undefined : "Run the first full sync to initialize the schema."
    } satisfies DiagnosticCheck,
    validateLcrUrl(effectiveEnv.LCR_DIRECTORY_URL),
    ...(await validatePlaywright(effectiveEnv)),
    {
      key: "first_sync",
      label: "First Full Sync",
      status: !database.ok || !database.schemaReady ? "info" : database.firstSyncCompleted ? "pass" : "warn",
      summary: !database.ok || !database.schemaReady
        ? "First sync check is waiting for the local store and schema to be ready."
        : database.firstSyncCompleted
          ? "A successful full directory sync is already recorded."
          : "StakeOS still needs its first successful full directory sync.",
      detail: database.latestSuccessfulSyncAt
        ? `Last successful full sync: ${database.latestSuccessfulSyncAt}`
        : "Run a full sync after setup so the dashboard and MCP have local data to use."
    } satisfies DiagnosticCheck
  ];
  const diagnosticSummary = summarizeDiagnostics(diagnostics);
  const prerequisitesReady =
    isValidLcrUrl(effectiveEnv.LCR_DIRECTORY_URL) &&
    database.schemaReady &&
    diagnostics.every((check) => check.status !== "fail");

  return {
    configPath: getDesktopConfigPath(),
    configExists: existsSync(getDesktopConfigPath()),
    storedConfig,
    effectiveConfig: {
      DATABASE_URL: effectiveEnv.DATABASE_URL || "",
      LCR_DIRECTORY_URL: effectiveEnv.LCR_DIRECTORY_URL || "",
      PLAYWRIGHT_USER_DATA_DIR: effectiveEnv.PLAYWRIGHT_USER_DATA_DIR || "",
      PLAYWRIGHT_HEADLESS: effectiveEnv.PLAYWRIGHT_HEADLESS || "",
      SMTP_HOST: effectiveEnv.SMTP_HOST || "",
      SMTP_PORT: effectiveEnv.SMTP_PORT || "",
      SMTP_SECURE: effectiveEnv.SMTP_SECURE || "",
      SMTP_USER: effectiveEnv.SMTP_USER || "",
      SMTP_PASS: effectiveEnv.SMTP_PASS || "",
      SMTP_FROM: effectiveEnv.SMTP_FROM || "",
      STAKE_NAME: effectiveEnv.STAKE_NAME || "",
      UNIT_NUMBER: effectiveEnv.UNIT_NUMBER || "",
      STAKE_PRESIDENCY_EMAILS: effectiveEnv.STAKE_PRESIDENCY_EMAILS || "",
      STAKE_COUNCIL_EMAILS: effectiveEnv.STAKE_COUNCIL_EMAILS || ""
    },
    status: {
      requiredComplete: missing.length === 0,
      missing,
      database,
      playwrightConfigured: Boolean(effectiveEnv.PLAYWRIGHT_USER_DATA_DIR),
      lcrConfigured: !isMissingValue("LCR_DIRECTORY_URL", effectiveEnv),
      schemaReady: database.schemaReady,
      firstSyncCompleted: database.firstSyncCompleted,
      latestSuccessfulSyncAt: database.latestSuccessfulSyncAt,
      latestSuccessfulSyncType: database.latestSuccessfulSyncType,
      prerequisitesReady,
      diagnostics,
      diagnosticSummary
    }
  };
};
