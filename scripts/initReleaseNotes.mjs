import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const releaseNotesDir = path.join(repoRoot, "release-notes");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;
const tag = `v${version}`;
const releaseNotesPath = path.join(releaseNotesDir, `${tag}.md`);

const template = `# StakeOS ${tag}

## Highlights

- Add the most important user-facing changes here.
- Add any sync, report, dashboard, or packaging fixes here.
- Add anything users should explicitly test or expect after updating.

## Install Notes

- Download the \`.dmg\` for the standard macOS install flow.
- Use the \`.zip\` if the DMG is blocked or you need the app bundle directly.
- If macOS blocks first launch, right-click the app and choose **Open**.

## Links

- [README](https://github.com/naugsco/stakeos/blob/main/README.md)
- [First Time Setup](https://github.com/naugsco/stakeos/blob/main/FIRST_TIME_SETUP.md)
- [Desktop Release Guide](https://github.com/naugsco/stakeos/blob/main/DESKTOP_RELEASE.md)
`;

mkdirSync(releaseNotesDir, { recursive: true });

if (existsSync(releaseNotesPath)) {
  console.log(`Release notes already exist: ${releaseNotesPath}`);
  process.exit(0);
}

writeFileSync(releaseNotesPath, template);
console.log(`Created release notes template: ${releaseNotesPath}`);
