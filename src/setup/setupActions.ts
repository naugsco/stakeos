import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Pool } from "pg";

const execFileAsync = promisify(execFile);

export type SetupActionKey = "create_database" | "run_db_migrate" | "install_chromium";

const projectRoot = process.env.STAKEOS_PROJECT_ROOT || process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const packagedMode = process.env.STAKEOS_PACKAGED === "1";

const quoteIdentifier = (identifier: string) => `"${identifier.replace(/"/g, "\"\"")}"`;

const getTargetDatabaseName = (databaseUrl: string) => {
  const parsed = new URL(databaseUrl);
  return decodeURIComponent(parsed.pathname.replace(/^\//, ""));
};

const getAdminDatabaseUrl = (databaseUrl: string) => {
  const parsed = new URL(databaseUrl);
  parsed.pathname = "/postgres";
  return parsed.toString();
};

const createDatabase = async (databaseUrl: string) => {
  const databaseName = getTargetDatabaseName(databaseUrl);
  const adminPool = new Pool({
    connectionString: getAdminDatabaseUrl(databaseUrl),
    max: 1,
    idleTimeoutMillis: 2000,
    connectionTimeoutMillis: 3000
  });

  try {
    const existsResult = await adminPool.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS "exists"`,
      [databaseName]
    );

    if (existsResult.rows[0]?.exists) {
      return {
        ok: true,
        message: `Database "${databaseName}" already exists.`
      };
    }

    await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    return {
      ok: true,
      message: `Database "${databaseName}" created.`
    };
  } finally {
    await adminPool.end().catch(() => undefined);
  }
};

const runCommand = async (command: string, args: string[]) => {
  const result = await execFileAsync(command, args, {
    cwd: projectRoot,
    timeout: 10 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024
  });

  return {
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? ""
  };
};

const runBundledNodeCommand = async (scriptPath: string, args: string[] = []) => {
  const result = await execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    timeout: 10 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      STAKEOS_PACKAGED: "1",
      STAKEOS_PROJECT_ROOT: projectRoot
    }
  });

  return {
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? ""
  };
};

export const runSetupAction = async (action: SetupActionKey, databaseUrl?: string) => {
  switch (action) {
    case "create_database":
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is required to create the target database.");
      }
      return createDatabase(databaseUrl);
    case "run_db_migrate": {
      const result = packagedMode
        ? await runBundledNodeCommand(`${projectRoot}/dist/db/migrate.cjs`)
        : await runCommand(npmCommand, ["run", "db:migrate"]);
      return {
        ok: true,
        message: "StakeOS database migrations completed.",
        output: `${result.stdout}\n${result.stderr}`.trim()
      };
    }
    case "install_chromium": {
      const result = packagedMode
        ? await runBundledNodeCommand(`${projectRoot}/node_modules/playwright/cli.js`, ["install", "chromium"])
        : await runCommand(npxCommand, ["playwright", "install", "chromium"]);
      return {
        ok: true,
        message: "Playwright Chromium installation completed.",
        output: `${result.stdout}\n${result.stderr}`.trim()
      };
    }
    default:
      throw new Error("Unsupported setup action.");
  }
};
