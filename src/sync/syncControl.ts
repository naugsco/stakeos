import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

export type SyncJobKind = "full" | "callings";
export type SyncDataSource = "postgres" | "sqlite";

export type SyncLaunchState = {
  source: SyncDataSource;
  kind: SyncJobKind;
  pid: number;
  logFile: string;
  startedAt: string;
};

const projectRoot = process.cwd();
const runDir = path.join(projectRoot, ".run");

const shell = process.platform === "win32" ? "cmd.exe" : "zsh";
const isWindows = process.platform === "win32";

const getStateFilePath = (source: SyncDataSource) => path.join(runDir, `sync-state-${source}.json`);

const getCommandForKind = (kind: SyncJobKind, source: SyncDataSource) => {
  if (source === "sqlite") {
    if (kind === "full") {
      return "npm run sqlite:spike:init && npm run sqlite:spike:sync && npm run sqlite:spike:seed-baseline";
    }

    return "npm run sqlite:spike:init && npm run sqlite:spike:callings";
  }

  if (kind === "full") {
    return "npm run db:migrate && npm run sync:full";
  }

  return "npm run sync:callings";
};

const getLogFileName = (kind: SyncJobKind, source: SyncDataSource) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `web-${source}-${kind}-sync-${timestamp}.log`;
};

const ensureRunDir = () => {
  mkdirSync(runDir, { recursive: true });
};

const isPidRunning = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const isRunDirPath = (filePath: string) => {
  const relativePath = path.relative(runDir, filePath);
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
};

export const isSyncLogPathSafe = (filePath: string) => isRunDirPath(filePath);

export const readSyncLaunchState = (source: SyncDataSource): SyncLaunchState | null => {
  const stateFilePath = getStateFilePath(source);
  if (!existsSync(stateFilePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(stateFilePath, "utf8")) as SyncLaunchState;
  } catch {
    return null;
  }
};

export const writeSyncLaunchState = (state: SyncLaunchState) => {
  ensureRunDir();
  const stateFilePath = getStateFilePath(state.source);
  writeFileSync(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
};

export const clearSyncLaunchState = (source: SyncDataSource) => {
  const stateFilePath = getStateFilePath(source);
  if (existsSync(stateFilePath)) {
    unlinkSync(stateFilePath);
  }
};

export const getActiveSyncLaunchState = (source: SyncDataSource) => {
  const state = readSyncLaunchState(source);
  if (!state) {
    return null;
  }

  if (!isPidRunning(state.pid)) {
    clearSyncLaunchState(source);
    return null;
  }

  return state;
};

export const launchSyncJob = (kind: SyncJobKind, source: SyncDataSource) => {
  ensureRunDir();

  const logFile = path.join(runDir, getLogFileName(kind, source));
  const syncCommand = getCommandForKind(kind, source);
  const shellCommand = isWindows
    ? `cd /d "${projectRoot}" && ( ${syncCommand} ) >> "${logFile}" 2>&1`
    : `cd "${projectRoot}" && ( ${syncCommand} ) >> "${logFile}" 2>&1`;

  const child = spawn(shell, isWindows ? ["/c", shellCommand] : ["-lc", shellCommand], {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore"
  });

  const state: SyncLaunchState = {
    source,
    kind,
    pid: child.pid ?? -1,
    logFile,
    startedAt: new Date().toISOString()
  };

  writeSyncLaunchState(state);
  child.unref();
  return state;
};

export const getLatestSyncLogFile = (source: SyncDataSource) => {
  if (!existsSync(runDir)) {
    return null;
  }

  const logFiles = readdirSync(runDir)
    .filter((fileName) => new RegExp(`^web-${source}-(full|callings)-sync-.*\\.log$`).test(fileName))
    .map((fileName) => path.join(runDir, fileName));

  if (logFiles.length === 0) {
    return null;
  }

  return logFiles
    .map((filePath) => ({ filePath, mtimeMs: getFileTime(filePath) }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0]?.filePath ?? null;
};

const getFileTime = (filePath: string) => {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
};

export const resolveSyncLogFile = (source: SyncDataSource) => {
  const active = getActiveSyncLaunchState(source);
  if (active?.logFile) {
    return active.logFile;
  }

  return getLatestSyncLogFile(source);
};

export const tailSyncLog = (filePath: string, maxLines = 120) => {
  if (!filePath || !isRunDirPath(filePath) || !existsSync(filePath)) {
    return {
      logFile: filePath,
      exists: false,
      tail: ""
    };
  }

  const contents = readFileSync(filePath, "utf8");
  const tail = contents.split(/\r?\n/).slice(-maxLines).join("\n");
  return {
    logFile: filePath,
    exists: true,
    tail
  };
};
