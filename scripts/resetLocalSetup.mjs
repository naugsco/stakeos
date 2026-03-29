#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const home = os.homedir();

const getDesktopConfigDir = () => {
  switch (process.platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", "StakeOS");
    case "win32":
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "StakeOS");
    default:
      return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "StakeOS");
  }
};

const desktopDir = getDesktopConfigDir();
const keepBrowsers = !process.argv.includes("--remove-browsers");

const targets = [
  path.join(desktopDir, "config.json"),
  path.join(desktopDir, "stakeos.db"),
  path.join(desktopDir, "playwright-profile"),
  path.join(desktopDir, ".run")
];

if (!keepBrowsers) {
  targets.push(path.join(desktopDir, "playwright-browsers"));
}

const removed = [];
const skipped = [];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    skipped.push(target);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  removed.push(target);
}

console.log("StakeOS local setup reset complete.");
console.log(`Desktop support directory: ${desktopDir}`);
console.log("");

if (removed.length > 0) {
  console.log("Removed:");
  for (const target of removed) {
    console.log(`- ${target}`);
  }
  console.log("");
}

if (skipped.length > 0) {
  console.log("Already absent:");
  for (const target of skipped) {
    console.log(`- ${target}`);
  }
  console.log("");
}

if (keepBrowsers) {
  console.log("Playwright browsers were preserved. Use --remove-browsers to force a fresh browser install test.");
}
