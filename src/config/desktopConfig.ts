import dotenv from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { z } from "zod";

const desktopConfigSchema = z.object({
  DATABASE_URL: z.string().optional(),
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
}

const REQUIRED_FIELDS = ["DATABASE_URL", "LCR_DIRECTORY_URL"] as const;

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

const isValidDatabaseUrl = (value?: string) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return ["postgres:", "postgresql:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

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

  if (key === "DATABASE_URL") {
    return !isValidDatabaseUrl(value);
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

const getEmailConfigured = (effectiveEnv: Record<string, string | undefined>) =>
  Boolean(
    effectiveEnv.SMTP_HOST &&
      effectiveEnv.SMTP_PORT &&
      effectiveEnv.SMTP_FROM &&
      !isPlaceholderValue(effectiveEnv.SMTP_HOST) &&
      !isPlaceholderValue(effectiveEnv.SMTP_USER) &&
      !isPlaceholderValue(effectiveEnv.SMTP_PASS) &&
      !isPlaceholderValue(effectiveEnv.SMTP_FROM)
  );

const summarizeDiagnostics = (checks: DiagnosticCheck[]) => ({
  pass: checks.filter((check) => check.status === "pass").length,
  warn: checks.filter((check) => check.status === "warn").length,
  fail: checks.filter((check) => check.status === "fail").length,
  info: checks.filter((check) => check.status === "info").length
});

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

const validateEmailSettings = (effectiveEnv: Record<string, string | undefined>): DiagnosticCheck => {
  const host = effectiveEnv.SMTP_HOST?.trim();
  const port = effectiveEnv.SMTP_PORT?.trim();
  const from = effectiveEnv.SMTP_FROM?.trim();
  const user = effectiveEnv.SMTP_USER?.trim();
  const pass = effectiveEnv.SMTP_PASS?.trim();

  const configuredCount = [host, port, from, user, pass].filter(Boolean).length;
  if (configuredCount === 0) {
    return {
      key: "smtp",
      label: "SMTP",
      status: "info",
      summary: "Email is optional and not configured.",
      action: "Add SMTP host, port, credentials, and from-address if you want StakeOS to send emails."
    };
  }

  const missing = [
    !host && "SMTP_HOST",
    !port && "SMTP_PORT",
    !from && "SMTP_FROM",
    !user && "SMTP_USER",
    !pass && "SMTP_PASS"
  ].filter(Boolean);

  if (missing.length > 0) {
    return {
      key: "smtp",
      label: "SMTP",
      status: "warn",
      summary: "Email configuration is incomplete.",
      detail: `Missing: ${missing.join(", ")}`,
      action: "Complete all SMTP fields or leave them all blank."
    };
  }

  const parsedPort = Number(port);
  const validPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536;
  const validFrom = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from ?? "");

  if (!validPort || !validFrom || isPlaceholderValue(host) || isPlaceholderValue(user) || isPlaceholderValue(pass) || isPlaceholderValue(from)) {
    return {
      key: "smtp",
      label: "SMTP",
      status: "warn",
      summary: "Email settings exist but still need review.",
      detail: !validPort ? "SMTP port is invalid." : !validFrom ? "SMTP from-address is invalid." : "One or more values still look like placeholders.",
      action: "Confirm the SMTP host, port, credentials, and from-address before using email delivery."
    };
  }

  return {
    key: "smtp",
    label: "SMTP",
    status: "pass",
    summary: "Email settings look complete.",
    detail: `${host}:${port}`
  };
};

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
      action: executablePath ? undefined : "Run `npx playwright install chromium` in the StakeOS repo."
    });
  } catch (error) {
    checks.push({
      key: "playwright_runtime",
      label: "Chromium Runtime",
      status: "fail",
      summary: "Playwright Chromium is not available.",
      detail: error instanceof Error ? error.message : "Chromium executable could not be resolved.",
      action: "Run `npx playwright install chromium` in the StakeOS repo."
    });
  }

  return checks;
};

const testDatabaseConnection = async (databaseUrl?: string) => {
  if (!databaseUrl) {
    return { ok: false, message: "DATABASE_URL is missing." };
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1, idleTimeoutMillis: 2000, connectionTimeoutMillis: 3000 });

  try {
    await pool.query("select 1");
    return { ok: true, message: "Connected" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to connect to PostgreSQL."
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
};

export const getDesktopConfigSnapshot = async () => {
  const storedConfig = loadDesktopConfig();
  const effectiveEnv = getEffectiveDesktopEnv();
  const missing = REQUIRED_FIELDS.filter((key) => isMissingValue(key, effectiveEnv));
  const database = await testDatabaseConnection(effectiveEnv.DATABASE_URL);
  const diagnostics = [
    {
      key: "database",
      label: "PostgreSQL",
      status: database.ok ? "pass" : "fail",
      summary: database.ok ? "Database connection succeeded." : "Database connection failed.",
      detail: database.message,
      action: database.ok ? undefined : "Confirm PostgreSQL is running and DATABASE_URL points to the correct local database."
    } satisfies DiagnosticCheck,
    validateLcrUrl(effectiveEnv.LCR_DIRECTORY_URL),
    ...(await validatePlaywright(effectiveEnv)),
    validateEmailSettings(effectiveEnv)
  ];
  const diagnosticSummary = summarizeDiagnostics(diagnostics);

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
      emailConfigured: getEmailConfigured(effectiveEnv),
      playwrightConfigured: Boolean(effectiveEnv.PLAYWRIGHT_USER_DATA_DIR),
      lcrConfigured: !isMissingValue("LCR_DIRECTORY_URL", effectiveEnv),
      diagnostics,
      diagnosticSummary
    }
  };
};
