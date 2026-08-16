#!/usr/bin/env node
/**
 * Ensures the native better-sqlite3 binary matches the Node.js ABI of the
 * runtime that is about to run the dev/start server.
 *
 * Why this exists
 * ---------------
 * better-sqlite3 ships a single compiled `better_sqlite3.node`. Its ABI must
 * match `process.versions.modules` of whatever runtime loads it:
 *
 *   - `next dev` / `next start` (this guard) run under SYSTEM Node  -> ABI 137 (Node 24)
 *   - A packaged desktop build runs the backend via Electron with
 *     ELECTRON_RUN_AS_NODE=1 (see main.cjs getPackagedNodeEntry)     -> ABI 145 (Electron 41)
 *
 * `electron-builder` rebuilds the binary to Electron's ABI during packaging,
 * which leaves the working tree built for Electron. The next `npm run dev`
 * would then crash with "compiled against a different Node.js version
 * (NODE_MODULE_VERSION 145 vs 137)".
 *
 * This guard loads the addon under the current Node; if the ABI doesn't match,
 * it transparently rebuilds for Node so dev/start "just works". It is a no-op
 * (a few ms) when the binary already matches.
 *
 * To go the other direction (build for Electron), use `npm run rebuild:electron`.
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);

function nativeAbiMatches() {
  try {
    // better-sqlite3 loads its native addon LAZILY inside the Database
    // constructor, not at require() time — so we must actually open a database
    // to force the dlopen and trigger the NODE_MODULE_VERSION check.
    const Database = require("better-sqlite3");
    new Database(":memory:").close();
    return true;
  } catch (error) {
    const message = String(error && error.message);
    if (/NODE_MODULE_VERSION|different Node\.js version|was compiled against/i.test(message)) {
      return false;
    }
    // Any other error (e.g. package genuinely missing) is not ours to fix here;
    // let the real command surface it rather than triggering a needless rebuild.
    return true;
  }
}

if (nativeAbiMatches()) {
  process.exit(0);
}

const targetAbi = process.versions.modules;
console.log(
  `[stakeos] better-sqlite3 is built for a different ABI than this Node runtime ` +
    `(NODE_MODULE_VERSION ${targetAbi}). Rebuilding for Node…`
);

try {
  // On Windows npm is a .cmd shim: Node refuses to spawn it without a shell.
  const isWindows = process.platform === "win32";
  execFileSync(isWindows ? "npm.cmd" : "npm", ["rebuild", "better-sqlite3"], {
    stdio: "inherit",
    shell: isWindows
  });
  console.log("[stakeos] better-sqlite3 rebuilt for Node. Continuing.");
} catch (error) {
  console.error(
    "[stakeos] Failed to rebuild better-sqlite3 for Node. " +
      "Run `npm run rebuild:node` manually.\n" +
      String(error && error.message)
  );
  process.exit(1);
}
