# StakeOS Desktop Release Guide

This guide covers how to build and share the Electron desktop version of StakeOS.

## Current Release Model

StakeOS Desktop is currently packaged for macOS through Electron.

Important constraints:
- the desktop app still depends on local PostgreSQL
- the user still needs a valid LCR custom report URL
- the user still logs in to LCR manually through the Playwright browser session
- macOS signing/notarization is not configured yet, so local release builds use ad-hoc signing

## What the Release Produces

Run:

```bash
npm run desktop:release
```

This does three things:
1. removes the previous `release/` folder
2. builds the Next.js app and backend bundles
3. packages a macOS desktop release zip

Release artifacts are written to:

```text
release/
```

Typical artifact name:

```text
StakeOS-Desktop-<version>-<arch>.zip
```

Example:

```text
release/StakeOS-Desktop-1.0.0-arm64.zip
```

## Fast Validation Build

If you only want to verify the packaged app structure without generating the final zip, run:

```bash
npm run desktop:pack
```

This creates the unpacked macOS app bundle in:

```text
release/mac-arm64/StakeOS Desktop.app
```

## Recommended Release Checklist

Before building a release:

1. pull the latest code
2. run `npm install`
3. run `npm run build`
4. run `npm run typecheck`
5. confirm the desktop app still launches locally with `npm run desktop:start`
6. confirm the first-run setup flow still works
7. confirm a packaged dry build works with `npm run desktop:pack`
8. build the release zip with `npm run desktop:release`

## What To Share With Another User

For a GitHub release or direct handoff, share:
- the source repo link
- the desktop release zip from `release/`
- the installation guide: [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)

The receiving user still needs:
- PostgreSQL installed and running
- a local `stakeos` database
- a valid `DATABASE_URL`
- their own LCR custom report URL
- Playwright Chromium installed if they are running from source

## Packaging Notes

StakeOS Desktop currently uses:
- `electron-builder`
- `asar: false`

That `asar: false` setting is intentional for now. Next.js production runtime expects a real working directory for `.next` and related server assets. This should be revisited later, but it is the correct pragmatic choice for a working release today.

## GitHub Release Workflow

A practical GitHub workflow is:

1. push the source changes to `main`
2. run `npm run desktop:release`
3. upload the generated zip from `release/` to a GitHub Release
4. link users to:
   - the release asset
   - [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)
   - MCP setup instructions in [README.md](./README.md)

## Not Yet Included

These are not done yet:
- signed Developer ID builds
- notarized macOS releases
- `.dmg` installer
- automatic PostgreSQL installation
- automatic Playwright/Chromium installation inside the packaged app

Those are the next packaging-quality steps after this release baseline.
