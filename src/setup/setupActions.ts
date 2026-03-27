import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { ensureSqliteSpikeSchema, getSqliteSpikeDbPath, openSqliteSpikeDb } from "@/src/sqlite/db";
import { installClaudeDesktopMcp } from "@/src/setup/mcpSetup";

const execFileAsync = promisify(execFile);

export type SetupActionKey = "initialize_local_store" | "install_chromium" | "configure_mcp";

const projectRoot = process.env.STAKEOS_PROJECT_ROOT || process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const packagedMode = process.env.STAKEOS_PACKAGED === "1";

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

const initializeLocalStore = async () => {
  const existedBefore = existsSync(getSqliteSpikeDbPath());
  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
  } finally {
    db.close();
  }

  return {
    ok: true,
    message: existedBefore
      ? `Local StakeOS store is ready at ${getSqliteSpikeDbPath()}.`
      : `Local StakeOS store was initialized at ${getSqliteSpikeDbPath()}.`
  };
};

const ensureMcpServerBuild = async () => {
  const distServerPath = `${projectRoot}/dist/server.cjs`;
  if (existsSync(distServerPath)) {
    return;
  }

  if (packagedMode) {
    throw new Error("The packaged StakeOS app is missing dist/server.cjs. Rebuild the desktop app before configuring MCP.");
  }

  await runCommand(npmCommand, ["run", "mcp:build"]);
};

export const runSetupAction = async (action: SetupActionKey) => {
  switch (action) {
    case "initialize_local_store":
      return initializeLocalStore();
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
    case "configure_mcp":
      await ensureMcpServerBuild();
      return installClaudeDesktopMcp();
    default:
      throw new Error("Unsupported setup action.");
  }
};
