import { spawn, type ChildProcess } from "node:child_process";
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

export type SyncJobKind = "full" | "callings";

export type SyncLaunchState = {
  kind: SyncJobKind;
  pid: number;
  logFile: string;
  startedAt: string;
};

const projectRoot = process.cwd();
const runDir = path.join(projectRoot, ".run");

const shell = process.platform === "win32" ? "cmd.exe" : "zsh";
const isWindows = process.platform === "win32";
const isPackagedRuntime = process.env.STAKEOS_PACKAGED === "1";

const stateFilePath = path.join(runDir, "sync-state.json");

const quoteArg = (value: string) => {
  if (isWindows) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return `'${value.replace(/'/g, `'\\''`)}'`;
};

const getPackagedScriptPath = (scriptName: string) => {
  const scriptPath = path.join(projectRoot, "dist", "sqlite", scriptName);
  if (!existsSync(scriptPath)) {
    throw new Error(`Packaged sync script not found: ${scriptPath}`);
  }
  return scriptPath;
};

const getCommandForKind = (kind: SyncJobKind) => {
  if (isPackagedRuntime) {
    return null;
  }

  if (kind === "full") {
    return "npm run sqlite:init && npm run sqlite:sync && npm run sqlite:seed-baseline";
  }

  return "npm run sqlite:init && npm run sqlite:callings";
};

const getLogFileName = (kind: SyncJobKind) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `web-sqlite-${kind}-sync-${timestamp}.log`;
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

export const readSyncLaunchState = (): SyncLaunchState | null => {
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
  writeFileSync(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
};

export const clearSyncLaunchState = () => {
  if (existsSync(stateFilePath)) {
    unlinkSync(stateFilePath);
  }
};

export const getActiveSyncLaunchState = () => {
  const state = readSyncLaunchState();
  if (!state) {
    return null;
  }

  if (!isPidRunning(state.pid)) {
    clearSyncLaunchState();
    return null;
  }

  return state;
};

export const launchSyncJob = (kind: SyncJobKind) => {
  ensureRunDir();

  const logFile = path.join(runDir, getLogFileName(kind));
  let child: ChildProcess;

  if (isPackagedRuntime) {
    const runnerPath = getPackagedScriptPath("runSyncJob.cjs");
    child = spawn(process.execPath, [runnerPath, kind], {
      cwd: projectRoot,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        STAKEOS_PACKAGED: "1",
        STAKEOS_PROJECT_ROOT: projectRoot
      }
    });

    const logStream = createWriteStream(logFile, { flags: "a" });
    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);
  } else {
    const syncCommand = getCommandForKind(kind);
    if (!syncCommand) {
      throw new Error(`No sync command is defined for the ${kind} job.`);
    }

    // The log is wired up with real file descriptors instead of the shell's
    // `>> file 2>&1`. The shell form needs a quoted path inside the command, and on
    // Windows Node escapes those quotes as \" when it builds the command line, which
    // cmd.exe reads literally: the redirect target is invalid and cmd dies before it
    // runs anything. Handing cmd a command with no quotes to mangle avoids that
    // entirely, and pointing stdout and stderr at one descriptor keeps the single
    // merged log. `cwd` below replaces the old `cd` prefix.
    const logFd = openSync(logFile, "a");

    try {
      child = spawn(shell, isWindows ? ["/c", syncCommand] : ["-lc", syncCommand], {
        cwd: projectRoot,
        // Windows: a cmd.exe started with DETACHED_PROCESS has no console, so the
        // console programs it launches are given a fresh one and write there rather
        // than to the handles they inherited - the log file is created and then stays
        // empty. The child still outlives this request without it, because Windows
        // does not tie a child's lifetime to its parent. zsh has no such problem.
        detached: !isWindows,
        stdio: ["ignore", logFd, logFd],
        windowsVerbatimArguments: isWindows,
        env: {
          ...process.env
        }
      });
    } finally {
      // The child holds its own duplicate of the descriptor.
      closeSync(logFd);
    }

    child.unref();
  }

  // A failed spawn reports asynchronously. Without a listener the error is unhandled and the
  // caller is told the sync started, so record it in the log the UI already surfaces.
  child.on("error", (error) => {
    try {
      writeFileSync(logFile, `Failed to launch ${kind} sync: ${error.message}\n`, { flag: "a" });
    } catch {
      // The log is best-effort; never mask the original failure.
    }
    clearSyncLaunchState();
  });

  if (typeof child.pid !== "number") {
    clearSyncLaunchState();
    throw new Error(`The ${kind} sync process could not be started.`);
  }

  const state: SyncLaunchState = {
    kind,
    pid: child.pid,
    logFile,
    startedAt: new Date().toISOString()
  };

  writeSyncLaunchState(state);
  child.unref();
  return state;
};

export const getLatestSyncLogFile = () => {
  if (!existsSync(runDir)) {
    return null;
  }

  const logFiles = readdirSync(runDir)
    .filter((fileName) => /^web-sqlite-(full|callings)-sync-.*\.log$/.test(fileName))
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

export const resolveSyncLogFile = () => {
  const active = getActiveSyncLaunchState();
  if (active?.logFile) {
    return active.logFile;
  }

  return getLatestSyncLogFile();
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
