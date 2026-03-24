import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { loadDesktopConfig } from "@/src/config/desktopConfig";

const loadEnv = () => {
  const entry = process.argv[1] ? resolve(process.argv[1]) : "";
  const cwdEnv = resolve(process.cwd(), ".env");
  const distAdjacentEnv = entry ? resolve(dirname(entry), "..", ".env") : "";
  const srcAdjacentEnv = entry ? resolve(dirname(entry), "..", "..", ".env") : "";

  const candidates = Array.from(new Set([cwdEnv, distAdjacentEnv, srcAdjacentEnv].filter(Boolean)));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
  }

  dotenv.config();
};

loadEnv();

const effectiveProcessEnv = {
  ...process.env,
  ...loadDesktopConfig()
};

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(emptyStringToUndefined, z.string().min(1).default("postgresql://localhost:5432/stakeos")),
  PLAYWRIGHT_USER_DATA_DIR: z.string().default(".playwright/profile"),
  PLAYWRIGHT_HEADLESS: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  LCR_DIRECTORY_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-details/YOUR-REPORT-ID")
  ),
  LCR_TIMEOUT_MS: z
    .string()
    .default("180000")
    .transform((value) => Number.parseInt(value, 10)),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined)),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  STAKE_NAME: z.string().default("StakeOS Stake"),
  UNIT_NUMBER: z.string().default("000000"),
  STAKE_PRESIDENCY_EMAILS: z.string().optional(),
  STAKE_COUNCIL_EMAILS: z.string().optional()
});

export const env = envSchema.parse(effectiveProcessEnv);

export const splitEmails = (value?: string): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};
