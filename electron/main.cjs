const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const dotenv = require('dotenv');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RUNTIME_ROOT = app.getPath('userData');
const RUN_DIR = path.join(RUNTIME_ROOT, '.run');
const PACKAGED_MODE = app.isPackaged || process.env.STAKEOS_PACKAGED === '1';
const DESKTOP_PORT = process.env.STAKEOS_DESKTOP_PORT || '3232';
const CONTROL_PORT = process.env.STAKEOS_CONTROL_PORT || '3233';
const BASE_URL = `http://127.0.0.1:${DESKTOP_PORT}`;
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const APP_ICON = [
  path.join(PROJECT_ROOT, 'StakeOS.png'),
  path.join(PROJECT_ROOT, 'stakeos.png'),
  path.join(process.resourcesPath || '', 'StakeOS.png'),
  path.join(process.resourcesPath || '', 'stakeos.png'),
].find((filePath) => fs.existsSync(filePath));
const DESKTOP_CONFIG_PATH = (() => {
  const home = require('node:os').homedir();
  switch (process.platform) {
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', 'StakeOS', 'config.json');
    case 'win32':
      return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'StakeOS', 'config.json');
    default:
      return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'StakeOS', 'config.json');
  }
})();

let mainWindow = null;
let splashWindow = null;
let nextProcess = null;
let managedNextProcess = false;
let quitting = false;
let relaunchRequested = false;
let controlServer = null;
let restartingServer = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

function readDesktopConfig() {
  if (!fs.existsSync(DESKTOP_CONFIG_PATH)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(DESKTOP_CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function readProjectEnvConfig() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  try {
    return dotenv.parse(fs.readFileSync(envPath, 'utf8'));
  } catch {
    return {};
  }
}

function getInitialDesktopRoute() {
  const effectiveConfig = {
    ...readProjectEnvConfig(),
    ...process.env,
    ...readDesktopConfig(),
  };

  const lcrUrl = `${effectiveConfig.LCR_DIRECTORY_URL || ''}`.trim();
  const hasValidLcrUrl = (() => {
    if (!lcrUrl || lcrUrl.includes('YOUR-REPORT-ID')) {
      return false;
    }

    try {
      const parsed = new URL(lcrUrl);
      return parsed.hostname === 'lcr.churchofjesuschrist.org' && /\/mlt\/report\//.test(parsed.pathname);
    } catch {
      return false;
    }
  })();
  return hasValidLcrUrl ? '/dashboard' : '/settings?setup=1';
}

async function resolveStartupRoute() {
  try {
    const response = await fetch(`${BASE_URL}/api/desktop-config`, { cache: 'no-store' });
    if (!response.ok) {
      return getInitialDesktopRoute();
    }

    const snapshot = await response.json();
    return snapshot?.status?.setupComplete ? '/dashboard' : '/settings?setup=1';
  } catch {
    return getInitialDesktopRoute();
  }
}

function ensureRunDir() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
}

function appendLog(fileName, message) {
  ensureRunDir();
  fs.appendFileSync(path.join(RUN_DIR, fileName), `${new Date().toISOString()} ${message}\n`);
}

function readJsonRequestBody(request) {
  return new Promise((resolve) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    request.on('error', () => resolve({}));
  });
}

function startControlServer() {
  if (controlServer) {
    return;
  }

  controlServer = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.url === '/status' && request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify({
          ok: true,
          available: true,
          desktopPort: DESKTOP_PORT,
          controlPort: CONTROL_PORT,
          managedNextProcess,
          hasWindow: Boolean(mainWindow && !mainWindow.isDestroyed())
        }),
      );
      return;
    }

    if (request.url === '/restart' && request.method === 'POST') {
      void readJsonRequestBody(request).then((body) => {
        const route = typeof body?.route === 'string' ? body.route : undefined;
        response.writeHead(202, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: true, restarting: true, mode: 'server' }));
        setTimeout(() => {
          restartStakeosServer(route).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            appendLog('desktop-shell.log', `Server restart failed: ${message}`);
            dialog.showErrorBox('StakeOS Desktop', `StakeOS could not restart its local server.\n\n${message}`);
          });
        }, 150);
      });
      return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: false, error: 'Not found.' }));
  });

  controlServer.listen(Number(CONTROL_PORT), '127.0.0.1', () => {
    appendLog('desktop-shell.log', `Desktop control server ready on http://127.0.0.1:${CONTROL_PORT}`);
  });
}

async function stopControlServer() {
  if (!controlServer) {
    return;
  }

  await new Promise((resolve) => controlServer.close(() => resolve()));
  controlServer = null;
}

function updateSplashStatus(message) {
  appendLog('desktop-shell.log', message);
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript(
      `window.__setStatus && window.__setStatus(${JSON.stringify(message)});`,
    ).catch(() => {});
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 320,
    frame: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: true,
    backgroundColor: '#f8f4ea',
    icon: APP_ICON,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  const splashHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>StakeOS</title>
        <style>
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background:
              radial-gradient(circle at top left, rgba(15,118,110,0.12), transparent 34%),
              radial-gradient(circle at bottom right, rgba(245,158,11,0.12), transparent 32%),
              linear-gradient(180deg, #fffdf8 0%, #f6f0e4 100%);
            color: #1f2937;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
          }
          .shell {
            position: relative;
            z-index: 2;
            width: 420px;
            padding: 32px 32px 28px;
            border: 1px solid rgba(149, 123, 79, 0.18);
            border-radius: 30px;
            background: rgba(255, 252, 246, 0.96);
            box-shadow:
              0 24px 70px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255,255,255,0.7);
            backdrop-filter: blur(14px);
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
          }
          .mark {
            width: 58px;
            height: 58px;
            border-radius: 20px;
            background:
              linear-gradient(145deg, rgba(15,118,110,0.16), rgba(245,158,11,0.12)),
              #fff;
            border: 1px solid rgba(15,118,110,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
            font-size: 24px;
            font-weight: 700;
            color: #0f766e;
          }
          .eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #0f766e;
            margin-bottom: 7px;
          }
          h1 {
            font-size: 31px;
            line-height: 1.04;
            margin: 0;
            font-family: "Iowan Old Style", "Palatino Linotype", serif;
          }
          .lead {
            font-size: 14px;
            line-height: 1.6;
            color: #64748b;
            margin: 0 0 18px;
          }
          .status {
            min-height: 62px;
            padding: 15px 16px;
            border-radius: 20px;
            border: 1px solid rgba(15,118,110,0.12);
            background: rgba(255,255,255,0.74);
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
          }
          .substatus {
            margin-top: 6px;
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
          }
          .bar {
            margin-top: 18px;
            height: 8px;
            border-radius: 999px;
            overflow: hidden;
            background: rgba(215, 207, 190, 0.72);
            position: relative;
          }
          .bar::after {
            content: '';
            display: block;
            height: 100%;
            width: 32%;
            border-radius: 999px;
            background: linear-gradient(90deg, #0f766e 0%, #f59e0b 100%);
            animation: pulse 1.9s ease-in-out infinite;
          }
          .dots {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            color: #64748b;
            font-size: 12px;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #cbd5e1;
            animation: blink 1.4s ease-in-out infinite;
          }
          .dot:nth-child(2) { animation-delay: 0.2s; }
          .dot:nth-child(3) { animation-delay: 0.4s; }
          .foot {
            margin-top: 12px;
            font-size: 11px;
            color: #64748b;
          }
          @keyframes pulse {
            0% { transform: translateX(-18%); width: 28%; }
            50% { transform: translateX(95%); width: 42%; }
            100% { transform: translateX(-18%); width: 28%; }
          }
          @keyframes blink {
            0%, 80%, 100% { transform: scale(0.9); opacity: 0.35; }
            40% { transform: scale(1); opacity: 1; background: #0f766e; }
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="brand">
            <div class="mark">S</div>
            <div>
              <div class="eyebrow">StakeOS Desktop</div>
              <h1>Launching StakeOS</h1>
            </div>
          </div>
          <p class="lead">Preparing the local dashboard and checking the runtime needed for your next sync.</p>
          <div id="status" class="status">
            Preparing application shell...
            <div class="substatus">StakeOS is checking local files and starting the internal server.</div>
          </div>
          <div class="bar"></div>
          <div class="dots" aria-hidden="true">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div class="foot">Private local data. Manual LCR login when sync runs.</div>
        </div>
        <script>
          window.__setStatus = (message) => {
            const statusEl = document.getElementById('status');
            statusEl.innerHTML = message + '<div class="substatus">StakeOS stays local on this Mac and uses your existing browser session for LCR.</div>';
          };
        </script>
      </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    backgroundColor: '#f8f4ea',
    title: 'StakeOS',
    icon: APP_ICON,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  const revealMainWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  };

  mainWindow.once('ready-to-show', revealMainWindow);
  mainWindow.webContents.once('did-finish-load', revealMainWindow);
  setTimeout(revealMainWindow, 5000);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(BASE_URL)) {
      return { action: 'allow' };
    }
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(BASE_URL)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function httpRequestText(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({ statusCode: response.statusCode || 0, body });
      });
    });

    request.on('error', reject);
    request.setTimeout(2000, () => request.destroy(new Error('timeout')));
  });
}

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: Number(port) });

    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function getListeningPidForPort(port) {
  try {
    const output = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).trim();
    return output.split('\n').map((entry) => entry.trim()).find(Boolean) || null;
  } catch {
    return null;
  }
}

function getWorkingDirectoryForPid(pid) {
  try {
    return execFileSync('lsof', ['-p', `${pid}`], { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.includes(' cwd '))
      ?.split(/\s+/)
      .at(-1) || null;
  } catch {
    return null;
  }
}

function isStakeosServerPid(pid) {
  if (!pid) {
    return false;
  }

  return getWorkingDirectoryForPid(pid) === PROJECT_ROOT;
}

function killPid(pid) {
  try {
    process.kill(Number(pid), 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function getFileMtimeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function getLatestMtimeMs(targetPath) {
  try {
    const stat = fs.statSync(targetPath);

    if (stat.isFile()) {
      return stat.mtimeMs;
    }

    if (!stat.isDirectory()) {
      return 0;
    }

    let latest = stat.mtimeMs;
    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      if (entry.name === '.DS_Store' || entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
        continue;
      }

      latest = Math.max(latest, getLatestMtimeMs(path.join(targetPath, entry.name)));
    }

    return latest;
  } catch {
    return 0;
  }
}

function shouldRebuildArtifacts() {
  if (PACKAGED_MODE) {
    return false;
  }

  const nextBuildIdPath = path.join(PROJECT_ROOT, '.next', 'BUILD_ID');
  const backendServerPath = path.join(PROJECT_ROOT, 'dist', 'server.cjs');

  if (!fs.existsSync(nextBuildIdPath) || !fs.existsSync(backendServerPath)) {
    return true;
  }

  const oldestArtifactTime = Math.min(
    getFileMtimeMs(nextBuildIdPath),
    getFileMtimeMs(backendServerPath),
  );

  const sourceTargets = [
    path.join(PROJECT_ROOT, 'app'),
    path.join(PROJECT_ROOT, 'components'),
    path.join(PROJECT_ROOT, 'src'),
    path.join(PROJECT_ROOT, 'electron'),
    path.join(PROJECT_ROOT, 'package.json'),
    path.join(PROJECT_ROOT, 'package-lock.json'),
    path.join(PROJECT_ROOT, 'tsconfig.json'),
    path.join(PROJECT_ROOT, 'next.config.js'),
    path.join(PROJECT_ROOT, 'next.config.mjs'),
    path.join(PROJECT_ROOT, 'tailwind.config.js'),
    path.join(PROJECT_ROOT, 'postcss.config.js'),
    path.join(PROJECT_ROOT, '.env'),
  ];

  const newestSourceTime = sourceTargets.reduce(
    (latest, targetPath) => Math.max(latest, getLatestMtimeMs(targetPath)),
    0,
  );

  return newestSourceTime > oldestArtifactTime;
}

async function isServerHealthy() {
  try {
    const health = await httpRequestText(`${BASE_URL}/api/health`);
    if (health.statusCode !== 200 || !health.body) {
      return false;
    }
    return health.body.includes('"ok":true');
  } catch {
    return false;
  }
}

function runCommand(args, label) {
  updateSplashStatus(label);
  return new Promise((resolve, reject) => {
    const child = spawn(NPM_CMD, args, {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stdout.on('data', (chunk) => appendLog('desktop-shell.log', chunk.toString().trimEnd()));
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      appendLog('desktop-shell.log', text.trimEnd());
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}.\n${stderr}`));
    });
  });
}

function getPackagedNodeEntry(scriptPath, args = []) {
  return {
    command: process.execPath,
    args: [scriptPath, ...args],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      STAKEOS_PACKAGED: '1',
      STAKEOS_PROJECT_ROOT: PROJECT_ROOT,
    },
  };
}

function getNextStartCommand() {
  if (PACKAGED_MODE) {
    return getPackagedNodeEntry(
      path.join(PROJECT_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'),
      ['start', '--port', DESKTOP_PORT],
    );
  }

  return {
    command: NPM_CMD,
    args: ['run', 'start', '--', '--port', DESKTOP_PORT],
    env: process.env,
  };
}

function startManagedNextServer() {
  updateSplashStatus('Starting local StakeOS server...');
  ensureRunDir();
  const logStream = fs.createWriteStream(path.join(RUN_DIR, 'desktop-next.log'), { flags: 'a' });
  const nextCommand = getNextStartCommand();
  nextProcess = spawn(nextCommand.command, nextCommand.args, {
    cwd: PROJECT_ROOT,
    env: {
      ...nextCommand.env,
      PORT: DESKTOP_PORT,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  managedNextProcess = true;

  nextProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    logStream.write(text);
    appendLog('desktop-shell.log', text.trimEnd());
  });
  nextProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    logStream.write(text);
    appendLog('desktop-shell.log', text.trimEnd());
  });
  nextProcess.on('exit', (code, signal) => {
    appendLog('desktop-shell.log', `Next server exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    logStream.end();
    nextProcess = null;
    managedNextProcess = false;
    if (!quitting && !restartingServer && mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox(
        'StakeOS Desktop',
        'The local StakeOS server stopped unexpectedly. Check .run/desktop-next.log for details.',
      );
    }
  });
}

async function waitForServerReady(timeoutMs = 90000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerHealthy()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Timed out waiting for StakeOS to become ready.');
}

async function waitForPortClosed(port, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!(await isPortListening(port))) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for port ${port} to close.`);
}

function getCurrentAppRoute() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return getInitialDesktopRoute();
  }

  try {
    const currentUrl = new URL(mainWindow.webContents.getURL());
    if (currentUrl.origin === BASE_URL) {
      if (currentUrl.pathname === '/settings' && currentUrl.search.includes('setup=1')) {
        const initialRoute = getInitialDesktopRoute();
        if (initialRoute === '/dashboard') {
          return initialRoute;
        }
      }
      return `${currentUrl.pathname}${currentUrl.search}`;
    }
  } catch {
    // fall through
  }

  return getInitialDesktopRoute();
}

async function ensureStakeosReady() {
  const rebuildNeeded = shouldRebuildArtifacts();

  if (await isServerHealthy()) {
    if (!rebuildNeeded) {
      updateSplashStatus('Using existing local StakeOS server...');
      return;
    }

    updateSplashStatus('Source changes detected. Refreshing StakeOS desktop...');
    await stopExistingStakeosServerOnDesktopPort();
  }

  if (await isPortListening(DESKTOP_PORT)) {
    const existingPid = getListeningPidForPort(DESKTOP_PORT);

    if (existingPid && isStakeosServerPid(existingPid)) {
      updateSplashStatus(rebuildNeeded ? 'Restarting local StakeOS server for updated code...' : 'Stopping stale local StakeOS server...');
      killPid(existingPid);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } else {
      updateSplashStatus('Reusing existing local StakeOS server...');
      try {
        await waitForServerReady(5000);
        return;
      } catch {
        throw new Error(
          `Port ${DESKTOP_PORT} is already in use by another process. Close the existing StakeOS server or change STAKEOS_DESKTOP_PORT.`,
        );
      }
    }
  }

  await ensureBuildArtifacts();

  if (await isServerHealthy()) {
    updateSplashStatus('Using existing local StakeOS server...');
    return;
  }

  if (await isPortListening(DESKTOP_PORT)) {
    const existingPid = getListeningPidForPort(DESKTOP_PORT);

    if (existingPid && isStakeosServerPid(existingPid)) {
      updateSplashStatus('Stopping stale local StakeOS server...');
      killPid(existingPid);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } else {
      updateSplashStatus('Reusing existing local StakeOS server...');
      try {
        await waitForServerReady(5000);
        return;
      } catch {
        throw new Error(
          `Port ${DESKTOP_PORT} is already in use by another process. Close the existing StakeOS server or change STAKEOS_DESKTOP_PORT.`,
        );
      }
    }
  }

  startManagedNextServer();
  await waitForServerReady();
}

async function stopExistingStakeosServerOnDesktopPort() {
  if (managedNextProcess && nextProcess && !nextProcess.killed) {
    await shutdownManagedNext();
    await waitForPortClosed(DESKTOP_PORT);
    return;
  }

  const existingPid = getListeningPidForPort(DESKTOP_PORT);
  if (!existingPid) {
    return;
  }

  if (!isStakeosServerPid(existingPid)) {
    throw new Error(
      `Port ${DESKTOP_PORT} is already in use by another process. Close the existing service or change STAKEOS_DESKTOP_PORT.`,
    );
  }

  killPid(existingPid);
  await waitForPortClosed(DESKTOP_PORT);
}

async function ensureBuildArtifacts() {
  const nextBuildIdPath = path.join(PROJECT_ROOT, '.next', 'BUILD_ID');
  const backendServerPath = path.join(PROJECT_ROOT, 'dist', 'server.cjs');

  if (PACKAGED_MODE) {
    if (!fs.existsSync(nextBuildIdPath) || !fs.existsSync(backendServerPath)) {
      throw new Error('The packaged StakeOS app is missing required build artifacts.');
    }
    updateSplashStatus('Using bundled StakeOS build...');
    return;
  }

  if (!shouldRebuildArtifacts()) {
    updateSplashStatus('Using existing StakeOS build...');
    return;
  }

  await runCommand(['run', 'build'], 'Building StakeOS desktop...');
}

async function restartStakeosServer(routeOverride) {
  if (restartingServer) {
    return;
  }

  restartingServer = true;
  const routeToRestore = routeOverride || getCurrentAppRoute();

  try {
    updateSplashStatus('Restarting local StakeOS server...');
    await stopExistingStakeosServerOnDesktopPort();
    await ensureBuildArtifacts();
    startManagedNextServer();
    await waitForServerReady();
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(`${BASE_URL}${routeToRestore}`);
      mainWindow.focus();
    }
  } finally {
    restartingServer = false;
  }
}

function navigateTo(route) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.loadURL(`${BASE_URL}${route}`);
}

function buildApplicationMenu() {
  const template = [
    {
      label: 'StakeOS',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Dashboard', click: () => navigateTo('/dashboard') },
        { label: 'Reports', click: () => navigateTo('/reports') },
        { label: 'Members', click: () => navigateTo('/members') },
        { label: 'Callings', click: () => navigateTo('/callings') },
        { label: 'Committees', click: () => navigateTo('/committees') },
        { label: 'Visual Org', click: () => navigateTo('/visual-org') },
        { label: 'Youth', click: () => navigateTo('/youth') },
        { label: 'Stake Overview', click: () => navigateTo('/stake-overview') },
        { label: 'Settings', click: () => navigateTo('/settings') },
        { label: 'Sync Center', click: () => navigateTo('/sync-center') },
        { type: 'separator' },
        { label: 'Quit StakeOS', accelerator: 'CommandOrControl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'front' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function bootstrap() {
  startControlServer();
  createSplashWindow();
  buildApplicationMenu();
  createMainWindow();

  if (APP_ICON && process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(APP_ICON);
  }

  await ensureStakeosReady();
  const initialRoute = await resolveStartupRoute();
  updateSplashStatus(initialRoute.startsWith('/settings') ? 'Opening StakeOS setup...' : 'Opening StakeOS dashboard...');
  await mainWindow.loadURL(`${BASE_URL}${initialRoute}`);
}

async function shutdownManagedNext() {
  if (!managedNextProcess || !nextProcess || nextProcess.killed) {
    return;
  }

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (nextProcess && !nextProcess.killed) {
        nextProcess.kill('SIGKILL');
      }
      resolve();
    }, 4000);

    nextProcess.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    nextProcess.kill('SIGTERM');
  });
}

app.setName('StakeOS');
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    return;
  }

  if (splashWindow) {
    splashWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  if (!quitting) {
    event.preventDefault();
    quitting = true;
    await stopControlServer();
    await shutdownManagedNext();
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await bootstrap().catch((error) => {
      dialog.showErrorBox('StakeOS Desktop', error instanceof Error ? error.message : String(error));
      app.quit();
    });
  }
});

app.whenReady().then(() => {
  bootstrap().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    appendLog('desktop-shell.log', `Bootstrap failed: ${message}`);
    dialog.showErrorBox('StakeOS Desktop', message);
    app.quit();
  });
});
