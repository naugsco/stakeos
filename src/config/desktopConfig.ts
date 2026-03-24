import dotenv from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { z } from "zod";

const desktopConfigSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  LCR_DIRECTORY_URL: z.string().min(1).optional(),
  PLAYWRIGHT_USER_DATA_DIR: z.string().min(1).optional(),
  PLAYWRIGHT_HEADLESS: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().min(1).optional(),
  SMTP_SECURE: z.string().min(1).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
  STAKE_NAME: z.string().min(1).optional(),
  UNIT_NUMBER: z.string().min(1).optional(),
  STAKE_PRESIDENCY_EMAILS: z.string().min(1).optional(),
  STAKE_COUNCIL_EMAILS: z.string().min(1).optional()
});

export type DesktopConfig = z.infer<typeof desktopConfigSchema>;

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
    .filter(([, value]) => Boolean(value));

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

const isMissingValue = (key: typeof REQUIRED_FIELDS[number], effectiveEnv: Record<string, string | undefined>) => {
  const value = effectiveEnv[key]?.trim();
  if (!value) {
    return true;
  }

  if (key === "LCR_DIRECTORY_URL" && value.includes("YOUR-REPORT-ID")) {
    return true;
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
      lcrConfigured: !isMissingValue("LCR_DIRECTORY_URL", effectiveEnv)
    }
  };
};
