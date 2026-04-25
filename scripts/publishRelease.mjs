import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;
const tag = `v${version}`;
const releaseDir = path.join(repoRoot, "release");
const releaseNotesPath = path.join(repoRoot, "release-notes", `${tag}.md`);
const skipBuild = process.argv.includes("--skip-build");

const run = (command, args) => {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit"
  });
};

const runOutput = (command, args) =>
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  }).trim();

const parseRepoSlug = () => {
  const remoteUrl = runOutput("git", ["remote", "get-url", "origin"]);
  const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Could not determine GitHub repo from remote URL: ${remoteUrl}`);
  }
  return match[1];
};

const requireReleaseNotes = () => {
  if (!existsSync(releaseNotesPath)) {
    throw new Error(
      `Missing release notes for ${tag}.\nCreate them first with: npm run release:notes:init`
    );
  }
};

const collectAssets = () => {
  if (!existsSync(releaseDir)) {
    throw new Error(`Release directory not found: ${releaseDir}`);
  }

  const prefix = `StakeOS-Desktop-${version}-`;
  const files = readdirSync(releaseDir)
    .filter((name) => name.startsWith(prefix) || name === "latest-mac.yml")
    .filter((name) => /\.(dmg|zip|blockmap|yml)$/.test(name))
    .map((name) => path.join(releaseDir, name))
    .sort();

  const required = [
    `StakeOS-Desktop-${version}-arm64.dmg`,
    `StakeOS-Desktop-${version}-arm64.zip`,
    `latest-mac.yml`
  ];

  for (const fileName of required) {
    const fullPath = path.join(releaseDir, fileName);
    if (!files.includes(fullPath)) {
      throw new Error(`Expected release artifact is missing: ${fullPath}`);
    }
  }

  return files;
};

const ensureRelease = (repoSlug) => {
  try {
    run("gh", ["release", "view", tag, "--repo", repoSlug]);
    run("gh", ["release", "edit", tag, "--repo", repoSlug, "--title", tag, "--notes-file", releaseNotesPath]);
  } catch {
    run("gh", [
      "release",
      "create",
      tag,
      "--repo",
      repoSlug,
      "--target",
      "main",
      "--title",
      tag,
      "--notes-file",
      releaseNotesPath
    ]);
  }
};

const main = () => {
  requireReleaseNotes();

  if (!skipBuild) {
    run("npm", ["run", "desktop:release"]);
  }

  const repoSlug = parseRepoSlug();
  const assets = collectAssets();

  ensureRelease(repoSlug);
  run("gh", ["release", "upload", tag, "--repo", repoSlug, "--clobber", ...assets]);
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
