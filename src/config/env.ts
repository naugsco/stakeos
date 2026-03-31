import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  getDefaultPlaywrightBrowsersPath,
  getDefaultPlaywrightProfileDir,
  loadDesktopConfig
} from "@/src/config/desktopConfig";

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
  SQLITE_DB_PATH: z.string().optional(),
  PLAYWRIGHT_USER_DATA_DIR: z.string().default(getDefaultPlaywrightProfileDir()),
  PLAYWRIGHT_BROWSERS_PATH: z.string().default(getDefaultPlaywrightBrowsersPath()),
  PLAYWRIGHT_HEADLESS: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  LCR_DIRECTORY_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default("https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-details/YOUR-REPORT-ID")
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
  STAKE_COUNCIL_EMAILS: z.string().optional(),
  HIGH_COUNCIL_EMAILS: z.string().optional(),
  STAKE_RELIEF_SOCIETY_EMAILS: z.string().optional(),
  STAKE_YOUNG_WOMEN_EMAILS: z.string().optional(),
  STAKE_PRIMARY_EMAILS: z.string().optional(),
  STAKE_SUNDAY_SCHOOL_EMAILS: z.string().optional(),
  RECIPIENTS_ALL_CALLINGS: z.string().optional(),
  RECIPIENTS_ALL_BISHOPS: z.string().optional(),
  RECIPIENTS_ALL_BISHOPRICS: z.string().optional(),
  RECIPIENTS_ALL_CLERKS: z.string().optional(),
  RECIPIENTS_ALL_EXECUTIVE_SECRETARIES: z.string().optional(),
  RECIPIENTS_ALL_ORGANIZATION_PRESIDENCIES: z.string().optional(),
  RECIPIENTS_ALL_ELDERS_QUORUM_PRESIDENCIES: z.string().optional(),
  RECIPIENTS_ALL_RELIEF_SOCIETY_PRESIDENCIES: z.string().optional(),
  RECIPIENTS_ALL_YOUNG_WOMEN_PRESIDENCIES: z.string().optional(),
  RECIPIENTS_ALL_SUNDAY_SCHOOL_PRESIDENCIES: z.string().optional(),
  RECIPIENTS_ALL_PRIMARY_PRESIDENCIES: z.string().optional(),
  RECIPIENTS_ALL_WARD_MISSION_LEADERS: z.string().optional(),
  RECIPIENTS_ALL_WARD_COUNCILS: z.string().optional(),
  RECIPIENTS_ALL_WARD_YSA_LEADERS: z.string().optional(),
  RECIPIENTS_ALL_TEMPLE_FAMILY_HISTORY_LEADERS: z.string().optional(),
  RECIPIENTS_ALL_MEMBERS: z.string().optional(),
  RECIPIENTS_ALL_ADULT_MEMBERS: z.string().optional(),
  RECIPIENTS_ALL_MEN: z.string().optional(),
  RECIPIENTS_ALL_WOMEN: z.string().optional(),
  RECIPIENTS_ALL_MELCHIZEDEK_PRIESTHOOD_HOLDERS: z.string().optional(),
  RECIPIENTS_SINGLE_ADULTS: z.string().optional(),
  RECIPIENTS_YOUNG_SINGLE_ADULTS: z.string().optional(),
  RECIPIENTS_YOUNG_MEN: z.string().optional(),
  RECIPIENTS_YOUNG_WOMEN: z.string().optional(),
  RECIPIENTS_PARENTS_OF_YOUNG_MEN: z.string().optional(),
  RECIPIENTS_PARENTS_OF_YOUNG_WOMEN: z.string().optional(),
  RECIPIENTS_PARENTS_OF_PRIMARY_CHILDREN: z.string().optional(),
  RECIPIENTS_FULL_TIME_MISSIONARIES: z.string().optional()
});

export const env = envSchema.parse(effectiveProcessEnv);

process.env.PLAYWRIGHT_USER_DATA_DIR = env.PLAYWRIGHT_USER_DATA_DIR;
process.env.PLAYWRIGHT_BROWSERS_PATH = env.PLAYWRIGHT_BROWSERS_PATH;

export const splitEmails = (value?: string): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};
