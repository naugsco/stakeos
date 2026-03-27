import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

type ClaudeDesktopConfig = {
  mcpServers?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  [key: string]: unknown;
};

export type MpcCommandSpec = {
  executablePath: string;
  serverPath: string;
  projectRoot: string;
  packagedMode: boolean;
};

export type ClaudeDesktopMcpStatus = {
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

const getStakeosSupportDir = () => {
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

export const getClaudeDesktopConfigPath = () => {
  const override = process.env.STAKEOS_CLAUDE_CONFIG_PATH?.trim();
  if (override) {
    return path.resolve(override);
  }

  const home = os.homedir();
  switch (process.platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
    case "win32":
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
    default:
      return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "Claude", "claude_desktop_config.json");
  }
};

const getMcpLauncherPath = () => {
  const override = process.env.STAKEOS_MCP_LAUNCHER_PATH?.trim();
  if (override) {
    return path.resolve(override);
  }

  const launcherDir = path.join(getStakeosSupportDir(), "mcp");
  const fileName = process.platform === "win32" ? "stakeos-mcp.cmd" : "stakeos-mcp";
  return path.join(launcherDir, fileName);
};

const getProjectRoot = () => {
  const configured = process.env.STAKEOS_PROJECT_ROOT?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd());
};

const getCandidateServerPaths = () => {
  const projectRoot = getProjectRoot();
  const entryDir = process.argv[1] ? path.dirname(path.resolve(process.argv[1])) : projectRoot;

  return [
    path.join(projectRoot, "dist", "server.cjs"),
    path.join(projectRoot, "dist", "mcp", "server.cjs"),
    path.join(entryDir, "server.cjs"),
    path.join(entryDir, "mcp", "server.cjs"),
    path.join(entryDir, "..", "dist", "server.cjs"),
    path.join(entryDir, "..", "dist", "mcp", "server.cjs")
  ];
};

export const getMcpCommandSpec = (): MpcCommandSpec => {
  const serverPath = getCandidateServerPaths().find((candidate) => existsSync(candidate));
  if (!serverPath) {
    throw new Error("StakeOS MCP server build artifact was not found. Build the MCP server first.");
  }

  return {
    executablePath: process.execPath,
    serverPath,
    projectRoot: getProjectRoot(),
    packagedMode: process.env.STAKEOS_PACKAGED === "1"
  };
};

const readClaudeDesktopConfig = (configPath: string): ClaudeDesktopConfig => {
  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8")) as ClaudeDesktopConfig;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeMcpLauncher = (spec: MpcCommandSpec, launcherPath: string) => {
  mkdirSync(path.dirname(launcherPath), { recursive: true });

  if (process.platform === "win32") {
    const lines = [
      "@echo off",
      `set STAKEOS_PROJECT_ROOT=${spec.projectRoot}`,
      ...(spec.packagedMode ? ["set ELECTRON_RUN_AS_NODE=1", "set STAKEOS_PACKAGED=1"] : []),
      `"${spec.executablePath}" "${spec.serverPath}" %*`
    ];
    writeFileSync(launcherPath, `${lines.join("\r\n")}\r\n`, "utf8");
    return;
  }

  const lines = [
    "#!/bin/sh",
    "set -e",
    `export STAKEOS_PROJECT_ROOT=${JSON.stringify(spec.projectRoot)}`,
    ...(spec.packagedMode ? ["export ELECTRON_RUN_AS_NODE=1", "export STAKEOS_PACKAGED=1"] : []),
    `exec ${JSON.stringify(spec.executablePath)} ${JSON.stringify(spec.serverPath)} "$@"`
  ];

  writeFileSync(launcherPath, `${lines.join("\n")}\n`, "utf8");
  chmodSync(launcherPath, 0o755);
};

export const getClaudeDesktopMcpStatus = (): ClaudeDesktopMcpStatus => {
  const configPath = getClaudeDesktopConfigPath();
  const launcherPath = getMcpLauncherPath();
  const launcherExists = existsSync(launcherPath);
  const configExists = existsSync(configPath);

  let serverPath: string | null = null;
  let serverExists = false;
  try {
    const spec = getMcpCommandSpec();
    serverPath = spec.serverPath;
    serverExists = true;
  } catch {}

  const config = readClaudeDesktopConfig(configPath);
  const existingEntry = (config.mcpServers as Record<string, unknown> | undefined)?.stakeos as
    | { command?: string; args?: unknown[] }
    | undefined;

  const configured = Boolean(existingEntry);
  const matchesExpected = configured && existingEntry?.command === launcherPath;

  let detail = "Claude Desktop MCP is not configured yet.";
  if (!configExists) {
    detail = "Claude Desktop config file does not exist yet. StakeOS can create it.";
  } else if (!configured) {
    detail = "Claude Desktop config exists, but StakeOS is not registered as an MCP server.";
  } else if (!matchesExpected) {
    detail = "StakeOS MCP is configured, but it does not match the current launcher path.";
  } else {
    detail = "StakeOS MCP is configured in Claude Desktop.";
  }

  return {
    configPath,
    configExists,
    launcherPath,
    launcherExists,
    serverPath,
    serverExists,
    configured,
    matchesExpected,
    detail
  };
};

export const installClaudeDesktopMcp = () => {
  const spec = getMcpCommandSpec();
  const configPath = getClaudeDesktopConfigPath();
  const launcherPath = getMcpLauncherPath();

  writeMcpLauncher(spec, launcherPath);

  mkdirSync(path.dirname(configPath), { recursive: true });
  if (existsSync(configPath)) {
    const backupPath = `${configPath}.bak`;
    copyFileSync(configPath, backupPath);
  }

  const config = readClaudeDesktopConfig(configPath);
  const nextConfig: ClaudeDesktopConfig = {
    ...config,
    mcpServers: {
      ...(config.mcpServers && typeof config.mcpServers === "object" ? config.mcpServers : {}),
      stakeos: {
        command: launcherPath,
        args: []
      }
    }
  };

  writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");

  return {
    ok: true,
    message: "StakeOS MCP was registered in Claude Desktop. Fully restart Claude Desktop to load the new server.",
    configPath,
    launcherPath,
    serverPath: spec.serverPath
  };
};
