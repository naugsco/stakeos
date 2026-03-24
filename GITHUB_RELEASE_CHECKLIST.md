# StakeOS GitHub Release Checklist

Use this checklist when publishing a new StakeOS release to GitHub.

## Before You Build

1. Pull the latest `main`.
2. Confirm you are in the correct repo:

```bash
pwd
git remote -v
git status
```

3. Install/update dependencies:

```bash
npm install
```

4. Run the release readiness check:

```bash
npm run desktop:check-release
```

Notes:
- `Release ready: yes` means this Mac is configured for signed/notarized release builds.
- `Release ready: no` is still acceptable for unsigned GitHub release artifacts.

## Validation

1. Build the app:

```bash
npm run build
```

2. Run typecheck:

```bash
npm run typecheck
```

3. Launch the desktop app locally:

```bash
npm run desktop:start
```

4. Verify these flows:
- setup wizard loads when required config is missing
- dashboard loads with valid config
- Sync Center opens
- first sync flow still works

5. Build a packaged dry run:

```bash
npm run desktop:pack
```

6. Open the packaged app bundle from:

```text
release/mac-arm64/StakeOS Desktop.app
```

Confirm it launches.

## Build Release Artifacts

Run:

```bash
npm run desktop:release
```

Expected artifacts:

```text
release/StakeOS-Desktop-<version>-<arch>.zip
release/StakeOS-Desktop-<version>-<arch>.dmg
```

## Review Release Contents

Before uploading, confirm:
- artifact names use the expected version
- the release folder contains the new `.zip` and `.dmg`
- no local secrets were added to Git
- `.env`, `.run`, `.playwright`, and similar local files are still ignored

Useful check:

```bash
git status --short
```

## Publish To GitHub

1. Push commits to `main`.
2. Create a GitHub Release for the version tag.
3. Upload:
- the `.zip`
- the `.dmg`

4. In the release notes, include links to:
- [README.md](./README.md)
- [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)
- [DESKTOP_RELEASE.md](./DESKTOP_RELEASE.md)

## macOS Unsigned Release Note

If the build is unsigned or not notarized, include this note in the GitHub Release:

> macOS may block the app on first launch. If that happens, right-click the app and choose **Open**, or use **System Settings > Privacy & Security > Open Anyway**.

## Optional Signed Release

If Apple signing/notarization is configured on the build machine:
- verify `npm run desktop:check-release` reports `Release ready: yes`
- confirm the notarized build completes successfully before uploading
